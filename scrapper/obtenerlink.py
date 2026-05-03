import requests
from bs4 import BeautifulSoup
import json
import time

def extraer_enlaces_masivo():
    # 1. Cargar la lista de expansiones
    try:
        with open('allsets.json', 'r', encoding='utf-8') as archivo:
            sets = json.load(archivo)
    except FileNotFoundError:
        print("Error: No se encontró 'allsets.json'. Ejecuta extraersets.py primero.")
        return

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    }

    todos_los_enlaces = []
    total_sets = len(sets)

    print(f"Se encontraron {total_sets} expansiones. Iniciando extracción de enlaces...")

    # 2. Iterar sobre cada expansión
    for indice, data_set in enumerate(sets):
        url_set = data_set['url_origen']
        nombre_set = data_set['nombre_set']
        
        print(f"[{indice + 1}/{total_sets}] Escaneando: {nombre_set}")
        
        try:
            respuesta = requests.get(url_set, headers=headers)
            respuesta.raise_for_status()
            soup = BeautifulSoup(respuesta.text, 'html.parser')
            
            # Extrae la ruta base (Ej: "/Ascended-Heroes-Expansion") para usarla en los filtros
            ruta_base = url_set.replace("https://www.pokellector.com", "").rstrip('/')
            
            enlaces_set_actual = set() # Usamos un 'set' de Python para evitar duplicados automáticamente
            
            for a in soup.find_all('a', href=True):
                href = a['href']
                
                # --- FILTROS DE EXCLUSIÓN ---
                
                # 1. Ignorar parámetros de vista (?list_display=...)
                if '?' in href:
                    continue
                # 2. Ignorar subdominios (jp.) o URLs HTTP inseguras
                if 'jp.pokellector.com' in href or href.startswith('http://'):
                    continue
                # 3. Ignorar la raíz de la expansión (ej. "/Ascended-Heroes-Expansion/")
                if href == f"{ruta_base}/" or href == url_set:
                    continue
                # 4. Asegurar que el enlace pertenece a la expansión actual
                if ruta_base not in href:
                    continue
                
                # 5. Validar que tenga una imagen dentro (es una carta de la cuadrícula)
                if a.find('img'):
                    if href.startswith('/'):
                        enlace_completo = f"https://www.pokellector.com{href}"
                    else:
                        enlace_completo = href
                        
                    enlaces_set_actual.add(enlace_completo)
            
            print(f"  -> {len(enlaces_set_actual)} cartas extraídas.")
            todos_los_enlaces.extend(list(enlaces_set_actual))
            
            # Pausa de 1.5s para no bloquear la IP al escanear todos los sets
            time.sleep(1.5)
            
        except Exception as e:
            print(f"  -> Error en {nombre_set}: {e}")

    # 3. Guardar el resultado global en un archivo
    print(f"\nFinalizado. Total de cartas a procesar en todos los sets: {len(todos_los_enlaces)}")
    with open('enlaces_cartas.json', 'w', encoding='utf-8') as archivo_salida:
        json.dump(todos_los_enlaces, archivo_salida, indent=4)
        
    print("Todos los enlaces han sido guardados en 'enlaces_cartas.json'.")

if __name__ == "__main__":
    extraer_enlaces_masivo()