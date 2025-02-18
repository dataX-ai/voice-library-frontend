const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class DockerManager {
    static async getInstallScript() {
        const scriptsPath = path.join(__dirname, 'scripts');
        
        switch (process.platform) {
            case 'win32':
                return path.join(scriptsPath, 'docker_win.bat');
            case 'darwin':
                return path.join(scriptsPath, 'docker_macos.sh');
            case 'linux':
                return path.join(scriptsPath, 'docker_linux.sh');
            default:
                throw new Error('Unsupported platform');
        }
    }

    // Check if Docker is installed
    static checkInstallation() {
        return new Promise((resolve) => {
            exec('docker --version', (error) => {
                resolve(!error);
            });
        });
    }

    static async checkWingetInstallation() {
        return new Promise((resolve) => {
            exec('winget --version', (error) => {
                resolve(!error);
            });
        });
    }

    // Install Docker using platform-specific scripts
    static async installDocker() {
        try {
            const scriptPath = await this.getInstallScript();
            
            // Make script executable on Unix-like systems
            if (process.platform !== 'win32') {
                await fs.chmod(scriptPath, '755');
            }

            return new Promise((resolve, reject) => {
                const command = process.platform === 'win32' 
                    ? scriptPath 
                    : `sh "${scriptPath}"`;

                const proc = exec(command, (error, stdout, stderr) => {
                    if (error) {
                        reject(new Error(`Docker installation failed: ${error.message}`));
                        return;
                    }
                    console.log('Installation output:', stdout);
                    if (stderr) console.error('Installation warnings:', stderr);
                    resolve(true);
                });

                // Log real-time output
                proc.stdout.on('data', (data) => {
                    console.log('Installation progress:', data);
                    // You can emit these events through IPC if needed
                });

                proc.stderr.on('data', (data) => {
                    console.error('Installation warning:', data);
                    // You can emit these events through IPC if needed
                });
            });
        } catch (error) {
            throw new Error(`Failed to execute installation script: ${error.message}`);
        }
    }

    // Check Docker service status
    static checkServiceStatus() {
        return new Promise((resolve) => {
            const command = process.platform === 'win32'
                ? 'docker info'
                : 'systemctl is-active docker';

            exec(command, (error) => {
                resolve(!error);
            });
        });
    }

    // Get Docker version info
    static getVersionInfo() {
        return new Promise((resolve, reject) => {
            exec('docker version --format json', (error, stdout) => {
                if (error) {
                    reject(new Error('Failed to get Docker version'));
                    return;
                }
                try {
                    resolve(JSON.parse(stdout));
                } catch (e) {
                    reject(new Error('Failed to parse Docker version info'));
                }
            });
        });
    }
}

module.exports = DockerManager; 