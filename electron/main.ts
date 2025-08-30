// Fix: Replaced CommonJS `require` statements with ES6 `import` to resolve "Cannot find name 'require'" errors and align with modern TypeScript practices.
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
// Note: 'process' is a global in Node.js environments and does not need to be imported.
// The explicit import was removed to prevent shadowing the correctly-typed global variable.
import { starterPresets } from '../data/presets';

// Note: We are calculating paths manually to avoid using `__dirname`, which is not available in ES modules
// and can be unreliable when bundled. `app.getAppPath()` provides a consistent base path for both
// development and packaged applications.
const isDev = !app.isPackaged;
const appRoot = app.getAppPath();

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
  promptPanelRatio: 50,
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

// --- Documentation ---
ipcMain.handle('read-markdown-file', (event, filename) => {
  try {
    // For packaged app, docs are in resources/docs. For dev, they are in dist/docs.
    // FIX: Replaced __dirname with a reliable pathing solution using app.getAppPath().
    const docsPath = isDev 
        ? path.join(appRoot, 'dist', 'docs') 
        // Fix: Cast process to any to access Electron-specific `resourcesPath` property.
        : path.join((process as any).resourcesPath, 'docs');
    const filePath = path.join(docsPath, filename);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    } else {
       console.error(`Markdown file not found: ${filePath}`);
       return `Error: Could not find documentation file '${filename}'.`;
    }
  } catch (error: any) {
    console.error(`Failed to read markdown file ${filename}:`, error);
    return `Error: Could not read documentation file. ${error.message}`;
  }
});

// --- App Info ---
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// --- Logging ---
// Fix: Cast `process` to `any` to access the `cwd` method, resolving a type error
// where the global `process` object type is incomplete.
const logDir = isDev ? (process as any).cwd() : path.dirname(app.getPath('exe'));
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
  // FIX: Replaced __dirname with a reliable pathing solution using app.getAppPath().
  const preloadPath = isDev
    ? path.join(appRoot, 'dist', 'electron', 'preload.js')
    : path.join(appRoot, 'electron', 'preload.js');

  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: "UDIO Prompt Crafter"
  });

  mainWindow.setMenu(null);
  
  // FIX: Replaced __dirname with a reliable pathing solution using app.getAppPath().
  const indexPath = isDev
    ? path.join(appRoot, 'dist', 'index.html')
    : path.join(appRoot, 'index.html');
  mainWindow.loadFile(indexPath);
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // Fix: Cast `process` to `any` to access the `platform` property, resolving a type error
  // where the global `process` object type is incomplete.
  if ((process as any).platform !== 'darwin') app.quit();
});
