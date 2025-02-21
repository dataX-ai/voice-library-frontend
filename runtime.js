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

async function initializeApp() {
    const loadingScreen = document.querySelector('.loading-screen');
    const loadingSpinner = loadingScreen.querySelector('.loading-spinner');
    const successCheck = loadingScreen.querySelector('.success-check');
    const loadingText = loadingScreen.querySelector('.loading-text');
    const statusText = document.getElementById('docker-status-text');
    const dockerInstallContainer = document.querySelector('.docker-install-container');
    const mainContent = document.querySelector('.main-content');

    try {
        // Check Docker status
        const dockerStatus = await checkDockerInstallation();
        
        if (dockerStatus.installed && dockerStatus.running) {
            // Update status text
            loadingText.textContent = 'Checking Model Container...';
            statusText.textContent = 'Setting up model environment...';

            try {
                // Check and setup model container
                await window.electronAPI.checkModelContainer();
                
                // Swap spinner with success check
                loadingSpinner.style.opacity = '0';
                setTimeout(() => {
                    loadingSpinner.style.display = 'none';
                    successCheck.style.display = 'block';
                    setTimeout(() => {
                        successCheck.style.opacity = '1';
                    }, 50);
                }, 300);

                // Show success message
                loadingText.textContent = 'Model Environment Ready';
                statusText.textContent = 'Initializing application...';
                
                // Wait 2 seconds then show main content
                setTimeout(() => {
                    // Fade out loading screen
                    loadingScreen.style.transition = 'opacity 0.5s ease-out';
                    loadingScreen.style.opacity = '0';
                    
                    // Show main content
                    mainContent.style.display = 'flex';
                    mainContent.classList.add('visible');
                    
                    // Remove loading screen after fade
                    setTimeout(() => {
                        loadingScreen.style.display = 'none';
                    }, 500);
                }, 2000);
            } catch (containerError) {
                loadingText.textContent = 'Error Setting Up Model Environment';
                statusText.textContent = containerError.message;
                console.error('Container setup error:', containerError);
            }
        } else {
            // Show Docker installation required message
            loadingText.textContent = 'Docker Setup Required';
            statusText.textContent = dockerStatus.installed ? 
                'Docker is installed but not running' : 
                'Docker is not installed';
            
            // Show install button
            dockerInstallContainer.style.display = 'block';
            
            // Add click handler for install button
            const installButton = dockerInstallContainer.querySelector('.setup-docker-btn');
            installButton.addEventListener('click', async () => {
                try {
                    loadingText.textContent = 'Installing Docker';
                    statusText.textContent = 'This may take a few minutes...';
                    dockerInstallContainer.style.display = 'none';
                    
                    // Start Docker installation
                    await window.electronAPI.installDocker();
                    
                    // Check status again after installation
                    const newStatus = await checkDockerInstallation();
                    if (newStatus.installed && newStatus.running) {
                        loadingText.textContent = 'Docker Installed Successfully';
                        statusText.textContent = 'Initializing application...';
                        
                        // Wait 2 seconds then show main content
                        setTimeout(() => {
                            loadingScreen.style.transition = 'opacity 0.5s ease-out';
                            loadingScreen.style.opacity = '0';
                            mainContent.style.display = 'flex';
                            mainContent.classList.add('visible');
                            setTimeout(() => {
                                loadingScreen.style.display = 'none';
                            }, 500);
                        }, 2000);
                    } else {
                        throw new Error('Docker installation failed');
                    }
                } catch (error) {
                    loadingText.textContent = 'Docker Installation Failed';
                    statusText.textContent = 'Please install Docker manually';
                    dockerInstallContainer.style.display = 'block';
                    console.error('Docker installation error:', error);
                }
            });
        }
    } catch (error) {
        loadingText.textContent = 'Error Checking Docker Status';
        statusText.textContent = 'Please try again';
        console.error('Docker check error:', error);
    }
}

// Call initializeApp when the document is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Export functions if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeRuntimePage
    };
} 