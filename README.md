# Scraper de Vinilos de Discogs

Este proyecto utiliza la API de Discogs para obtener información sobre vinilos y guardarla en un archivo JSON local. El script recorre todos los vinilos disponibles desde los más antiguos hasta los más recientes.

## Características

- Conecta con la API de Discogs usando autenticación con token personal
- Obtiene datos de vinilos ordenados por año (desde los más antiguos)
- Guarda los resultados en un archivo JSON
- **Descarga todas las imágenes relacionadas con cada vinilo**:
  - Imagen principal de portada
  - Imágenes adicionales (contraportada, disco, folletos, etc.)
- **Guarda las rutas locales de todas las imágenes en el JSON**
- Soporta carga de datos existentes para continuar desde donde se quedó
- Implementa manejo de errores y reintentos
- Respeta los límites de la API

## Requisitos

- Node.js (v16 o superior)
- NPM
- Chrome (instalado automáticamente como dependencia)

## Dependencias

- axios: Para realizar peticiones HTTP y descargar imágenes
- fs-extra: Para manejar archivos
- dotenv: Para gestionar variables de entorno (opcional)
- puppeteer: Para automatizar la navegación y búsqueda de imágenes

## Instalación

1. Clona este repositorio
2. Instala las dependencias:

```bash
npm install
```

Este comando automáticamente instalará Chrome como parte del proceso de instalación de Puppeteer.

## Verificación de Chrome

Si experimentas problemas con Chrome, puedes ejecutar el script de verificación:

```bash
npm run setup
```

Este script comprobará si Chrome está correctamente instalado y configurado.

## Configuración

El script ya incluye un token de acceso personal para conectarse a Discogs. Si deseas usar tus propias credenciales, puedes modificar las siguientes constantes en el archivo `discogs-scraper.js`:

```javascript
const DISCOGS_TOKEN = 'tu_token_personal_aquí';
```

Para obtener un token personal, visita: https://www.discogs.com/settings/developers

## Uso

Para ejecutar el script y comenzar a recopilar datos:

```bash
node discogs-scraper.js
```

Si prefieres hacer una prueba rápida con solo unos pocos vinilos:

```bash
node prueba-imagenes.js
```

El script guardará los datos en un archivo llamado `vinilos.json` en el directorio raíz del proyecto y las imágenes en la carpeta `imagenes/`.

## Consideraciones

- El proceso puede tardar mucho tiempo debido a la gran cantidad de vinilos en Discogs
- El script respeta los límites de la API de Discogs y hace pausas cuando es necesario
- Si el proceso se interrumpe, puedes retomarlo ejecutando el script nuevamente
- **La descarga de todas las imágenes aumenta significativamente el tiempo de ejecución**
- **El script realiza llamadas adicionales para obtener los detalles completos de cada vinilo**
- **Las imágenes se guardan como PNG con el ID del vinilo y el tipo de imagen como nombre**

## Estructura de datos

El archivo JSON contiene un array de objetos, cada uno representando un vinilo con sus detalles como:

- Título
- Artista
- Año
- Género
- Formato
- Imágenes (URLs originales de Discogs)
- **detalles_completos**: Información detallada del vinilo obtenida de la API
- **imagenes_locales**: Array de objetos con información de cada imagen:
  - **tipo**: Tipo de imagen (portada, contraportada, etc.)
  - **url_original**: URL original de la imagen en Discogs
  - **ruta_local**: Ruta local donde se ha guardado la imagen
- Y más información proporcionada por la API de Discogs

# API de Búsqueda de Vinilos con Bypass de reCAPTCHA

Esta API permite buscar información de vinilos utilizando imágenes en formato base64, utilizando Google Lens para realizar una búsqueda inversa de imágenes y luego encontrar resultados relevantes en Discogs.

## Características

- Búsqueda de vinilos mediante imágenes en base64
- Resolución automática de reCAPTCHA mediante reconocimiento de voz
- Comportamiento humanizado para evitar detección de bots
- Interfaz web simple para realizar búsquedas
- API RESTful para integración con otras aplicaciones

## Requisitos previos

- Node.js 14 o superior
- Python 3.6 o superior (para el reconocimiento de voz alternativo)
- FFmpeg (para la conversión de archivos de audio)

### Dependencias de Python (solo para el método alternativo)

Si deseas usar el método alternativo de reconocimiento de voz basado en Python, instala las siguientes bibliotecas:

```bash
pip install SpeechRecognition pydub
```

## Instalación

1. Clona este repositorio:
```bash
git clone https://github.com/tu-usuario/api-vinilos-camara.git
cd api-vinilos-camara
```

2. Instala las dependencias de Node.js:
```bash
npm install
```

3. Configura las credenciales de Google Cloud (necesario para el reconocimiento de voz):
   - Crea una cuenta de servicio en la Consola de Google Cloud
   - Habilita la API de Speech-to-Text
   - Descarga el archivo de credenciales JSON
   - Configura la variable de entorno:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="ruta/a/tu/archivo-credenciales.json"
   ```

## Uso

### Iniciar el servidor

```bash
npm start
```

El servidor se iniciará en el puerto 3000 por defecto (o el puerto especificado en la variable de entorno PORT).

### Endpoints de la API

- `GET /` - Interfaz web para realizar búsquedas
- `POST /search` - Recibe una imagen en formato base64 y devuelve información del vinilo
- `POST /close-browser` - Cierra el navegador si está activo

#### Ejemplo de solicitud a /search

```json
{
  "base64Image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA..."
}
```

#### Ejemplo de respuesta

```json
{
  "VinilFound": "Artista - Nombre del Álbum"
}
```

## Funcionamiento del Bypass de reCAPTCHA

El script incluye una funcionalidad para resolver automáticamente los reCAPTCHAs que puedan aparecer durante la navegación:

1. Detecta la presencia de un reCAPTCHA en la página
2. Hace clic en el botón de audio para obtener el desafío de audio
3. Descarga el archivo de audio MP3
4. Convierte el archivo MP3 a WAV
5. Utiliza la API de Google Speech-to-Text para reconocer el texto en el audio
6. Ingresa el texto reconocido en el campo de respuesta
7. Envía la respuesta para resolver el CAPTCHA

Si el método principal falla, el sistema intentará usar un método alternativo basado en Python como respaldo.

## Licencia

ISC 