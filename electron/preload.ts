// This script runs in a privileged environment with access to Node.js.
// You can use the contextBridge to securely expose APIs to the renderer process.
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  writeLog: (logEntry) => ipcRenderer.send('write-log', logEntry),
  showLogInFolder: () => ipcRenderer.send('show-log-in-folder'),
  showSettingsInFolder: () => ipcRenderer.send('show-settings-in-folder'),
  getLogsPath: () => ipcRenderer.invoke('get-logs-path'),
  readSettings: () => ipcRenderer.invoke('read-settings'),
  writeSettings: (settings) => ipcRenderer.send('write-settings', settings),
  readMarkdownFile: (filename: string) => ipcRenderer.invoke('read-markdown-file', filename),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  readDebugLog: () => ipcRenderer.invoke('read-debug-log'),
  readDefaultTaxonomy: () => ipcRenderer.invoke('read-default-taxonomy'),
  readCustomTaxonomy: () => ipcRenderer.invoke('read-custom-taxonomy'),
  writeCustomTaxonomy: (taxonomy) => ipcRenderer.send('write-custom-taxonomy', taxonomy),
  resetCustomTaxonomy: () => ipcRenderer.send('reset-custom-taxonomy'),

  // Update mechanism
  onUpdateEvent: (callback) => {
    const listener = (event, ...args) => callback(...args);
    ipcRenderer.on('update-event', listener);
    return () => {
      ipcRenderer.removeListener('update-event', listener);
    };
  },
  checkForUpdates: () => ipcRenderer.send('check-for-updates'),
  downloadUpdate: () => ipcRenderer.send('download-update'),
  restartAndInstall: () => ipcRenderer.send('restart-and-install'),
});