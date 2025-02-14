const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const si = require('systeminformation');
const os = require('os');
const { exec } = require('child_process');
const DockerManager = require('./runtimes/docker.js');

// Move these lines before app.whenReady()
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu-cache');
app.commandLine.appendSwitch('disable-gpu');

try {
    require('electron-reloader')(module, {
        debug: true,
        watchRenderer: true
    });
} catch (_) { console.log('Error'); }

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 1024,
        minHeight: 768,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            partition: 'persist:main'
        }
    });

    win.loadFile('index.html');

    // For debugging
    win.webContents.openDevTools();
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

// Add IPC handler
ipcMain.on('switch-content', (event, contentType) => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) {
        win.webContents.send('content-switched', contentType)
    }
})

// Add these IPC handlers for system information
ipcMain.handle('get-system-info', async () => {
    try {
        const cpu = await si.cpu();
        const mem = await si.mem();
        const gpu = await si.graphics();

        // Log raw CPU data to see what's available
        console.log('Raw CPU Data:', cpu);

        // Convert architecture to display format
        const archDisplay = process.arch === 'x64' ? 'x64' : process.arch;

        // Check CPU flags for instruction set extensions
        const cpuFlags = (cpu.flags || '').toLowerCase();
        const hasAVX = cpuFlags.includes('avx');
        const hasAVX2 = cpuFlags.includes('avx2');

        console.log('CPU Flags:', {
            architecture: archDisplay,
            hasAVX,
            hasAVX2,
            rawFlags: cpuFlags
        });

        // More detailed GPU logging
        console.log('Detailed GPU Information:', {
            Controllers: gpu.controllers.map(c => ({
                Model: c.model,
                Vendor: c.vendor,
                Bus: c.bus,
                VRAM: c.vram,
                VRAMDynamic: c.memoryTotal,
                Driver: c.driver,
                DriverVersion: c.driverVersion,
                SubDeviceId: c.subDeviceId,
                Name: c.name
            }))
        });

        // Filter GPUs to only include dedicated graphics cards
        const dedicatedGPUs = gpu.controllers.filter(controller => {
            // Filter out Microsoft Basic Display Adapter and Intel integrated graphics
            return !controller.model.includes('Microsoft Basic Display') &&
                !controller.model.includes('Intel') &&
                controller.model !== null &&
                controller.model !== '';
        });

        console.log('Filtered GPU:', dedicatedGPUs);

        // Rest of your system info logging
        console.log('CPU:', {
            manufacturer: cpu.manufacturer,
            brand: cpu.brand,
            speed: cpu.speed,
            cores: cpu.cores,
            physicalCores: cpu.physicalCores
        });

        console.log('Memory:', {
            total: (mem.total / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
            free: (mem.free / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
            used: (mem.used / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
        });

        return {
            cpu: {
                architecture: archDisplay,
                model: cpu.brand || `${cpu.manufacturer} ${cpu.model}`,
                cores: cpu.cores,
                physicalCores: cpu.physicalCores,
                speed: cpu.speed,
                instructions: {
                    hasAVX: hasAVX,
                    hasAVX2: hasAVX2
                }
            },
            memory: {
                total: mem.total,
                free: mem.free,
                used: mem.used
            },
            gpu: dedicatedGPUs.map(controller => ({
                model: controller.model || controller.name || 'Unknown GPU',
                vram: controller.memoryTotal || controller.vram || 4096,
                vendor: controller.vendor || 'Unknown Vendor',
                driver: controller.driver,
                driverVersion: controller.driverVersion
            }))
        };
    } catch (error) {
        console.error('Error getting system info:', error);
        return null;
    }
});

// Simplified performance stats handler
ipcMain.handle('get-performance-stats', async () => {
    try {
        const currentLoad = await si.currentLoad();
        const mem = await si.mem();

        return {
            cpu: currentLoad.currentLoad.toFixed(2),
            memory: {
                used: mem.used,
                total: mem.total
            },
            gpu: [{  // Simplified GPU stats
                usage: 0,
                memoryUsed: 0,
                memoryTotal: 4096  // Default 4GB
            }]
        };
    } catch (error) {
        console.error('Error getting performance stats:', error);
        return null;
    }
});

// Docker-related IPC handlers
ipcMain.handle('check-docker', async () => {
    return await DockerManager.checkInstallation();
});

ipcMain.handle('install-docker', async () => {
    try {
        return await DockerManager.installDocker();
    } catch (error) {
        console.error('Docker installation error:', error);
        throw error;
    }
});

ipcMain.handle('docker-status', async () => {
    return await DockerManager.checkServiceStatus();
});

ipcMain.handle('docker-version', async () => {
    try {
        return await DockerManager.getVersionInfo();
    } catch (error) {
        console.error('Error getting Docker version:', error);
        throw error;
    }
}); 
