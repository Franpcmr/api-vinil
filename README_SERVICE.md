# Servicio API Vinilos Camara

Este proyecto permite ejecutar el script scaper.js como un servicio en segundo plano, gestionando automáticamente el ciclo de vida de la aplicación.

## Características

- Servicio RESTful para búsqueda de vinilos mediante imágenes
- Manejo automático de reCAPTCHA
- Ejecución como servicio en segundo plano
- Logs separados para salida estándar y errores
- Rutas de monitoreo y estado del servicio
- Cierre limpio ante señales del sistema

## Requisitos previos

- Node.js (v14 o superior)
- NPM o Yarn
- Puppeteer y sus dependencias
- ffmpeg (para procesamiento de audio)

## Instalación

1. Clona este repositorio o copia los archivos a tu directorio de trabajo

2. Instala las dependencias:
   ```
   npm install
   ```

3. Configura las variables de entorno copiando el archivo `.env.example` a `.env` y editando según tus necesidades:
   ```
   cp .env.example .env
   ```

## Uso como servicio

### Iniciar el servicio

```bash
npm run service:start
```

Esto iniciará el servicio en segundo plano y generará un archivo de PID en el directorio `logs/`.

### Detener el servicio

```bash
npm run service:stop
```

### Reiniciar el servicio

```bash
npm run service:restart
```

### Verificar el estado del servicio

```bash
npm run service:status
```

### Ver los logs

Para ver los logs de salida estándar:
```bash
npm run logs
```

Para ver los logs de errores:
```bash
npm run logs:error
```

## Uso como aplicación normal

Si prefieres ejecutar la aplicación en primer plano:

```bash
npm start
```

Para desarrollo con recarga automática:

```bash
npm run dev
```

## Endpoints disponibles

- `GET /` - Página principal con interfaz de búsqueda
- `POST /search` - Endpoint para buscar con imagen en base64
- `GET /health` - Verificación de salud del servicio
- `GET /status` - Estado detallado del servicio
- `POST /close-browser` - Cierra cualquier instancia de navegador abierta

### Ejemplo de uso del endpoint /search

```javascript
const response = await fetch('http://localhost:3000/search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    base64Image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA...'
  })
});

const data = await response.json();
console.log(data.VinilFound);
```

## Estructura de archivos

- `scaper.js` - Archivo principal de la aplicación
- `service.js` - Script para gestionar el servicio
- `.env` - Configuración de variables de entorno
- `logs/` - Directorio donde se almacenan los logs
  - `api-vinilos-camara.out.log` - Logs de salida estándar
  - `api-vinilos-camara.err.log` - Logs de errores
  - `api-vinilos-camara.pid` - Archivo con el ID del proceso

## Solución de problemas

### El servicio no inicia

Verifica los permisos y que todas las dependencias estén instaladas:

```bash
npm install
```

Comprueba los logs de error:

```bash
cat logs/api-vinilos-camara.err.log
```

### Problemas con Puppeteer

Si tienes problemas con Puppeteer, asegúrate de tener todas las dependencias del sistema instaladas. En el archivo `.env` puedes configurar la ruta al ejecutable de Chrome si es necesario:

```
PUPPETEER_EXECUTABLE_PATH=/ruta/a/tu/chrome
```

### Cierre inesperado

Si el servicio se cierra inesperadamente, revisa los logs de error y asegúrate de que tienes suficiente memoria y espacio en disco.

## Licencia

ISC 