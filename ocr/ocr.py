import cv2
import pytesseract
import json
import re
import os
import numpy as np
from rapidfuzz import process, fuzz

# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def cargar_base_de_datos(ruta_archivo):
    """Carga y parsea el archivo JSON."""
    if not os.path.exists(ruta_archivo):
        raise FileNotFoundError(f"El archivo no fue encontrado en: {ruta_archivo}")
    with open(ruta_archivo, 'r', encoding='utf-8') as archivo:
        return json.load(archivo)

def aislar_carta(img):
    """Detecta los bordes físicos de la carta. Ignora si la imagen ya está recortada."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    edged = cv2.Canny(blur, 50, 150)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    dilated = cv2.dilate(edged, kernel, iterations=1)
    contornos, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if not contornos:
        return img

    contorno_mayor = max(contornos, key=cv2.contourArea)
    x, y, w, h = cv2.boundingRect(contorno_mayor)
    alto_img, ancho_img = img.shape[:2]
    area_imagen = alto_img * ancho_img
    area_contorno = w * h

    if area_contorno > (area_imagen * 0.90):
        return img
    if (area_imagen * 0.4) < area_contorno <= (area_imagen * 0.90):
        return img[y:y+h, x:x+w]
    return img


def preprocesar_imagen(img):
    """
    Mejora el contraste usando CLAHE antes de binarizar.
    Usa THRESH_BINARY (no INV) para preservar texto blanco/claro sobre
    fondos oscuros holográficos. El THRESH_BINARY_INV anterior invertía
    el ruido holográfico y destruía el texto.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)

    # CLAHE equaliza el contraste local — compensa los brillos holográficos
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    gray = clahe.apply(gray)

    blur = cv2.GaussianBlur(gray, (3, 3), 0)

    # THRESH_BINARY (no INV): el texto claro sobre fondo oscuro queda blanco
    thresh = cv2.adaptiveThreshold(
        blur, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,   # corregido: era THRESH_BINARY_INV
        15, 5
    )
    return thresh


def extraer_texto(imagen_procesada):
    """Extrae el texto general de la carta."""
    configuracion_ocr = r'--oem 3 --psm 4'
    return pytesseract.image_to_string(imagen_procesada, config=configuracion_ocr, lang='eng+spa')


def extraer_numero_focalizado(img):
    """
    Extrae el número de carta (ej. '086/132') del pie de la carta.

    Diagnóstico del fallo anterior:
    - El texto del número mide ~4px de alto en una imagen de 600px: extremadamente pequeño.
    - La barra '/' se confunde con '4', '7' o ',1' según el modo PSM.
    - Solución: escala 10x + múltiples PSM + regex que tolera la barra mal leída.

    Coordenadas calibradas empíricamente para cartas Pokémon estándar sin márgenes.
    """
    alto, ancho = img.shape[:2]

    # Banda horizontal donde vive el número: ~93.5% .. 97.8% de la altura,
    # mitad izquierda de la carta (el número aparece después del ícono de set).
    y_inicio = int(alto * 0.935)
    y_fin    = int(alto * 0.978)
    x_inicio = 0
    x_fin    = int(ancho * 0.50)

    recorte = img[y_inicio:y_fin, x_inicio:x_fin]

    gray = cv2.cvtColor(recorte, cv2.COLOR_BGR2GRAY)

    # Escala 10x — el texto es demasiado pequeño para Tesseract a resolución original
    scaled = cv2.resize(gray, None, fx=10, fy=10, interpolation=cv2.INTER_CUBIC)
    blur   = cv2.GaussianBlur(scaled, (3, 3), 0)
    _, thresh = cv2.threshold(blur, 128, 255, cv2.THRESH_BINARY)

    thresh_final = cv2.copyMakeBorder(
        thresh, top=40, bottom=40, left=40, right=40,
        borderType=cv2.BORDER_CONSTANT, value=[255, 255, 255]
    )

    # Guardar para validación visual
    cv2.imwrite("debug_recorte_filtro.jpg", thresh_final)

    # PSM 6 (bloque), 11 (texto disperso) y 12 cubren distintos layouts del pie
    outputs = []
    for psm in [6, 11, 12]:
        cfg = f'--oem 3 --psm {psm}'
        txt = pytesseract.image_to_string(thresh_final, config=cfg).strip()
        outputs.append(txt)

    return '\n'.join(outputs)


def _parsear_numero_de_texto_focalizado(texto_focalizado):
    """
    Extrae 'NNN/NNN' del texto OCR tolerando que la barra '/'
    sea leída como '4', '7', ',1', etc.

    Devuelve la cadena 'NNN/NNN' o None si no se puede extraer.
    """
    # Caso 1: la barra sobrevivió intacta
    m = re.search(r'(\d{1,3})\s*/\s*(\d{2,3})', texto_focalizado)
    if m:
        return f"{m.group(1).zfill(3)}/{m.group(2)}"

    # Caso 2: NNN + 1 carácter basura + NNN  (ej. "0864132" o "086,132")
    texto_limpio = re.sub(r'[^0-9a-zA-Z,./]', ' ', texto_focalizado)
    m = re.search(r'(0\d{2}).(\d{3})', texto_limpio)
    if m:
        return f"{m.group(1)}/{m.group(2)}"

    # Caso 3: extraer solo dígitos y buscar el patrón 0NN···NNN
    solo_digitos = re.sub(r'[^0-9]', '', texto_focalizado)
    m = re.search(r'(0\d{2})\d{0,2}(\d{3})', solo_digitos)
    if m:
        return f"{m.group(1)}/{m.group(2)}"

    return None


def identificar_carta(texto_general, texto_focalizado, base_de_datos):
    """Cruza los textos extraídos con la base de datos aplicando desambiguación por prefijo."""
    patron_numero = re.compile(r'\b\d{1,3}\s*/\s*\d{1,3}\b')

    # 1. Intentar parsear el número focalizado con el método robusto
    numero_parseado = _parsear_numero_de_texto_focalizado(texto_focalizado)
    if numero_parseado:
        for carta in base_de_datos:
            if carta.get("numero") == numero_parseado:
                return carta

    # 2. Búsqueda por regex exacto en texto focalizado crudo
    numeros_focalizados = patron_numero.findall(texto_focalizado)
    numeros_limpios = [num.replace(" ", "") for num in numeros_focalizados]
    for carta in base_de_datos:
        if carta.get("numero") in numeros_limpios:
            return carta

    # 3. Búsqueda por regex en texto general
    numeros_generales = patron_numero.findall(texto_general)
    numeros_generales_limpios = [num.replace(" ", "") for num in numeros_generales]
    for carta in base_de_datos:
        if carta.get("numero") in numeros_generales_limpios:
            return carta

    # 4. Fuzzy matching sobre el nombre
    nombres_db = {carta["id_carta"]: carta["nombre"] for carta in base_de_datos}
    nombres_lista = list(nombres_db.values())
    lineas = [linea.strip() for linea in texto_general.split('\n') if len(linea) > 4]

    mejor_coincidencia_global = None
    puntaje_maximo = 0

    for linea in lineas:
        resultado = process.extractOne(linea, nombres_lista, scorer=fuzz.token_sort_ratio)
        if resultado:
            nombre_match, puntaje, _ = resultado
            if puntaje > puntaje_maximo:
                puntaje_maximo = puntaje
                mejor_coincidencia_global = nombre_match

    # 5. Desambiguación por prefijo entre variantes del mismo nombre
    if puntaje_maximo > 60:
        variantes = [c for c in base_de_datos if c["nombre"] == mejor_coincidencia_global]

        if len(variantes) == 1:
            return variantes[0]

        if len(variantes) > 1:
            lectura_numerica_pura = re.sub(r'[^0-9]', '', texto_focalizado)

            for variante in variantes:
                num_original = variante.get("numero", "")
                if '/' in num_original:
                    prefijo = num_original.split('/')[0]
                    prefijo_sin_cero = prefijo.lstrip('0')
                    if prefijo in lectura_numerica_pura or (prefijo_sin_cero and prefijo_sin_cero in lectura_numerica_pura):
                        return variante

            return variantes[0]

    return None


def main():
    ruta_db = os.path.join("data", "cards.json")
    ruta_fotografia = os.path.join("cartaprueba", "mabsol86.1.jpg")

    try:
        base_de_datos = cargar_base_de_datos(ruta_db)

        img_cruda = cv2.imread(ruta_fotografia)
        if img_cruda is None:
            raise ValueError(f"No se pudo cargar la imagen: {ruta_fotografia}")

        # 1. Aislar la carta del fondo
        img_original = aislar_carta(img_cruda)
        cv2.imwrite("debug_carta_aislada.jpg", img_original)

        # 2. Texto general (nombre, ataques, etc.)
        img_procesada = preprocesar_imagen(img_original)
        texto_general = extraer_texto(img_procesada)

        print("\n--- TEXTO GENERAL EXTRAÍDO ---")
        print(texto_general)
        print("-------------------------------\n")

        # 3. Número focalizado (pie de carta)
        texto_numero = extraer_numero_focalizado(img_original)
        print("\n--- LECTURA FOCALIZADA DE NÚMERO (RAW) ---")
        print(texto_numero.strip())
        print("-------------------------------------------\n")

        # 4. Parseo del número
        numero_parseado = _parsear_numero_de_texto_focalizado(texto_numero)
        print(f"--- NÚMERO PARSEADO: {numero_parseado} ---\n")

        # 5. Identificación
        carta_encontrada = identificar_carta(texto_general, texto_numero, base_de_datos)

        if carta_encontrada:
            print("Resultado de la identificación:")
            print(json.dumps(carta_encontrada, indent=4, ensure_ascii=False))
        else:
            print("No se logró identificar la carta en la base de datos proporcionada.")

    except Exception as e:
        print(f"\nError en la ejecución: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()