import requests
from bs4 import BeautifulSoup
import json

def extraer_todos_los_sets():
    """
    Extrae la lista completa de sets (expansiones) de Pokellector
    y los guarda en un archivo allsets.json.
    """
    url = "https://www.pokellector.com/sets"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    }

    try:
        print("Conectando con Pokellector para obtener los sets...")
        respuesta = requests.get(url, headers=headers)
        respuesta.raise_for_status()
        
        soup = BeautifulSoup(respuesta.text, 'html.parser')
        
        sets_extraidos = []
        nombres_vistos = set()
        
        # Selecciona todos los enlaces dentro de los contenedores div de la columna izquierda
        # Esto filtra enlaces de la barra de navegación superior o menús laterales
        enlaces_sets = soup.select('#columnLeft > div a')
        
        for a in enlaces_sets:
            span = a.find('span')
            # Si el enlace contiene un span, asumimos que es un botón de set
            if span:
                nombre_set = span.text.strip()
                href = a.get('href', '')
                
                # Reconstruye la URL completa
                if href.startswith('/'):
                    url_completa = f"https://www.pokellector.com{href}"
                else:
                    url_completa = href
                
                # Evita duplicados en caso de que existan en la página
                if nombre_set not in nombres_vistos and nombre_set != "":
                    nombres_vistos.add(nombre_set)
                    sets_extraidos.append({
                        "nombre_set": nombre_set,
                        "url_origen": url_completa
                    })
                    
        # Guarda los datos en el archivo JSON solicitado
        with open('allsets.json', 'w', encoding='utf-8') as archivo_json:
            json.dump(sets_extraidos, archivo_json, indent=4, ensure_ascii=False)
            
        print(f"Extracción exitosa. Se encontraron {len(sets_extraidos)} sets.")
        print("Los datos han sido guardados en el archivo 'allsets.json'.")

    except Exception as e:
        print(f"Ocurrió un error durante la extracción: {e}")

if __name__ == "__main__":
    extraer_todos_los_sets()