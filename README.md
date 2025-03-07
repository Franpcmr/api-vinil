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

# API de Búsqueda de Vinilos

API para realizar búsquedas de vinilos utilizando imágenes en formato base64. Esta API utiliza Puppeteer y técnicas avanzadas para buscar información de vinilos en diferentes fuentes online.

## Funcionalidades

- Búsqueda de vinilos mediante imágenes
- Extracción de información detallada
- Bypass de captchas
- Comportamiento humanizado para evitar bloqueos

## Requisitos

- Node.js
- NPM

## Instalación

1. Clonar este repositorio
2. Instalar dependencias:

```bash
npm install
```

## Uso

Iniciar el servidor:

```bash
node scaper.js
```

El servidor se iniciará en el puerto 3000 por defecto.

## Endpoints

- `POST /search` - Busca información del vinilo a partir de una imagen en base64

## Licencia

ISC 