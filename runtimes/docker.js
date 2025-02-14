const { exec } = require('child_process');

class DockerManager {
    // Check if Docker is installed
    static checkInstallation() {
        return new Promise((resolve) => {
            exec('docker --version', (error) => {
                resolve(!error);
            });
        });
    }

    // Install Docker (basic implementation - can be expanded)
    static installDocker() {
        return new Promise((resolve, reject) => {
            // This is a basic example - you'll want to adjust based on OS
            const command = process.platform === 'win32'
                ? 'powershell -Command "Start-Process powershell -Verb RunAs -ArgumentList \'-Command Install-Module DockerMsftProvider -Force; Install-Package Docker -ProviderName DockerMsftProvider -Force\'"'
                : 'curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh';

            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`Docker installation failed: ${error.message}`));
                    return;
                }
                resolve(true);
            });
        });
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