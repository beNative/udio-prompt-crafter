// This script runs in a privileged environment with access to Node.js.
// You can use the contextBridge to securely expose APIs to the renderer process.
// Fix: Replaced CommonJS `require` with ES6 `import` to resolve "Cannot find name 'require'" error.
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  writeLog: (logEntry) => ipcRenderer.send('write-log', logEntry),
  showItemInFolder: () => ipcRenderer.send('show-item-in-folder'),
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
});