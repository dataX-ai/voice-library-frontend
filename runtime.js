document.addEventListener('DOMContentLoaded', () => {
    // Initialize runtime page functionality
    initializeRuntimePage();
});

async function checkDockerInstallation() {
    try {
        const result = await window.electronAPI.runDockerCheck();
        return result;
    } catch (error) {
        console.error('Error running Docker check script:', error);
        throw error;
    }
}

function createLoadingAnimation() {
    const loadingContainer = document.createElement('div');
    loadingContainer.className = 'loading-container';
    loadingContainer.innerHTML = `
        <div class="loading-spinner"></div>
        <div class="loading-text">Installing Docker...</div>
    `;
    return loadingContainer;
}

function initializeRuntimePage() {
    // This function will be used to initialize any runtime-specific functionality
    console.log('Runtime page initialized');
    
    // Get the check docker button
    const checkDockerButton = document.querySelector('.check-docker');
    const dockerStatusElement = document.querySelector('.docker-status');
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
                
                // appendToTerminal('$ Running Docker check script...', 'command');
                
                // Check Docker installation using script
                const dockerStatus = await checkDockerInstallation();
                
                if (dockerStatus.installed) {

                    let statusMessage = '✅ Docker is installed';
                    appendToTerminal(statusMessage, 'info');

                    let serviceMessage;
                    if (dockerStatus.running) {
                        serviceMessage = '✅ Docker Daemon is running';
                        appendToTerminal(serviceMessage, 'info');
                    } else {
                        serviceMessage = '❌ Docker Daemon is not running';
                        appendToTerminal('Docker is not running', 'error');
                    }
                } else {
                    appendToTerminal(dockerStatus.error || 'Docker is not installed', 'error');
                    dockerStatusElement.innerHTML = `
                        <div class="status-message error">❌ Docker is not installed
                            <button class="action-button install-docker">
                                <span>🐳</span> Install Docker
                            </button>
                        </div>`;
                    
                    // Add install button listener
                    const installButton = dockerStatusElement.querySelector('.install-docker');
                    if (installButton) {
                        installButton.addEventListener('click', async () => {
                            try {
                                // Create and show loading animation
                                const loadingAnimation = createLoadingAnimation();
                                dockerStatusElement.appendChild(loadingAnimation);
                                installButton.disabled = true;

                                // Start a loading message update loop
                                let dots = '';
                                const loadingText = loadingAnimation.querySelector('.loading-text');
                                const loadingInterval = setInterval(() => {
                                    dots = dots.length >= 3 ? '' : dots + '.';
                                    loadingText.textContent = `Installing Docker${dots}`;
                                }, 500);

                                appendToTerminal('$ Starting Docker installation...', 'command');
                                
                                // Start installation
                                await window.electronAPI.installDocker();
                                
                                // Clear loading animation
                                clearInterval(loadingInterval);
                                loadingAnimation.remove();
                                installButton.disabled = false;

                                appendToTerminal('Docker installation completed successfully', 'info');
                                dockerStatusElement.innerHTML = '<div class="status-message success">✅ Docker installation completed</div>';
                                
                                // Trigger a Docker check after installation
                                await checkDockerInstallation();
                            } catch (error) {
                                // Clear loading animation on error too
                                clearInterval(loadingInterval);
                                loadingAnimation?.remove();
                                installButton.disabled = false;

                                appendToTerminal(`Installation failed: ${error.message}`, 'error');
                                dockerStatusElement.innerHTML = `<div class="status-message error">❌ Docker installation failed: ${error.message}</div>`;
                            }
                        });
                    }
                }
                
            } catch (error) {
                console.error('Error checking Docker:', error);
                appendToTerminal(`Error: ${error.message}`, 'error');
                dockerStatusElement.innerHTML = '<div class="status-message error">❌ Error checking Docker installation</div>';
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