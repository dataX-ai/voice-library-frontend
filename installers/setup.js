const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function setupDev() {
    if (process.platform === 'linux') {
        const rulesPath = '/etc/polkit-1/rules.d/50-docker.rules';
        const sourceRules = path.join(__dirname, '50-docker.rules');
        
        try {
            execSync(`pkexec bash -c '
                mkdir -p /etc/polkit-1/rules.d/
                cp "${sourceRules}" "${rulesPath}"
                chmod 644 "${rulesPath}"
                systemctl restart polkit
            '`);
            console.log('Polkit rules installed successfully');
        } catch (error) {
            console.error('Failed to install polkit rules:', error);
        }
    }
}

setupDev(); 