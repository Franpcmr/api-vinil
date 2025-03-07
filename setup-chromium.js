/**
 * Script para verificar y configurar Chromium
 * Ejecutar con: node setup-chromium.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Ruta donde Puppeteer almacena Chromium
const puppeteerPath = require('puppeteer').executablePath();

console.log('Verificando configuración de Chromium...');

try {
  // Verificar si existe el ejecutable de Chromium
  console.log(`Verificando ruta del ejecutable: ${puppeteerPath}`);
  if (fs.existsSync(puppeteerPath)) {
    console.log('✅ Chromium encontrado correctamente');
    console.log(`Ruta de Chromium: ${puppeteerPath}`);
  } else {
    console.log('❌ Chromium no encontrado en la ruta esperada');
    console.log('Intentando reinstalar Puppeteer...');
    
    console.log('Ejecutando: npm uninstall puppeteer && npm install puppeteer');
    execSync('npm uninstall puppeteer && npm install puppeteer', { stdio: 'inherit' });
    
    // Verificar nuevamente
    const newPath = require('puppeteer').executablePath();
    if (fs.existsSync(newPath)) {
      console.log('✅ Chromium instalado correctamente después de reinstalar');
    } else {
      console.log('⚠️ No se pudo encontrar Chromium. Puede ser necesario configurar manualmente');
    }
  }

  // Mostrar información sobre el sistema
  console.log('\nInformación del sistema:');
  console.log('Plataforma:', process.platform);
  console.log('Arquitectura:', process.arch);
  console.log('Node.js:', process.version);
  
  // Generar un fragmento de configuración que se puede usar en el código
  console.log('\nConfigura tu aplicación con:');
  console.log(`
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '${puppeteerPath.replace(/\\/g, '\\\\')}',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });
  `);

} catch (error) {
  console.error('Error durante la verificación:', error);
}

// Intentar una prueba rápida para verificar que funciona
console.log('\nRealizando prueba básica de navegación...');
const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    await page.goto('https://example.com');
    
    const title = await page.title();
    console.log('✅ Navegación exitosa. Título de la página:', title);
    
    await browser.close();
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
  }
})(); 