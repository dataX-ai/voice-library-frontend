document.addEventListener('DOMContentLoaded', () => {
    // Initialize runtime page functionality
    initializeRuntimePage();
});

function initializeRuntimePage() {
    // This function will be used to initialize any runtime-specific functionality
    console.log('Runtime page initialized');
    
    // Get the check docker button
    const checkDockerButton = document.querySelector('.check-docker');
    const dockerStatus = document.querySelector('.docker-status');
    
    if (checkDockerButton) {
        checkDockerButton.addEventListener('click', async () => {
            try {
                // Check Docker installation
                const isDockerInstalled = await window.electronAPI.checkDocker();
                
                if (isDockerInstalled) {
                    // If installed, get additional info
                    const isRunning = await window.electronAPI.getDockerStatus();
                    let statusMessage = '<div class="status-message success">✅ Docker is installed';
                    
                    if (isRunning) {
                        try {
                            const versionInfo = await window.electronAPI.getDockerVersion();
                            statusMessage += ` and running (Version: ${versionInfo.Server.Version})`;
                        } catch (e) {
                            statusMessage += ' and running';
                        }
                    } else {
                        statusMessage += ' but not running';
                    }
                    
                    statusMessage += '</div>';
                    dockerStatus.innerHTML = statusMessage;
                } else {
                    dockerStatus.innerHTML = `
                        <div class="status-message error">❌ Docker is not installed
                            <button class="action-button install-docker">
                                <span>🐳</span> Install Docker
                            </button>
                        </div>`;
                    
                    // Add install button listener
                    const installButton = dockerStatus.querySelector('.install-docker');
                    if (installButton) {
                        installButton.addEventListener('click', async () => {
                            try {
                                await window.electronAPI.installDocker();
                                dockerStatus.innerHTML = '<div class="status-message success">✅ Docker installation initiated</div>';
                            } catch (error) {
                                dockerStatus.innerHTML = `<div class="status-message error">❌ Docker installation failed: ${error.message}</div>`;
                            }
                        });
                    }
                }
                
            } catch (error) {
                console.error('Error checking Docker:', error);
                dockerStatus.innerHTML = '<div class="status-message error">❌ Error checking Docker installation</div>';
            }
        });
    }
}

// Export functions if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeRuntimePage
    };
} 