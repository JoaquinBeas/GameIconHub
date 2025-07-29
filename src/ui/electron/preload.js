// electron/preload.js

const { contextBridge, ipcRenderer } = require('electron');

// Expose Electron window control actions to the renderer
contextBridge.exposeInMainWorld('electronAPI', {
    winAction: (action) => ipcRenderer.invoke('win-action', action),
});

// Expose custom app-specific API to the renderer
contextBridge.exposeInMainWorld('api', {
    saveData: (data) => ipcRenderer.invoke('save-data', data),
    loadData: () => ipcRenderer.invoke('load-data'),
    deleteShortcut: (appName) => ipcRenderer.invoke('delete-shortcut', appName),
});

// Expose filesystem read access to the renderer (read-only)
contextBridge.exposeInMainWorld('fs', {
    readFile: (filePath, options) => ipcRenderer.invoke('read-file', filePath, options)
});
