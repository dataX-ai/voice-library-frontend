// preload.js 

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
    getPerformanceStats: () => ipcRenderer.invoke('get-performance-stats'),
    selectDirectory: () => ipcRenderer.invoke('select-directory'),
    listModels: (directory) => ipcRenderer.invoke('list-models', directory),
    switchContent: (contentType) => ipcRenderer.send('switch-content', contentType)
});

// Add this to allow fetch in the renderer process
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; 
