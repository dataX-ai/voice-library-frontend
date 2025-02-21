// preload.js 

const { contextBridge, ipcRenderer } = require('electron');


// Get the config directly without using path
const CONFIG = {
    LOCAL_ENDPOINT: 'http://127.0.0.1:3100',
    BACKEND_ENDPOINT: 'http://127.0.0.1:8000',
    GENERATE_AUDIO_ENDOPOINT: 'http://127.0.0.1:3100/tts',
    DOWNLOAD_ENDPOINT: 'ws://127.0.0.1:3100/ws/download-model',
    DOWNLOAD_STATUS: {
        PENDING: -1,
        DOWNLOADING: 0,
        READY: 1
    }
};

// Instead of using path directly, we'll handle path operations through main process
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
    runDockerCheck: () => ipcRenderer.invoke('run-docker-check'),
    checkModelContainer: () => ipcRenderer.invoke('check-model-container'),
    getAbsolutePath: (relativePath) => ipcRenderer.invoke('get-absolute-path', relativePath),
    config: CONFIG
});
