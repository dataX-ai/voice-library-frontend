const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;

try {
    require('electron-reloader')(module, {
        debug: true,
        watchRenderer: true
    });
} catch (_) { console.log('Error'); }

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainWindow.loadFile('index.html');

    // Open DevTools (optional, for development)
    // mainWindow.webContents.openDevTools()
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
});

// IPC Handlers
ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });
    return result.filePaths[0];
});

ipcMain.handle('list-models', async (event, directory) => {
    try {
        const files = await fs.readdir(directory);
        return files.filter(file =>
            file.endsWith('.bin') ||
            file.endsWith('.gguf') ||
            file.endsWith('.ggml')
        );
    } catch (error) {
        console.error('Error listing models:', error);
        return [];
    }
}); 
