// preload.js 

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
    getPerformanceStats: () => ipcRenderer.invoke('get-performance-stats'),
    selectDirectory: () => ipcRenderer.invoke('select-directory'),
    listModels: (directory) => ipcRenderer.invoke('list-models', directory),
    switchContent: (contentType) => ipcRenderer.send('switch-content', contentType),
    checkDocker: () => ipcRenderer.invoke('check-docker'),
    installDocker: () => ipcRenderer.invoke('install-docker'),
    getDockerStatus: () => ipcRenderer.invoke('docker-status'),
    getDockerVersion: () => ipcRenderer.invoke('docker-version'),
    runDockerCheck: () => ipcRenderer.invoke('run-docker-check')
}); 
