// Fix: Replaced CommonJS `require` statements with ES6 `import` to resolve "Cannot find name 'require'" errors and align with modern TypeScript practices.
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
// Fix: Import the 'process' module to provide correct typings for `process.cwd()` and `process.platform`, resolving TypeScript errors.
import * as process from 'process';
import { starterPresets } from '../data/presets';
import { starterMacros } from '../data/macros';

const isDev = !app.isPackaged;

// --- Settings Management ---
// Use app.getPath('userData') which is the standard, writable location for app data.
const settingsPath = path.join(app.getPath('userData'), 'settings.json');

const defaultSettings = {
  aiSettings: {
    provider: 'ollama',
    baseUrl: 'http://localhost:11434',
    model: 'llama3',
  },
  presets: starterPresets,
  macros: starterMacros,
};

ipcMain.handle('read-settings', () => {
  try {
    if (fs.existsSync(settingsPath)) {
      const rawData = fs.readFileSync(settingsPath, 'utf-8');
      return JSON.parse(rawData);
    } else {
      // File doesn't exist, create it with defaults
      fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
      return defaultSettings;
    }
  } catch (error) {
    console.error('Failed to read or create settings file:', error);
    // On error, return defaults to allow the app to run
    return defaultSettings;
  }
});

ipcMain.on('write-settings', (event, settings) => {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Failed to write settings file:', error);
  }
});


// --- Logging ---
const logDir = isDev ? process.cwd() : path.dirname(app.getPath('exe'));
const getLogFileName = () => `udio-prompt-crafter-${new Date().toISOString().split('T')[0]}.log`;
let currentLogFilePath = path.join(logDir, getLogFileName());

ipcMain.on('write-log', (event, logEntry) => {
  currentLogFilePath = path.join(logDir, getLogFileName());
  const contextString = logEntry.context ? ` ${JSON.stringify(logEntry.context, null, 2)}` : '';
  const formattedMessage = `${logEntry.timestamp} [${logEntry.level}] ${logEntry.message}${contextString}\n`;
  
  fs.appendFile(currentLogFilePath, formattedMessage, (err) => {
    if (err) console.error('Failed to write to log file:', err);
  });
});

ipcMain.on('show-item-in-folder', () => {
    if (!fs.existsSync(currentLogFilePath)) {
      fs.writeFileSync(currentLogFilePath, `Log file for ${new Date().toISOString()} created.\n`);
    }
    shell.showItemInFolder(currentLogFilePath);
});

ipcMain.handle('get-logs-path', () => {
    return path.join(logDir, getLogFileName());
});

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: "UDIO Prompt Crafter"
  });

  mainWindow.setMenu(null);
  mainWindow.loadFile(path.join(__dirname, '../index.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
