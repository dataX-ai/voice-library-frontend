const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electron',
  {
    invoke: (channel, data) => {
      const validChannels = [
        // Docker related channels
        'docker:check',
        'docker:install',
        'docker:checkModelContainer',
        // System info channels
        'system:getInfo',
        'system:getPerformanceStats',
        // Model management channels
        'fetch-downloaded-models',
        'fetch-loaded-models',
        'fetch-model-details',
        'load-model',
        'unload-model',
        'delete-model',
        'fetch-models',
        'start-model-download'
      ];
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, data);
      }
      throw new Error(`Invalid IPC channel: ${channel}`);
    },
    on: (channel, func) => {
      const validChannels = [
        'download-progress',
        'system:performanceUpdate'
      ];
      if (validChannels.includes(channel)) {
        // Strip event as it includes `sender` 
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    removeListener: (channel, func) => {
      const validChannels = [
        'download-progress',
        'system:performanceUpdate'
      ];
      if (validChannels.includes(channel)) {
        ipcRenderer.removeListener(channel, func);
      }
    }
  }
); 