// preload.js 

const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

contextBridge.exposeInMainWorld('electronAPI', {
    getModelsDirectory: () => ipcRenderer.invoke('get-models-directory'),
    selectDirectory: () => ipcRenderer.invoke('select-directory'),
    listModels: (directory) => ipcRenderer.invoke('list-models', directory)
});

contextBridge.exposeInMainWorld('electron', {
    switchContent: (contentType) => ipcRenderer.send('switch-content', contentType)
}); 
