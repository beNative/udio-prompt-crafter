const { app, BrowserWindow } = require('electron');
const path = require('path');

// Fix: Explicitly import `platform` from the `process` module. This resolves a
// TypeScript error where `process.platform` was not found on the global type.
const { platform } = require('process');

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