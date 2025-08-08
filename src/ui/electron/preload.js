// electron/preload.js

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  winAction: (action) => ipcRenderer.invoke('win-action', action),
});

contextBridge.exposeInMainWorld('api', {
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  loadData: () => ipcRenderer.invoke('load-data'),
  deleteShortcut: (appName) => ipcRenderer.invoke('delete-shortcut', appName),
});

// Exponemos funciones de FS
contextBridge.exposeInMainWorld('fs', {
  readFile: (filePath, options) => ipcRenderer.invoke('read-file', filePath, options),
  unlink: (filePath) => ipcRenderer.invoke('unlink-file', filePath)
});

// Exponemos la función para obtener la ruta al backend-config.json
contextBridge.exposeInMainWorld('paths', {
  getBackendConfigPath: () => ipcRenderer.invoke('get-backend-config-path')
});
