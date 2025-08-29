// This script runs in a privileged environment with access to Node.js.
// You can use the contextBridge to securely expose APIs to the renderer process.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  writeLog: (logEntry) => ipcRenderer.send('write-log', logEntry),
  showItemInFolder: () => ipcRenderer.send('show-item-in-folder'),
  getLogsPath: () => ipcRenderer.invoke('get-logs-path'),
});