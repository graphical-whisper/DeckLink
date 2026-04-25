# Sistema de Reconocimiento OCR para Cartas TCG

Este proyecto implementa un sistema de Reconocimiento Óptico de Caracteres (OCR) diseñado para identificar cartas de juegos de cartas coleccionables (TCG), específicamente Pokémon, a partir de fotografías. Utiliza visión artificial para el preprocesamiento de imágenes, Tesseract para la extracción de texto y RapidFuzz para la coincidencia difusa con una base de datos local.

## Estructura del Proyecto

El directorio de trabajo debe mantener la siguiente disposición para garantizar la correcta ejecución del script:

```text
proyecto_ocr/
├── data/
│   └── cards.json        # Base de datos JSON con los registros de las cartas
├── main.py               # Script principal de Python
└── foto_carta.jpg        # Fotografía de prueba de la carta a analizar

Requisitos Previos
Python 3.8 o superior.

Motor de código abierto Tesseract OCR instalado en el sistema operativo.

Instrucciones de Instalación
1. Instalación de Dependencias de Python
Abra una terminal en la raíz del proyecto y ejecute el gestor de paquetes para instalar las librerías necesarias:

Bash
pip install opencv-python pytesseract rapidfuzz
2. Instalación del Motor Tesseract OCR
La librería pytesseract funciona como un puente hacia los binarios del sistema, por lo que Tesseract debe instalarse a nivel del sistema operativo.

Windows: Descargue el ejecutable desde el repositorio oficial de UB-Mannheim Tesseract OCR e instálelo. La ruta predeterminada suele ser C:\Program Files\Tesseract-OCR.

Linux (Ubuntu/Debian):

Bash
sudo apt update
sudo apt install tesseract-ocr
macOS (vía Homebrew):

Bash
brew install tesseract
3. Configuración Específica para Windows
Si el sistema operativo es Windows, es imperativo especificar la ruta del ejecutable en el código fuente. Abra el archivo main.py y asegúrese de que la siguiente línea esté descomentada y apunte a la ruta correcta de su instalación:

Python
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
Ejecución del Sistema
Con las dependencias instaladas y la estructura de archivos validada, inicie el proceso ejecutando el siguiente comando en la terminal:

Bash
python main.py
