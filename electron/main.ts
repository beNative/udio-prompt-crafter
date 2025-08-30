/// <reference types="node" />
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { starterPresets } from '../data/presets';

const isDev = !app.isPackaged;

function createWindow(appRoot: string) {
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

  const indexPath = isDev
    ? path.join(appRoot, 'dist', 'index.html')
    : path.join(appRoot, 'index.html');
  mainWindow.loadFile(indexPath);
}

// All app event listeners and IPC handlers should be registered after the app is ready.
app.whenReady().then(() => {
  const appRoot = app.getAppPath();

  // --- Settings Management ---
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
        fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
        return defaultSettings;
      }
    } catch (error) {
      console.error('Failed to read or create settings file:', error);
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
      const docsPath = isDev 
          ? path.join(appRoot, 'dist', 'docs') 
          // Fix: Use global.process to avoid potential type conflicts with a shadowed `process` variable.
          : path.join(global.process.resourcesPath, 'docs');
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
  // Fix: Use global.process to avoid potential type conflicts with a shadowed `process` variable.
  const logDir = isDev ? global.process.cwd() : path.dirname(app.getPath('exe'));
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

  createWindow(appRoot);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(appRoot);
  });
});

app.on('window-all-closed', () => {
  // Fix: Use global.process to avoid potential type conflicts with a shadowed `process` variable.
  if (global.process.platform !== 'darwin') app.quit();
});