import requests
from bs4 import BeautifulSoup
import time
import json
import sys
import os

def extraer_datos_carta(url, identificador):
    """
    Extrae los datos específicos de una carta adaptados a la estructura JSON final.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    }

    datos_carta = {
        "id_carta": f"c-{identificador:04d}",
        "url_origen": url, # Se conserva para que el script sepa qué cartas ya procesó
        "nombre": None,
        "juego": "Pokémon",
        "edicion": None,
        "numero": None,
        "rareza": None,
        "imagen_url": None,
        "descripcion": "",
        "tipo": ["default"]
    }

    try:
        respuesta = requests.get(url, headers=headers)
        respuesta.raise_for_status()
        soup = BeautifulSoup(respuesta.text, 'html.parser')

        # 1. Nombre
        h1 = soup.find('h1')
        if h1:
            datos_carta["nombre"] = h1.text.strip()
        else:
            title = soup.find('title')
            if title:
                datos_carta["nombre"] = title.text.split('-')[0].strip()

        # 2. Rareza
        etiqueta_rareza = soup.find('strong', string='Rarity:')
        if etiqueta_rareza and etiqueta_rareza.parent:
            datos_carta["rareza"] = etiqueta_rareza.parent.text.replace('Rarity:', '').strip()

        # 3. Edición
        etiqueta_set = soup.find('strong', string='Set:')
        if etiqueta_set and etiqueta_set.parent.find('a'):
            datos_carta["edicion"] = etiqueta_set.parent.find('a').text.strip()

        # 4. Número
        etiqueta_carta = soup.find('strong', string='Card:')
        if etiqueta_carta and etiqueta_carta.parent.find('a'):
            datos_carta["numero"] = etiqueta_carta.parent.find('a').text.strip()

        # 5. Imagen
        imagenes = soup.select('#columnLeft img')
        for img in imagenes:
            src = img.get('src', '')
            if src and 'logo' not in src.lower():
                datos_carta["imagen_url"] = src
                break

        # 6. Tipo
        placas = soup.select('.plaque')
        for placa in placas:
            texto_placa = placa.text.strip()
            if placa.parent.name != 'a' and not texto_placa.startswith('#'):
                datos_carta["tipo"].append(texto_placa)

        return datos_carta

    except Exception as e:
        print(f"\n[!] Error al procesar {url}: {e}")
        return datos_carta

def ejecutar_flujo_completo(enlaces):
    """
    Recorre los enlaces con capacidad de reanudar si existe un progreso previo.
    """
    archivo_salida = 'base_datos_cartas_completa.json'
    resultados = []
    urls_procesadas = set()

    # --- LÓGICA DE REANUDACIÓN ---
    if os.path.exists(archivo_salida):
        try:
            with open(archivo_salida, 'r', encoding='utf-8') as archivo:
                resultados = json.load(archivo)
                # Extrae las URLs que ya existen en el JSON
                urls_procesadas = {carta.get('url_origen') for carta in resultados if carta.get('url_origen')}
            print(f"[*] Archivo de guardado detectado. {len(resultados)} cartas ya procesadas.")
        except json.JSONDecodeError:
            print("[!] El archivo de progreso parece estar corrupto o vacío. Empezando de cero.")

    # Filtra la lista original para quedarse solo con los enlaces pendientes
    enlaces_pendientes = [link for link in enlaces if link not in urls_procesadas]
    total_pendientes = len(enlaces_pendientes)

    if total_pendientes == 0:
        print("Todas las cartas en 'enlaces_cartas.json' ya han sido procesadas.")
        # Limpieza final: Quitar 'url_origen' si deseas que el JSON final quede exacto a tu solicitud
        return

    print("\n--- INICIANDO/REANUDANDO EXTRACCIÓN MASIVA ---")
    print(f"Cartas pendientes por extraer: {total_pendientes} de {len(enlaces)}.\n")

    for indice, enlace in enumerate(enlaces_pendientes):
        # El ID de la carta se calcula sumando las que ya existían + el índice actual
        id_actual = len(resultados) + 1
        
        sys.stdout.write(f"\rProcesando ({indice + 1}/{total_pendientes}): {enlace.split('/')[-1]}...")
        sys.stdout.flush()
        
        datos = extraer_datos_carta(enlace, id_actual)
        resultados.append(datos)
        
        # Autoguardado cada 50 cartas procesadas
        if (indice + 1) % 50 == 0:
            with open(archivo_salida, 'w', encoding='utf-8') as archivo:
                json.dump(resultados, archivo, indent=4, ensure_ascii=False)
        
        time.sleep(1.5)

    # Guardado final
    with open(archivo_salida, 'w', encoding='utf-8') as archivo:
        json.dump(resultados, archivo, indent=4, ensure_ascii=False)
    
    print(f"\n\n--- EXTRACCIÓN FINALIZADA ---")
    print(f"Se han guardado exitosamente {len(resultados)} cartas en '{archivo_salida}'.")

if __name__ == "__main__":
    try:
        with open('enlaces_cartas.json', 'r', encoding='utf-8') as f:
            lista_enlaces_extraidos = json.load(f)
            
        ejecutar_flujo_completo(lista_enlaces_extraidos)
        
    except FileNotFoundError:
        print("Error: No se encontró 'enlaces_cartas.json'. Ejecute obtenerlink.py primero.")
    except KeyboardInterrupt:
        print("\n\nProceso interrumpido por el usuario. El progreso se encuentra a salvo en 'base_datos_cartas_completa.json'. Puedes volver a ejecutar el script para retomar donde quedaste.")