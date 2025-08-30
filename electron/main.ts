/// <reference types="node" />
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { starterPresets } from '../data/presets';

// --- START: Early Debug Logging ---
const debugLogPath = path.join(app.getPath('userData'), 'debug.log');
// Clear log on each start to keep it relevant to the current session.
fs.writeFileSync(debugLogPath, '', { encoding: 'utf-8' }); 

const logToFile = (message: string) => {
  try {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(debugLogPath, `${timestamp} - ${message}\n`, { encoding: 'utf-8' });
  } catch (e) {
    // If logging fails, we can't do much but log to console.
    console.error('Failed to write to debug log:', e);
  }
};

logToFile('Main process started.');

// Catch unhandled errors in the main process.
// Fix: In a Node.js environment, `process` is a global object. Using it directly resolves the TypeScript error.
// FIX: Cast `process` to `any` to resolve TypeScript error about property 'on' not existing on type 'Process'.
(process as any).on('uncaughtException', (error, origin) => {
  logToFile(`[FATAL] Uncaught Exception: ${error.stack || error.message}`);
  logToFile(`Origin: ${origin}`);
  // It's generally recommended to quit after an uncaught exception.
  app.quit();
});
// --- END: Early Debug Logging ---

const isDev = !app.isPackaged;
logToFile(`isDev = ${isDev}`);

// --- Settings Management (Synchronous Part) ---
const settingsPath = path.join(app.getPath('userData'), 'settings.json');
const defaultSettings = {
  aiSettings: {
    provider: 'ollama',
    baseUrl: 'http://localhost:11434',
    model: 'llama3',
  },
  presets: starterPresets,
  promptPanelRatio: 50,
  openDevToolsOnStart: isDev, // Default to true in dev, false in production
};

let currentSettings = defaultSettings;

function readSettingsSync() {
  try {
    if (fs.existsSync(settingsPath)) {
      const rawData = fs.readFileSync(settingsPath, 'utf-8');
      // Merge with defaults to ensure new settings are present in existing files
      return { ...defaultSettings, ...JSON.parse(rawData) };
    } else {
      fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
      return defaultSettings;
    }
  } catch (error) {
    logToFile(`[ERROR] Failed to read or create settings file synchronously: ${error}`);
    return defaultSettings;
  }
}


function createWindow() {
  logToFile('createWindow() called.');
  
  // __dirname in dev: .../dist/electron
  // __dirname in prod: .../app.asar/electron
  const preloadPath = path.join(__dirname, 'preload.js');
  
  logToFile(`Resolved preload path: ${preloadPath}`);
  if (!fs.existsSync(preloadPath)) {
      logToFile(`[FATAL] Preload script not found at ${preloadPath}`);
  }

  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false, // Create the window hidden
    backgroundColor: '#101828', // Match the app's dark background
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: "UDIO Prompt Crafter"
  });
  logToFile('BrowserWindow created with show:false.');

  // Show the window only when the content is ready to be displayed.
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    logToFile('Window ready-to-show event fired. Showing window.');
  });

  // Conditionally open developer tools based on settings.
  if (currentSettings.openDevToolsOnStart) {
    mainWindow.webContents.openDevTools();
    logToFile('Opening DevTools based on user setting.');
  }

  mainWindow.setMenu(null);

  // index.html will be one level up from the /electron directory.
  const indexPath = path.join(__dirname, '../index.html');

  logToFile(`Resolved index.html path: ${indexPath}`);
  if (!fs.existsSync(indexPath)) {
      logToFile(`[FATAL] index.html not found at ${indexPath}`);
  }
  
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    logToFile(`[ERROR] Page failed to load: ${errorDescription} (Code: ${errorCode})`);
  });

  mainWindow.loadFile(indexPath).then(() => {
    logToFile('loadFile() promise resolved successfully.');
  }).catch(err => {
    logToFile(`[ERROR] loadFile() promise rejected: ${err}`);
  });
  logToFile('loadFile() called.');
}

// Wrap the entire app setup in a try-catch to log any synchronous errors during initialization.
try {
  app.whenReady().then(() => {
    logToFile('App is ready.');
    
    // Read settings synchronously before creating the window or setting up IPC.
    currentSettings = readSettingsSync();
    logToFile(`Settings loaded. openDevToolsOnStart: ${currentSettings.openDevToolsOnStart}`);
    
    logToFile('Setting up IPC handlers...');

    // --- Debug Log IPC ---
    ipcMain.handle('read-debug-log', () => {
      try {
        if (fs.existsSync(debugLogPath)) {
          return fs.readFileSync(debugLogPath, 'utf-8');
        }
        return 'Debug log file not found.';
      } catch (error: any) {
        return `Error reading debug log: ${error.message}`;
      }
    });

    // --- Settings Management (IPC Part) ---
    ipcMain.handle('read-settings', () => {
      // The sync read has already happened for startup. This handler is for the UI.
      // Re-reading ensures the UI gets the freshest data if the file was edited manually.
      return readSettingsSync();
    });

    ipcMain.on('write-settings', (event, settings) => {
      try {
        currentSettings = settings; // Keep the in-memory version up-to-date
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      } catch (error) {
        logToFile(`[ERROR] Failed to write settings file: ${error}`);
        console.error('Failed to write settings file:', error);
      }
    });

    // --- Documentation ---
    ipcMain.handle('read-markdown-file', (event, filename) => {
      try {
        // Fix: In a Node.js environment, `process` is a global object. Using it directly resolves the TypeScript error.
        const docsPath = isDev 
            ? path.join(__dirname, '..', 'docs') 
            : path.join((process as any).resourcesPath, 'docs'); // extraResources are not in app.asar
            
        const filePath = path.join(docsPath, filename);
        if (fs.existsSync(filePath)) {
          return fs.readFileSync(filePath, 'utf-8');
        } else {
          logToFile(`[ERROR] Markdown file not found: ${filePath}`);
          console.error(`Markdown file not found: ${filePath}`);
          return `Error: Could not find documentation file '${filename}'.`;
        }
      } catch (error: any) {
        logToFile(`[ERROR] Failed to read markdown file ${filename}: ${error}`);
        console.error(`Failed to read markdown file ${filename}:`, error);
        return `Error: Could not read documentation file. ${error.message}`;
      }
    });

    // --- App Info ---
    ipcMain.handle('get-app-version', () => app.getVersion());

    // --- Logging ---
    // Fix: In a Node.js environment, `process` is a global object. Using it directly resolves the TypeScript error.
    // FIX: Cast `process` to `any` to resolve TypeScript error about property 'cwd' not existing on type 'Process'.
    const logDir = isDev ? (process as any).cwd() : path.dirname(app.getPath('exe'));
    const getLogFileName = () => `udio-prompt-crafter-${new Date().toISOString().split('T')[0]}.log`;
    let currentLogFilePath = path.join(logDir, getLogFileName());

    ipcMain.on('write-log', (event, logEntry) => {
      currentLogFilePath = path.join(logDir, getLogFileName());
      const contextString = logEntry.context ? ` ${JSON.stringify(logEntry.context, null, 2)}` : '';
      const formattedMessage = `${logEntry.timestamp} [${logEntry.level}] ${logEntry.message}${contextString}\n`;
      
      fs.appendFile(currentLogFilePath, formattedMessage, (err) => {
        if (err) {
            logToFile(`[ERROR] Failed to write to application log: ${err}`);
            console.error('Failed to write to log file:', err);
        }
      });
    });

    ipcMain.on('show-item-in-folder', () => {
        if (!fs.existsSync(currentLogFilePath)) {
          fs.writeFileSync(currentLogFilePath, `Log file for ${new Date().toISOString()} created.\n`);
        }
        shell.showItemInFolder(currentLogFilePath);
    });

    ipcMain.handle('get-logs-path', () => path.join(logDir, getLogFileName()));

    // --- Create the window ---
    createWindow();

    app.on('activate', () => {
      logToFile('App activate event triggered.');
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  }).catch(err => {
    logToFile(`[FATAL] Error in app.whenReady() promise chain: ${err.stack || err.message}`);
  });
} catch (e: any) {
  logToFile(`[FATAL] Synchronous error during app startup: ${e.stack || e.message}`);
  app.quit();
}

app.on('window-all-closed', () => {
  logToFile('All windows closed. Quitting app.');
  // Fix: In a Node.js environment, `process` is a global object. Using it directly resolves the TypeScript error.
  // FIX: Cast `process` to `any` to resolve TypeScript error about property 'platform' not existing on type 'Process'.
  if ((process as any).platform !== 'darwin') app.quit();
});