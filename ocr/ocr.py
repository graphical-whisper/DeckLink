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
    
    # Detección de bordes
    edged = cv2.Canny(blur, 50, 150)
    
    # Dilatación para cerrar líneas rotas en el contorno
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    dilated = cv2.dilate(edged, kernel, iterations=1)
    
    # Encontrar contornos externos
    contornos, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contornos:
        return img
        
    # Seleccionar el contorno con mayor área
    contorno_mayor = max(contornos, key=cv2.contourArea)
    x, y, w, h = cv2.boundingRect(contorno_mayor)
    
    alto_img, ancho_img = img.shape[:2]
    area_imagen = alto_img * ancho_img
    area_contorno = w * h
    
    # 1. SALVAGUARDA: Si el contorno ocupa más del 90% de la imagen, 
    # significa que la imagen original ya es la carta pura. No se recorta.
    if area_contorno > (area_imagen * 0.90):
        return img
        
    # 2. RECORTAR: Si el contorno es razonable (entre 40% y 90%), 
    # es una carta con fondo externo. Procedemos a aislarla.
    if (area_imagen * 0.4) < area_contorno <= (area_imagen * 0.90):
        return img[y:y+h, x:x+w]
        
    return img
def preprocesar_imagen(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)

    # CLAHE equalizes local contrast — handles holographic glare
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    gray = clahe.apply(gray)

    blur = cv2.GaussianBlur(gray, (3, 3), 0)

    # THRESH_BINARY (not INV) — keeps white text white on dark background
    thresh = cv2.adaptiveThreshold(
        blur, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,   # <-- changed from THRESH_BINARY_INV
        15, 5
    )
    return thresh

def extraer_texto(imagen_procesada):
    """Extrae el texto general de la carta."""
    configuracion_ocr = r'--oem 3 --psm 4'
    return pytesseract.image_to_string(imagen_procesada, config=configuracion_ocr, lang='eng+spa')

def extraer_numero_focalizado(img):
    alto, ancho = img.shape[:2]

    # Push the crop lower — the stamp is right at the bottom edge
    y_inicio = int(alto * 0.955)   # was 0.915
    y_fin    = int(alto * 0.995)   # was 0.955
    x_inicio = int(ancho * 0.07)   # was 0.17 — stamp starts further left
    x_fin    = int(ancho * 0.30)   # was 0.29

    recorte = img[y_inicio:y_fin, x_inicio:x_fin]

    gray = cv2.cvtColor(recorte, cv2.COLOR_BGR2GRAY)
    gray = cv2.resize(gray, None, fx=4, fy=4, interpolation=cv2.INTER_CUBIC)

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(4, 4))
    gray = clahe.apply(gray)

    blur = cv2.GaussianBlur(gray, (3, 3), 0)

    # Raise threshold to 128 — catches light-colored (yellow/white) digits
    _, thresh = cv2.threshold(blur, 128, 255, cv2.THRESH_BINARY)

    thresh_final = cv2.copyMakeBorder(
        thresh, 20, 20, 20, 20,
        borderType=cv2.BORDER_CONSTANT, value=[255, 255, 255]
    )
    cv2.imwrite("debug_recorte_filtro.jpg", thresh_final)

    # Try PSM 8 (single word) if PSM 7 gives empty output
    config = r'--oem 3 --psm 7 -c tessedit_char_whitelist=0123456789/'
    return pytesseract.image_to_string(thresh_final, config=config)

def identificar_carta(texto_general, texto_focalizado, base_de_datos):
    """Cruza los textos extraídos con la base de datos aplicando desambiguación por prefijo."""
    patron_numero = re.compile(r'\b\d{1,3}\s*/\s*\d{1,3}\b')
    
    # 1. Búsqueda prioritaria por regex exacto
    numeros_focalizados = patron_numero.findall(texto_focalizado)
    numeros_limpios = [num.replace(" ", "") for num in numeros_focalizados]
    for carta in base_de_datos:
        if carta.get("numero") in numeros_limpios:
            return carta

    numeros_generales = patron_numero.findall(texto_general)
    numeros_generales_limpios = [num.replace(" ", "") for num in numeros_generales]
    for carta in base_de_datos:
        if carta.get("numero") in numeros_generales_limpios:
            return carta

    # 2. Búsqueda por coincidencia difusa del nombre (Fuzzy Matching)
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

    # 3. Desambiguación de múltiples variantes mediante aislamiento de prefijo
    if puntaje_maximo > 60:
        variantes = [c for c in base_de_datos if c["nombre"] == mejor_coincidencia_global]
        
        if len(variantes) == 1:
            return variantes[0]
        
        if len(variantes) > 1:
            # Eliminar saltos de línea y caracteres no numéricos de la lectura OCR
            lectura_numerica_pura = re.sub(r'[^0-9]', '', texto_focalizado)
            
            for variante in variantes:
                num_original = variante.get("numero", "")
                if '/' in num_original:
                    # Extraer el numerador (ej. "086" de "086/132")
                    prefijo = num_original.split('/')[0]
                    prefijo_sin_cero = prefijo.lstrip('0')
                    
                    # Validar si el prefijo existe dentro de la lectura capturada
                    if prefijo in lectura_numerica_pura or (prefijo_sin_cero and prefijo_sin_cero in lectura_numerica_pura):
                        return variante
            
            # Retorno de seguridad si la validación falla
            return variantes[0]

    return None

def main():
    ruta_db = os.path.join("data", "cards.json")
    ruta_fotografia = os.path.join("cartaprueba", "mabsol86.1.jpg")
    
    try:
        base_de_datos = cargar_base_de_datos(ruta_db)
        
        # Cargar imagen original
        img_cruda = cv2.imread(ruta_fotografia)
        if img_cruda is None:
            raise ValueError(f"No se pudo cargar la imagen: {ruta_fotografia}")
            
        # 1. ESTANDARIZACIÓN: Aislar la carta del fondo
        img_original = aislar_carta(img_cruda)
        
        # 2. Guardar la carta aislada para validación visual (Opcional)
        cv2.imwrite("debug_carta_aislada.jpg", img_original)
            
        # Procesamiento General
        img_procesada = preprocesar_imagen(img_original)
        texto_general = extraer_texto(img_procesada)
        
        print("\n--- TEXTO GENERAL EXTRAÍDO ---")
        print(texto_general)
        print("-------------------------------\n")
        
        # Procesamiento Focalizado (Esquina inferior)
        texto_numero = extraer_numero_focalizado(img_original)
        print("\n--- LECTURA FOCALIZADA DE NÚMERO ---")
        print(texto_numero.strip())
        print("------------------------------------\n")
        
        # Identificación
        carta_encontrada = identificar_carta(texto_general, texto_numero, base_de_datos)
        
        if carta_encontrada:
            print("Resultado de la identificación:")
            print(json.dumps(carta_encontrada, indent=4, ensure_ascii=False))
        else:
            print("No se logró identificar la carta en la base de datos proporcionada.")
            
    except Exception as e:
        print(f"\nError en la ejecución: {e}")

if __name__ == "__main__":
    main()