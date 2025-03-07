/**
 * Script para gestionar el servicio de scaper.js
 * Permite iniciar, detener y reiniciar el servicio
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Configuración
const LOG_DIR = path.join(__dirname, 'logs');
const SERVICE_NAME = 'api-vinilos-camara';
const MAIN_SCRIPT = path.join(__dirname, 'scaper.js');

// Asegurar que existe el directorio de logs
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Nombres de archivos para logs
const OUT_LOG = path.join(LOG_DIR, `${SERVICE_NAME}.out.log`);
const ERR_LOG = path.join(LOG_DIR, `${SERVICE_NAME}.err.log`);
const PID_FILE = path.join(LOG_DIR, `${SERVICE_NAME}.pid`);

// Comprobar si el servicio está en ejecución
function isRunning() {
  if (!fs.existsSync(PID_FILE)) {
    return false;
  }
  
  const pid = fs.readFileSync(PID_FILE, 'utf-8').trim();
  try {
    process.kill(parseInt(pid), 0);
    return true;
  } catch (e) {
    // Si hay un error, el proceso no existe
    return false;
  }
}

// Iniciar el servicio
function startService() {
  if (isRunning()) {
    console.log(`El servicio ${SERVICE_NAME} ya está en ejecución.`);
    return;
  }
  
  console.log(`Iniciando el servicio ${SERVICE_NAME}...`);
  
  // Abrir los archivos de log
  const outStream = fs.openSync(OUT_LOG, 'a');
  const errStream = fs.openSync(ERR_LOG, 'a');
  
  // Iniciar el proceso
  const child = spawn('node', [MAIN_SCRIPT], {
    detached: true,
    stdio: ['ignore', outStream, errStream]
  });
  
  // Guardar el PID
  fs.writeFileSync(PID_FILE, child.pid.toString());
  
  // Desasociar el proceso hijo para que pueda seguir ejecutándose
  child.unref();
  
  console.log(`Servicio ${SERVICE_NAME} iniciado con PID ${child.pid}`);
  console.log(`Logs en: ${OUT_LOG} y ${ERR_LOG}`);
}

// Detener el servicio
function stopService() {
  if (!isRunning()) {
    console.log(`El servicio ${SERVICE_NAME} no está en ejecución.`);
    return;
  }
  
  console.log(`Deteniendo el servicio ${SERVICE_NAME}...`);
  
  // Leer el PID
  const pid = parseInt(fs.readFileSync(PID_FILE, 'utf-8').trim());
  
  // Enviar señal SIGTERM para un cierre limpio
  try {
    process.kill(pid, 'SIGTERM');
    console.log(`Señal SIGTERM enviada al proceso ${pid}`);
    
    // Esperar hasta que el proceso termine (máximo 10 segundos)
    let maxWait = 10;
    const checkInterval = setInterval(() => {
      try {
        process.kill(pid, 0);
        maxWait--;
        if (maxWait <= 0) {
          clearInterval(checkInterval);
          console.log(`El proceso no terminó a tiempo, enviando SIGKILL...`);
          try {
            process.kill(pid, 'SIGKILL');
          } catch (e) {
            // Ignorar errores aquí
          }
          fs.unlinkSync(PID_FILE);
        }
      } catch (e) {
        // El proceso ya no existe
        clearInterval(checkInterval);
        console.log(`Servicio ${SERVICE_NAME} detenido correctamente.`);
        try {
          fs.unlinkSync(PID_FILE);
        } catch (e) {
          // Ignorar errores aquí
        }
      }
    }, 1000);
  } catch (e) {
    console.error(`Error al detener el servicio: ${e.message}`);
    // Limpiar el archivo PID si hay error
    try {
      fs.unlinkSync(PID_FILE);
    } catch (e) {
      // Ignorar errores aquí
    }
  }
}

// Reiniciar el servicio
function restartService() {
  console.log(`Reiniciando el servicio ${SERVICE_NAME}...`);
  stopService();
  
  // Esperar 5 segundos antes de reiniciar
  setTimeout(() => {
    startService();
  }, 5000);
}

// Mostrar el estado del servicio
function serviceStatus() {
  if (!isRunning()) {
    console.log(`El servicio ${SERVICE_NAME} no está en ejecución.`);
    return;
  }
  
  const pid = fs.readFileSync(PID_FILE, 'utf-8').trim();
  console.log(`El servicio ${SERVICE_NAME} está en ejecución con PID ${pid}.`);
  console.log(`Logs en: ${OUT_LOG} y ${ERR_LOG}`);
}

// Procesar argumentos de línea de comandos
const command = process.argv[2]?.toLowerCase();

switch (command) {
  case 'start':
    startService();
    break;
  case 'stop':
    stopService();
    break;
  case 'restart':
    restartService();
    break;
  case 'status':
    serviceStatus();
    break;
  default:
    console.log(`
Uso: node service.js [comando]

Comandos disponibles:
  start   - Iniciar el servicio
  stop    - Detener el servicio
  restart - Reiniciar el servicio
  status  - Mostrar el estado del servicio
`);
} 