import cv2
import pytesseract
import json
import re
import os
import difflib
import numpy as np

# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# ---------------------------------------------------------------------------
# Reemplazo de rapidfuzz usando solo stdlib (difflib)
# ---------------------------------------------------------------------------

def _token_sort_ratio(s1, s2):
    t1 = ' '.join(sorted(re.sub(r'[^a-z0-9]', ' ', s1.lower()).split()))
    t2 = ' '.join(sorted(re.sub(r'[^a-z0-9]', ' ', s2.lower()).split()))
    return difflib.SequenceMatcher(None, t1, t2).ratio() * 100

def _extract_one(query, choices, cutoff=60):
    best_score, best_match = 0, None
    for c in choices:
        score = _token_sort_ratio(query, c)
        if score > best_score:
            best_score, best_match = score, c
    if best_score >= cutoff:
        return best_match, best_score
    return None, 0


# ---------------------------------------------------------------------------
# Funciones principales
# ---------------------------------------------------------------------------

def cargar_base_de_datos(ruta_archivo):
    if not os.path.exists(ruta_archivo):
        raise FileNotFoundError(f"El archivo no fue encontrado en: {ruta_archivo}")
    with open(ruta_archivo, 'r', encoding='utf-8') as archivo:
        return json.load(archivo)


def aislar_carta(img):
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
    area_imagen   = alto_img * ancho_img
    area_contorno = w * h
    if area_contorno > (area_imagen * 0.90):
        return img
    if (area_imagen * 0.4) < area_contorno <= (area_imagen * 0.90):
        return img[y:y+h, x:x+w]
    return img


def preprocesar_imagen(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    gray  = clahe.apply(gray)
    blur   = cv2.GaussianBlur(gray, (3, 3), 0)
    thresh = cv2.adaptiveThreshold(
        blur, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        15, 5
    )
    return thresh


def extraer_texto(imagen_procesada):
    return pytesseract.image_to_string(
        imagen_procesada, config=r'--oem 3 --psm 4', lang='eng+spa'
    )


def extraer_numero_focalizado(img):
    alto, ancho = img.shape[:2]
    y_inicio = int(alto * 0.935)
    y_fin    = int(alto * 0.978)
    recorte  = img[y_inicio:y_fin, 0:int(ancho * 0.50)]
    gray   = cv2.cvtColor(recorte, cv2.COLOR_BGR2GRAY)
    scaled = cv2.resize(gray, None, fx=10, fy=10, interpolation=cv2.INTER_CUBIC)
    blur   = cv2.GaussianBlur(scaled, (3, 3), 0)
    _, thresh = cv2.threshold(blur, 128, 255, cv2.THRESH_BINARY)
    thresh_final = cv2.copyMakeBorder(
        thresh, 40, 40, 40, 40,
        borderType=cv2.BORDER_CONSTANT, value=[255, 255, 255]
    )
    cv2.imwrite("debug_recorte_filtro.jpg", thresh_final)
    outputs = []
    for psm in [6, 11, 12]:
        txt = pytesseract.image_to_string(
            thresh_final, config=f'--oem 3 --psm {psm}'
        ).strip()
        outputs.append(txt)
    return '\n'.join(outputs)


def _parsear_numero(texto_focalizado):
    # 1. Barra intacta
    m = re.search(r'(\d{1,3})\s*/\s*(\d{2,3})', texto_focalizado)
    if m:
        return f"{m.group(1).zfill(3)}/{m.group(2)}"
    # 2. Compactar espacios -> NNN + 1-3 chars no-digito + NNN
    compact = re.sub(r'\s+', '', texto_focalizado)
    m = re.search(r'(0\d{2})\D{0,3}(\d{3})', compact)
    if m:
        return f"{m.group(1)}/{m.group(2)}"
    # 3. Solo digitos: "0864132" -> "086/132"
    digits = re.sub(r'[^0-9]', '', texto_focalizado)
    m = re.search(r'(0\d{2})\d{0,2}(\d{3})', digits)
    if m:
        return f"{m.group(1)}/{m.group(2)}"
    return None


def identificar_carta(texto_general, texto_focalizado, base_de_datos):
    patron_numero = re.compile(r'\b\d{1,3}\s*/\s*\d{1,3}\b')

    # 1. Parseo robusto del numero focalizado
    numero_parseado = _parsear_numero(texto_focalizado)
    if numero_parseado:
        for carta in base_de_datos:
            if carta.get("numero") == numero_parseado:
                return carta

    # 2. Regex exacto en texto focalizado crudo
    for num in [n.replace(" ", "") for n in patron_numero.findall(texto_focalizado)]:
        for carta in base_de_datos:
            if carta.get("numero") == num:
                return carta

    # 3. Regex exacto en texto general
    for num in [n.replace(" ", "") for n in patron_numero.findall(texto_general)]:
        for carta in base_de_datos:
            if carta.get("numero") == num:
                return carta

    # 4. Fuzzy matching sobre el nombre
    nombres_lista = [carta["nombre"] for carta in base_de_datos]
    lineas = [l.strip() for l in texto_general.split('\n') if len(l.strip()) > 4]
    mejor_nombre, puntaje_maximo = None, 0
    for linea in lineas:
        match, score = _extract_one(linea, nombres_lista, cutoff=60)
        if score > puntaje_maximo:
            puntaje_maximo, mejor_nombre = score, match

    if mejor_nombre:
        variantes = [c for c in base_de_datos if c["nombre"] == mejor_nombre]
        if len(variantes) == 1:
            return variantes[0]
        if len(variantes) > 1:
            lectura_num = re.sub(r'[^0-9]', '', texto_focalizado)
            for variante in variantes:
                num_orig = variante.get("numero", "")
                if '/' in num_orig:
                    prefijo = num_orig.split('/')[0]
                    prefijo_sin_cero = prefijo.lstrip('0')
                    if prefijo in lectura_num or (prefijo_sin_cero and prefijo_sin_cero in lectura_num):
                        return variante
            return variantes[0]

    return None


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    ruta_db         = os.path.join("data", "cards.json")
    ruta_fotografia = os.path.join("cartaprueba", "mabsol86.1.jpg")

    try:
        base_de_datos = cargar_base_de_datos(ruta_db)

        img_cruda = cv2.imread(ruta_fotografia)
        if img_cruda is None:
            raise ValueError(f"No se pudo cargar la imagen: {ruta_fotografia}")

        img_original = aislar_carta(img_cruda)
        cv2.imwrite("debug_carta_aislada.jpg", img_original)

        img_procesada = preprocesar_imagen(img_original)
        texto_general = extraer_texto(img_procesada)
        print("\n--- TEXTO GENERAL EXTRAÍDO ---")
        print(texto_general)
        print("-------------------------------\n")

        texto_numero = extraer_numero_focalizado(img_original)
        print("--- LECTURA FOCALIZADA DE NÚMERO (RAW) ---")
        print(texto_numero.strip())
        print("-------------------------------------------\n")

        numero_parseado = _parsear_numero(texto_numero)
        print(f"--- NÚMERO PARSEADO: {numero_parseado} ---\n")

        carta_encontrada = identificar_carta(texto_general, texto_numero, base_de_datos)

        if carta_encontrada:
            print("Resultado de la identificación:")
            print(json.dumps(carta_encontrada, indent=4, ensure_ascii=False))
        else:
            print("No se logró identificar la carta en la base de datos.")

    except Exception as e:
        import traceback
        print(f"\nError en la ejecución: {e}")
        traceback.print_exc()


if __name__ == "__main__":
    main()