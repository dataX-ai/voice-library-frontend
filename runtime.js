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
    const terminal = document.querySelector('.terminal-window');
    const terminalOutput = document.querySelector('.terminal-output');
    
    function appendToTerminal(text, type = 'output') {
        const line = document.createElement('div');
        line.className = `terminal-line ${type}`;
        line.textContent = text;
        terminalOutput.appendChild(line);
        
        // Scroll to bottom with animation
        terminalOutput.scrollTo({
            top: terminalOutput.scrollHeight,
            behavior: 'smooth'
        });
        
        // Keep only the last 1000 lines to prevent memory issues
        while (terminalOutput.children.length > 1000) {
            terminalOutput.removeChild(terminalOutput.firstChild);
        }
    }
    
    if (checkDockerButton) {
        checkDockerButton.addEventListener('click', async () => {
            try {
                // Show terminal
                terminal.classList.add('active');
                terminalOutput.innerHTML = ''; // Clear previous output
                
                appendToTerminal('$ Checking Docker installation...', 'command');
                
                // Check Docker installation
                const isDockerInstalled = await window.electronAPI.checkDocker();
                
                if (isDockerInstalled) {
                    // If installed, get additional info
                    const isRunning = await window.electronAPI.getDockerStatus();
                    let statusMessage = '✅ Docker is installed';
                    
                    appendToTerminal(statusMessage, 'info');
                    
                    if (isRunning) {
                        try {
                            appendToTerminal('$ Checking Docker version...', 'command');
                            const versionInfo = await window.electronAPI.getDockerVersion();
                            statusMessage += ` and running (Version: ${versionInfo.Server.Version})`;
                            appendToTerminal(`Docker version: ${versionInfo.Server.Version}`, 'info');
                        } catch (e) {
                            statusMessage += ' and running';
                            appendToTerminal('Unable to get Docker version', 'error');
                        }
                    } else {
                        statusMessage += ' but not running';
                        appendToTerminal('Docker is not running', 'error');
                    }
                    
                    dockerStatus.innerHTML = `<div class="status-message success">${statusMessage}</div>`;
                } else {
                    appendToTerminal('Docker is not installed', 'error');
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
                                appendToTerminal('$ Starting Docker installation...', 'command');
                                await window.electronAPI.installDocker();
                                appendToTerminal('Docker installation completed successfully', 'info');
                                dockerStatus.innerHTML = '<div class="status-message success">✅ Docker installation initiated</div>';
                            } catch (error) {
                                appendToTerminal(`Installation failed: ${error.message}`, 'error');
                                dockerStatus.innerHTML = `<div class="status-message error">❌ Docker installation failed: ${error.message}</div>`;
                            }
                        });
                    }
                }
                
            } catch (error) {
                console.error('Error checking Docker:', error);
                appendToTerminal(`Error: ${error.message}`, 'error');
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