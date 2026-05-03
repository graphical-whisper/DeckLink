import requests
from bs4 import BeautifulSoup
import json
import time
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

def crear_sesion_robusta():
    """Configura una sesión con reintentos automáticos para evitar errores de conexión."""
    sesion = requests.Session()
    reintentos = Retry(
        total=8,          
        backoff_factor=3,  
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["HEAD", "GET", "OPTIONS"]
    )
    adaptador = HTTPAdapter(max_retries=reintentos)
    sesion.mount('http://', adaptador)
    sesion.mount('https://', adaptador)
    return sesion

def reintentar_datos_carta(sesion, url, id_original):
    """Extrae los datos utilizando la sesión robusta."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
    }

    datos_carta = {
        "id_carta": id_original,
        "url_origen": url,
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
        # Timeout extendido: 20s para conectar, 60s para leer la respuesta
        respuesta = sesion.get(url, headers=headers, timeout=(20, 60))
        respuesta.raise_for_status()
        soup = BeautifulSoup(respuesta.text, 'html.parser')

        h1 = soup.find('h1')
        if h1:
            datos_carta["nombre"] = h1.text.strip()
        else:
            title = soup.find('title')
            if title:
                datos_carta["nombre"] = title.text.split('-')[0].strip()

        etiqueta_rareza = soup.find('strong', string='Rarity:')
        if etiqueta_rareza and etiqueta_rareza.parent:
            datos_carta["rareza"] = etiqueta_rareza.parent.text.replace('Rarity:', '').strip()

        etiqueta_set = soup.find('strong', string='Set:')
        if etiqueta_set and etiqueta_set.parent.find('a'):
            datos_carta["edicion"] = etiqueta_set.parent.find('a').text.strip()

        etiqueta_carta = soup.find('strong', string='Card:')
        if etiqueta_carta and etiqueta_carta.parent.find('a'):
            datos_carta["numero"] = etiqueta_carta.parent.find('a').text.strip()

        imagenes = soup.select('#columnLeft img')
        for img in imagenes:
            src = img.get('src', '')
            if src and 'logo' not in src.lower():
                datos_carta["imagen_url"] = src
                break

        placas = soup.select('.plaque')
        for placa in placas:
            texto_placa = placa.text.strip()
            if placa.parent.name != 'a' and not texto_placa.startswith('#'):
                datos_carta["tipo"].append(texto_placa)

        return datos_carta

    # Captura general para evitar que un error de socket/lectura colapse el programa entero
    except BaseException as e:
        print(f"  [!] Timeout o error de conexión. El servidor no respondió a tiempo.")
        return None

def reparar_automaticamente():
    archivo_json = 'base_datos_cartas_completa.json'
    archivo_enlaces = 'enlaces_cartas.json'
    
    try:
        with open(archivo_json, 'r', encoding='utf-8') as f:
            base_datos = json.load(f)
    except FileNotFoundError:
        print(f"Error: No se encontró el archivo {archivo_json}.")
        return

    enlaces_originales = []
    try:
        with open(archivo_enlaces, 'r', encoding='utf-8') as f:
            enlaces_originales = json.load(f)
    except FileNotFoundError:
        pass

    indices_fallidos = [i for i, carta in enumerate(base_datos) if carta.get('nombre') is None]
    total_fallidas = len(indices_fallidos)

    if total_fallidas == 0:
        print("No se encontraron cartas con valores nulos en la base de datos.")
        return

    print(f"Iniciando reparación AUTOMÁTICA de {total_fallidas} cartas...\n")
    sesion = crear_sesion_robusta()
    reparadas_exitosamente = 0

    for contador, indice_bd in enumerate(indices_fallidos):
        carta_mala = base_datos[indice_bd]
        id_carta = carta_mala.get('id_carta')
        url = carta_mala.get('url_origen')
        
        if not url and enlaces_originales:
            try:
                id_numero = int(id_carta.replace('c-', ''))
                url = enlaces_originales[id_numero - 1]
            except Exception:
                pass
        
        print(f"[{contador + 1}/{total_fallidas}] Procesando ID: {id_carta}")
        
        if not url:
            print("  [!] URL no encontrada. Omitiendo.")
            continue
            
        time.sleep(4) # Pausa ampliada a 4 segundos
        
        datos_recuperados = reintentar_datos_carta(sesion, url, id_carta)
        
        if datos_recuperados and datos_recuperados.get('nombre') is not None:
            base_datos[indice_bd] = datos_recuperados
            reparadas_exitosamente += 1
            print(f"  [+] Éxito. Datos actualizados para: {datos_recuperados['nombre']}")
            
            with open(archivo_json, 'w', encoding='utf-8') as f:
                json.dump(base_datos, f, indent=4, ensure_ascii=False)
        else:
            print("  [-] La reparación falló nuevamente. Se intentará en la siguiente ejecución.")
            
    print(f"\nProceso finalizado. Se han reparado y guardado automáticamente {reparadas_exitosamente} de {total_fallidas} cartas.")

if __name__ == "__main__":
    reparar_automaticamente()