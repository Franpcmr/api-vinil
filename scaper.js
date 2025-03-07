const express = require('express');
const puppeteer = require('puppeteer');
const { extract } = require('@extractus/article-extractor');
const NodeCache = require('node-cache');
const cors = require('cors');

const app = express();
app.use(express.json({limit: '50mb'}));
app.use(cors());

// Eliminar el middleware de logging
// Middleware para logging de peticiones
app.use((req, res, next) => {
  next();
});

// Inicializar caché con TTL de 1 hora
const cache = new NodeCache({ stdTTL: 3600 });

// Función para validar el formato base64 de la imagen
function validateBase64Image(base64String) {
  // Verifica si la cadena está vacía o no es una cadena
  if (!base64String || typeof base64String !== 'string') {
    return { isValid: false, message: 'La imagen debe ser una cadena base64 válida' };
  }

  // Verifica el formato correcto del prefijo para PNG o JPEG/JPG
  const validPrefixes = [
    'data:image/png;base64,',
    'data:image/jpeg;base64,',
    'data:image/jpg;base64,'
  ];
  
  const hasValidPrefix = validPrefixes.some(prefix => base64String.startsWith(prefix));
  
  if (!hasValidPrefix) {
    return { isValid: false, message: 'La imagen debe tener el formato data:image/[png|jpeg|jpg];base64' };
  }

  // Intenta decodificar la parte base64 (sin el prefijo)
  try {
    // Extraer la parte base64 independientemente del prefijo
    const base64Data = base64String.substring(base64String.indexOf(',') + 1);
    Buffer.from(base64Data, 'base64');
    return { isValid: true };
  } catch (error) {
    return { isValid: false, message: 'El formato base64 de la imagen no es válido' };
  }
}

// Función de utilidad para esperar
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Función para generar número aleatorio en un rango
const randomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Función para simular comportamiento humano en el navegador (versión resumida)
async function simulateHumanBehavior(page) {
  // Realizar un movimiento de ratón aleatorio
  const viewportWidth = page.viewport().width;
  const viewportHeight = page.viewport().height;
  
  const x = randomNumber(0, viewportWidth);
  const y = randomNumber(0, viewportHeight);
  
  await page.mouse.move(x, y);
  await wait(randomNumber(300, 800));
  
  // Scroll aleatorio
  await page.evaluate(() => {
    const scrollAmount = Math.floor(Math.random() * 300) + 100;
    window.scrollBy(0, scrollAmount);
  });
  
  await wait(randomNumber(500, 1000));
}

// Función mejorada para esperar a que los resultados de búsqueda carguen
async function waitForResults(page, selector, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { visible: true, timeout });
  } catch (error) {
    throw new Error(`No se pudo encontrar el selector "${selector}"`);
  }
}

// Función para hacer clic en un botón con manejo mejorado de errores
async function clickButton(page, selector, descripcion, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { visible: true, timeout });
    await page.click(selector);
    return true;
  } catch (error) {
    return false;
  }
}

// Función para formatear el texto extraído según los requisitos
function formatExtractedText(text) {
  if (!text) return '';
  
  // Paso 1: Eliminar comillas, corchetes y comas
  let formattedText = text.replace(/[",\[\]]/g, '');
  
  // Paso 2: Extraer hasta la primera palabra después del primer guión
  const guiones = ['–', '-']; // Considerar ambos tipos de guiones
  let firstDashIndex = -1;
  let guionUsado = '';
  
  // Buscar el primer guión (cualquier tipo)
  for (const guion of guiones) {
    const index = formattedText.indexOf(guion);
    if (index !== -1 && (firstDashIndex === -1 || index < firstDashIndex)) {
      firstDashIndex = index;
      guionUsado = guion;
    }
  }
  
  if (firstDashIndex !== -1) {
    // Extraer la parte antes del guión
    const beforeDash = formattedText.substring(0, firstDashIndex).trim();
    
    // Extraer la parte después del primer guión
    const afterFirstDash = formattedText.substring(firstDashIndex + 1).trim();
    
    // Separar por espacios
    const palabras = afterFirstDash.split(' ');
    
    // Tomar solo la primera palabra después del guión
    if (palabras.length > 0) {
      formattedText = beforeDash + ' ' + guionUsado + ' ' + palabras[0];
    } else {
      formattedText = beforeDash;
    }
  }
  
  // Eliminar espacios en blanco al inicio y final
  return formattedText.trim();
}

// Modificar la función de búsqueda para extraer títulos de pestañas
async function searchWithBase64Image(base64Image, useCache = false) {
  // Verificar si el resultado está en caché solo si useCache es true
  const cacheKey = base64Image.substring(0, 100); // Usar los primeros 100 caracteres como clave de caché
  if (useCache) {
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
  }

  // Inicia Puppeteer con opciones mejoradas
  const browser = await puppeteer.launch({ 
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1280,720',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--no-first-run',
      '--no-zygote',
      '--disable-blink-features=AutomationControlled', // Ocultar que es automatizado
      '--disable-extensions',
      '--ignore-certificate-errors'
    ],
    defaultViewport: {
      width: 1280,
      height: 720
    }
  });
  
  const page = await browser.newPage();
  
  // Configurar un user agent más común
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
  
  // Eliminar la propiedad webdriver
  await page.evaluateOnNewDocument(() => {
    // Eliminar la propiedad webdriver
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });
    
    // Modificar user agent para evitar detección
    Object.defineProperty(navigator, 'platform', {
      get: () => 'Win32',
    });
    
    // Emular plugins de navegador (para parecer más humano)
    Object.defineProperty(navigator, 'plugins', {
      get: () => {
        return [
          {
            0: {
              type: 'application/pdf',
              suffixes: 'pdf',
              description: 'Portable Document Format',
              enabledPlugin: Plugin,
            },
            name: 'Chrome PDF Plugin',
            description: 'Portable Document Format',
          },
          {
            0: {
              type: 'application/pdf',
              suffixes: 'pdf',
              description: 'Portable Document Format',
              enabledPlugin: Plugin,
            },
            name: 'Chrome PDF Viewer',
            description: 'Portable Document Format',
          },
          {
            0: {
              type: 'application/x-google-chrome-pdf',
              suffixes: 'pdf',
              description: 'Portable Document Format',
              enabledPlugin: Plugin,
            },
            name: 'Chrome PDF Viewer',
            description: 'Portable Document Format',
          },
        ];
      },
    });
    
    // Crear una función aleatoria para window.chrome
    window.chrome = {
      runtime: {},
      loadTimes: function() {},
      csi: function() {},
      app: {},
    };
    
    // Sobreescribir el tiempo de creación
    const originalCreate = HTMLIFrameElement.prototype.contentWindow;
    Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
      get: function() {
        const win = originalCreate.call(this);
        Object.defineProperty(win, 'chrome', {
          get: () => window.chrome,
        });
        return win;
      },
    });
    
    // Sobreescribir algunos métodos que pueden detectar automatización
    const originalGetParameter = HTMLCanvasElement.prototype.getParameter;
    if (originalGetParameter) {
      HTMLCanvasElement.prototype.getParameter = function(parameter) {
        if (parameter === 37445) {
          return 'Intel Inc.';
        }
        if (parameter === 37446) {
          return 'Intel Iris OpenGL Engine';
        }
        return originalGetParameter.call(this, parameter);
      };
    }
    
    // Sobreescribir el resultado de la detección de idiomas
    Object.defineProperty(navigator, 'languages', {
      get: () => ['es-ES', 'es', 'en-US', 'en'],
    });
  });
  
  // Mantener el bypass de CSP para evitar errores de seguridad
  await page.setBypassCSP(true);
  
  // Ocultar WebDriver
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Cache-Control': 'max-age=0',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  });
  
  try {
    // Navegamos directamente a Google con opciones más rápidas
    await page.setDefaultNavigationTimeout(15000);
    await page.goto('https://www.google.com/', { 
      waitUntil: 'domcontentloaded', // Más rápido que networkidle0
      timeout: 15000 
    });
    
    // Simular comportamiento humano después de cargar la página
    await simulateHumanBehavior(page);
    
    // Manejar cookies rápidamente si aparecen
    try {
      const cookieButtonExists = await page.evaluate(() => {
        const acceptButton = document.querySelector('#L2AGLb');
        if (acceptButton && window.getComputedStyle(acceptButton).display !== 'none') {
          acceptButton.click();
          return true;
        }
        return false;
      });
      
      if (cookieButtonExists) {
        await wait(randomNumber(500, 1200)); // Espera aleatoria después de aceptar cookies
      }
    } catch (error) {
      // Ignorar errores al manejar cookies
    }

    // Buscar y hacer clic en el botón de Google Lens con manejo mejorado
    const lensButtonSelector = 'div.nDcEnd[aria-label="Búsqueda por imágenes"][role="button"]';
    await waitForResults(page, lensButtonSelector, 5000);
    
    // Simular comportamiento humano antes de hacer clic
    await simulateHumanBehavior(page);
    
    // Hacer clic y esperar a que aparezca el campo de entrada
    await clickButton(page, lensButtonSelector, "botón de búsqueda por imágenes");
    await waitForResults(page, 'input.cB9M7[jsname="W7hAGe"]', 5000);
    
    // Simular comportamiento humano antes de ingresar la imagen
    await simulateHumanBehavior(page);
    
    // Ingresar la imagen en base64 con manejo mejorado
    await page.evaluate((base64Str) => {
      const input = document.querySelector('input.cB9M7[jsname="W7hAGe"]');
      if (input) {
        // Limpiar cualquier valor existente
        input.value = '';
        
        // Establecer el valor directamente
        input.value = base64Str;
        
        // Disparar múltiples eventos para asegurar que Google detecte el cambio
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
        input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
      } else {
        throw new Error('No se pudo encontrar el campo de entrada');
      }
    }, base64Image);
    
    // Esperar un momento para asegurar que el valor se haya aplicado
    await wait(500);
    
    // Buscar y hacer clic en el botón de búsqueda con manejo mejorado
    const searchButtonSelector = 'div[jsname="ZtOxCb"][role="button"]';
    await waitForResults(page, searchButtonSelector, 5000);
    
    // Hacer clic y esperar la navegación simultáneamente
    await Promise.all([
      clickButton(page, searchButtonSelector, "botón de búsqueda"),
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 })
    ]);

    // Obtiene la URL de los resultados
    const resultUrl = await page.url();
    
    // Esperar a que la página de resultados se cargue completamente
    await wait(2000);
    
    // Simular comportamiento humano en la página de resultados
    await simulateHumanBehavior(page);

    // Buscar el campo de búsqueda y añadir "Discogs"
    const searchInputSelector = 'textarea.gLFyf';
    await waitForResults(page, searchInputSelector, 5000);

    // Limpiar el campo y escribir el nuevo texto
    await page.evaluate(() => {
      const searchInput = document.querySelector('textarea.gLFyf');
      if (searchInput) {
        searchInput.value = '';
        searchInput.value = 'Discogs';
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    // Buscar y hacer clic en el botón de búsqueda con manejo mejorado
    const googleSearchButtonSelector = 'button.HZVG1b[jsname="Tg7LZd"]';
    await waitForResults(page, googleSearchButtonSelector, 5000);

    // Hacer clic y esperar la navegación
    await Promise.all([
      clickButton(page, googleSearchButtonSelector, "botón de búsqueda de Google"),
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 })
    ]);

    // Esperar a que la página cargue completamente
    await wait(2000);
    
    // Simular comportamiento humano en la página de resultados
    await simulateHumanBehavior(page);

    // Obtener la URL actual para navegación
    const currentUrl = await page.url();
    
    // Buscar múltiples enlaces a discogs.com (hasta 5)
    const discogsLinks = await page.evaluate(() => {
      // Función para identificar enlaces a Discogs
      const findDiscogsLinks = () => {
        // Recopilar todos los enlaces en la página
        const allLinks = Array.from(document.querySelectorAll('a'));
        
        // Filtrar enlaces a discogs.com
        const discogsAllLinks = allLinks.filter(link => {
          try {
            return link.href && 
                  link.href.includes('discogs.com') && 
                  !link.href.includes('google.com');
          } catch (e) {
            return false;
          }
        });
        
        // Buscar específicamente en los resultados de búsqueda
        const searchResultLinks = Array.from(document.querySelectorAll('div.g a, .yuRUbf a')).filter(link => {
          try {
            return link.href && 
                   link.href.includes('discogs.com') && 
                   !link.href.includes('google.com');
          } catch (e) {
            return false;
          }
        });
        
        // Si hay enlaces en los resultados de búsqueda, usar esos
        if (searchResultLinks.length > 0) {
          // Priorizar enlaces que parecen ser de fichas de álbumes (contienen /release/)
          const releaseLinks = searchResultLinks.filter(link => link.href.includes('/release/'));
          
          // Combinar y eliminar duplicados
          const combinedLinks = [...releaseLinks, ...searchResultLinks].filter((link, index, self) => 
            index === self.findIndex((l) => l.href === link.href)
          ).slice(0, 5);
          
          return combinedLinks.map(link => ({
            href: link.href,
            text: link.textContent.trim() || 'Enlace a Discogs',
            isRelease: link.href.includes('/release/')
          }));
        }
        
        // Si no hay enlaces en resultados de búsqueda, usar todos los enlaces a discogs
        const combinedGeneralLinks = discogsAllLinks.filter((link, index, self) => 
          index === self.findIndex((l) => l.href === link.href)
        ).slice(0, 5);
        
        return combinedGeneralLinks.map(link => ({
          href: link.href,
          text: link.textContent.trim() || 'Enlace a Discogs',
          isRelease: link.href.includes('/release/')
        }));
      };
      
      return findDiscogsLinks();
    });
    
    // Si no se encontró ningún enlace, terminar aquí
    if (discogsLinks.length === 0) {
      await browser.close();
      return { 
        resultUrl, 
        extractedTexts: [],
        browserClosed: true
      };
    }
    
    // Array para almacenar los textos extraídos
    const extractedTexts = [];
    
    // Procesar hasta 5 enlaces (o menos si se encontraron menos)
    const maxLinks = Math.min(5, discogsLinks.length);
    
    for (let i = 0; i < maxLinks; i++) {
      const currentLink = discogsLinks[i];
      
      try {
        // Navegar a la página del enlace con un timeout razonable
        await page.goto(currentLink.href, { 
          waitUntil: 'domcontentloaded', 
          timeout: 20000 
        });
        
        // Esperar un momento para que cargue el contenido
        await wait(1000);
        
        // Extraer el título de la página directamente
        const pageTitle = await page.title();
        
        // Formatear el texto extraído del título
        let extractedText = pageTitle;
        if (extractedText && extractedText.includes(' | Discogs')) {
          extractedText = extractedText.split(' | Discogs')[0].trim();
        }
        
        extractedText = formatExtractedText(extractedText);
        
        // Agregar el texto formateado al array si no está vacío y no es duplicado
        if (extractedText && !extractedTexts.includes(extractedText)) {
          extractedTexts.push(extractedText);
        }
        
      } catch (error) {
        // Si hay error, intentar con el siguiente enlace
        continue;
      }
    }
    
    // Agregar este console.log para los textos extraídos
    console.log('Textos extraídos:', JSON.stringify(extractedTexts, null, 2));
    
    // Guardar el resultado en caché
    const result = { 
      resultUrl, 
      extractedTexts,
      browserClosed: true
    };
    
    if (useCache) {
      cache.set(cacheKey, result);
    }
    
    // Cerrar el navegador después de extraer la información
    await browser.close();
    
    return result;
  } catch (error) {
    await browser.close();
    throw error;
  }
}

// Endpoint para recibir la imagen
app.post('/search', async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'No se recibió cuerpo en la petición' });
    }
    
    const { base64Image, no_cache } = req.body;
    
    // Verificar si base64Image existe
    if (!base64Image) {
      return res.status(400).json({ error: 'No se proporcionó una imagen base64' });
    }
    
    // Valida el formato de la imagen
    const validationResult = validateBase64Image(base64Image);
    if (!validationResult.isValid) {
      return res.status(400).json({ error: validationResult.message });
    }
    
    // Desactiva la caché por defecto, a menos que se especifique lo contrario
    const useCache = req.body.use_cache === true;
    const result = await searchWithBase64Image(base64Image, useCache);
    
    // Obtener los textos extraídos
    const { extractedTexts } = result;
    
    // Devolver todos los textos extraídos o uno solo si solo hay uno
    if (extractedTexts && extractedTexts.length > 0) {
      res.json({ VinilFound: extractedTexts });
    } else {
      res.json({ VinilFound: 'No se encontró información' });
    }
  } catch (error) {
    res.status(500).json({ 
      error: 'Error durante la búsqueda de imagen',
      message: error.message
    });
  }
});

// Endpoint adicional para cerrar el navegador cuando sea necesario
app.post('/close-browser', async (req, res) => {
  try {
    if (global.currentBrowser) {
      await global.currentBrowser.close();
      global.currentBrowser = null;
      res.json({ message: "Navegador cerrado correctamente" });
    } else {
      res.json({ message: "No hay navegador abierto para cerrar" });
    }
  } catch (error) {
    console.error('Error al cerrar el navegador:', error);
    res.status(500).json({ error: 'Error al cerrar el navegador' });
  }
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`Servidor escuchando en http://${HOST}:${PORT}`);
});
