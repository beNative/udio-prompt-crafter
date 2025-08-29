// This script runs in a privileged environment with access to Node.js.
// You can use the contextBridge to securely expose APIs to the renderer process.
// Fix: Replaced CommonJS `require` with ES6 `import` to resolve "Cannot find name 'require'" error.
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  writeLog: (logEntry) => ipcRenderer.send('write-log', logEntry),
  showItemInFolder: () => ipcRenderer.send('show-item-in-folder'),
  getLogsPath: () => ipcRenderer.invoke('get-logs-path'),
});