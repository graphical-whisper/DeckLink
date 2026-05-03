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

def preprocesar_imagen(img):
    """Mejora el contraste conservando la imagen en escala de grises (CLAHE)."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    suavizado = cv2.bilateralFilter(gray, 11, 17, 17)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    return clahe.apply(suavizado)

def extraer_texto(imagen_procesada):
    """Extrae el texto general de la carta."""
    configuracion_ocr = r'--oem 3 --psm 4'
    return pytesseract.image_to_string(imagen_procesada, config=configuracion_ocr)

def extraer_numero_focalizado(img):
    alto, ancho = img.shape[:2]
    
    # Coordenadas con un ligero ajuste en 'y_fin' para eliminar la basura inferior
    y_inicio = int(alto * 0.87)
    y_fin = int(alto * 0.895) 
    x_inicio = int(ancho * 0.20)
    x_fin = int(ancho * 0.30)
    
    recorte = img[y_inicio:y_fin, x_inicio:x_fin]
    
    # 1. Escala de grises y aumento de resolución
    gray = cv2.cvtColor(recorte, cv2.COLOR_BGR2GRAY)
    gray = cv2.resize(gray, None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)
    
    # 2. Desenfoque suave para unificar los píxeles internos del texto
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # 3. Umbral Global (La solución al texto hueco)
    # Todo píxel con intensidad menor a 90 (muy oscuro) será negro (0).
    # Todo píxel mayor a 90 (halo blanco y fondo gris) será blanco (255).
    _, thresh = cv2.threshold(blur, 90, 255, cv2.THRESH_BINARY)
    
    # 4. Margen blanco estabilizador
    thresh_final = cv2.copyMakeBorder(
        thresh, top=15, bottom=15, left=15, right=15, 
        borderType=cv2.BORDER_CONSTANT, value=[255, 255, 255]
    )
    
    # Guardar para validación
    cv2.imwrite("debug_recorte_filtro.jpg", thresh_final)
    
    # PSM 7 es el modo óptimo para una sola línea de texto
    config = r'--oem 3 --psm 7 -c tessedit_char_whitelist=0123456789/'
    texto_numero = pytesseract.image_to_string(thresh_final, config=config)
    
    return texto_numero
    
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
        
        # Cargar imagen original una sola vez
        img_original = cv2.imread(ruta_fotografia)
        if img_original is None:
            raise ValueError(f"No se pudo cargar la imagen: {ruta_fotografia}")
            
        # Procesamiento General
        img_procesada = preprocesar_imagen(img_original)

        # Extraer el texto (modifique la función extraer_texto si quiere añadir el idioma)
        texto_general = extraer_texto(img_procesada)

        # --- AÑADA ESTAS LÍNEAS AQUÍ ---
        print("\n--- TEXTO GENERAL EXTRAÍDO ---")
        print(texto_general)
        print("-------------------------------\n")
        # ------------------------------

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