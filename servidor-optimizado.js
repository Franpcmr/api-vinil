/**
 * Versión optimizada para servidor externo
 * Este archivo muestra cómo configurar correctamente Puppeteer para un servidor externo
 */

const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(express.json({limit: '50mb'}));
app.use(cors());

// Guardar referencia global al navegador para reutilizarlo
let browserInstance = null;

// Función para obtener o crear instancia de navegador
async function getBrowser() {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }
  
  console.log('Iniciando nueva instancia de navegador...');
  
  browserInstance = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-web-security',
      '--no-zygote',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-blink-features=AutomationControlled'
    ]
  });
  
  // Cerrar navegador al finalizar la aplicación
  process.on('exit', async () => {
    if (browserInstance) {
      console.log('Cerrando navegador al salir...');
      await browserInstance.close();
    }
  });
  
  return browserInstance;
}

app.post('/test-browser', async (req, res) => {
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    
    await page.goto('https://example.com');
    const title = await page.title();
    
    await page.close(); // Cerrar solo la página, mantener el navegador abierto
    
    res.json({ 
      status: 'ok', 
      message: 'Navegador funcionando correctamente', 
      title,
      version: await browser.version()
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Endpoint para cerrar el navegador cuando sea necesario
app.post('/close-browser', async (req, res) => {
  try {
    if (browserInstance) {
      await browserInstance.close();
      browserInstance = null;
      res.json({ message: "Navegador cerrado correctamente" });
    } else {
      res.json({ message: "No hay navegador abierto para cerrar" });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al cerrar el navegador' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor optimizado escuchando en el puerto ${PORT}`);
}); 