// Fix: Replaced CommonJS `require` statements with ES6 `import` to resolve "Cannot find name 'require'" errors and align with modern TypeScript practices.
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { platform, cwd } from 'process';
// Fix: Add necessary imports to recreate __dirname in an ES module environment.
import { fileURLToPath } from 'url';

// --- Start of new logging code ---
const isDev = !app.isPackaged;
// In dev, log to project root. In packaged app, log next to executable.
const logDir = isDev ? cwd() : path.dirname(app.getPath('exe'));

const getLogFileName = () => {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `udio-prompt-crafter-${date}.log`;
};

// We define this here so both handlers can use it. It's updated on each write.
let currentLogFilePath = path.join(logDir, getLogFileName());

ipcMain.on('write-log', (event, logEntry) => {
  // Re-evaluate file path in case the date has changed since app start
  currentLogFilePath = path.join(logDir, getLogFileName());
  const contextString = logEntry.context ? ` ${JSON.stringify(logEntry.context, null, 2)}` : '';
  const formattedMessage = `${logEntry.timestamp} [${logEntry.level}] ${logEntry.message}${contextString}\n`;
  
  fs.appendFile(currentLogFilePath, formattedMessage, (err) => {
    if (err) console.error('Failed to write to log file:', err);
  });
});

ipcMain.on('show-item-in-folder', () => {
    // Ensure the file exists before trying to show it, otherwise create it.
    if (!fs.existsSync(currentLogFilePath)) {
      fs.writeFileSync(currentLogFilePath, `Log file for ${new Date().toISOString()} created.\n`);
    }
    shell.showItemInFolder(currentLogFilePath);
});

ipcMain.handle('get-logs-path', () => {
    return path.join(logDir, getLogFileName());
});
// --- End of new logging code ---

// Fix: Recreate __dirname for ES modules in Electron, as it's not available by default. This resolves the "Cannot find name '__dirname'" error.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  // The path will be 'dist/index.html'
  mainWindow.loadFile(path.join(__dirname, '../index.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (platform !== 'darwin') app.quit();
});
