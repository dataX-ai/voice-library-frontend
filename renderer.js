// Replace the direct CONFIG assignment with a function to get CONFIG

function getConfig() {
    return window.electronAPI.config;
}

// At the beginning of the file, after the initial variable declarations
// Add all styles in one place
const styles = document.createElement('style');
styles.textContent = `
    /* Progress bar styles */
    .progress-bar::before {
        width: var(--progress, 0%);
    }

    /* Model dropdown styles */
    .action-button-wrapper {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        background: #f8fafc;
        padding: 8px;
        border-radius: 8px;
    }

    .models-dropdown {
        position: relative;
        min-width: 180px;
    }

    .models-select {
        width: 100%;
        padding: 8px 32px 8px 12px;
        font-size: 14px;
        border: 2px solid #e2e8f0;
        border-radius: 6px;
        background-color: white;
        cursor: pointer;
        appearance: none;
        -webkit-appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M2.22 4.47a.75.75 0 0 1 1.06 0L6 7.19l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L2.22 5.53a.75.75 0 0 1 0-1.06z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 8px center;
        color: #1a202c;
        height: 36px;
        line-height: 1.2;
    }

    .models-select:focus {
        outline: none;
        border-color: #4F46E5;
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }

    .models-select:hover {
        border-color: #cbd5e0;
    }

    .action-button {
        margin: 0;
    }

    .models-select option {
        padding: 8px;
        font-size: 14px;
    }

    /* Download button styles */
    .action-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .download-btn {
        background-color: #4F46E5;
        color: white;
        border: none;
    }
    
    .download-btn:hover {
        background-color: #4338CA;
    }
    
    .downloaded-btn {
        background-color: #80c492;
        color: white;
        border: none;
        opacity: 0.8;
        cursor: default;
    }
    
    .downloaded-btn i {
        color: white;
    }

    .download-btn:disabled,
    .downloaded-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    /* Sidebar and content visibility fixes */
    .sidebar-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        cursor: pointer;
        padding: 10px;
    }

    .voice-dropdown {
        display: none;
        position: absolute;
        left: 100%;
        top: 0;
        background: white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        border-radius: 4px;
        z-index: 1000;
        min-width: 200px;
    }

    .voice-option {
        padding: 8px 16px;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .voice-option:hover {
        background-color: #f3f4f6;
    }

    .voice-content {
        display: none;
    }

    .voice-content.active {
        display: block;
    }

    /* My Models specific styles */
    .my-models .models-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 16px;
    }

    .model-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .model-status {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
    }

    .model-status.running {
        background-color: #10B981;
        color: white;
    }

    .model-status.downloaded {
        background-color: #6B7280;
        color: white;
    }
`;
document.head.appendChild(styles);

document.addEventListener('DOMContentLoaded', async () => {
    const CONFIG = getConfig();
    // Fetch downloaded models first
    await fetchDownloadedModels();
    
    // Then fetch and display models
    await fetchAndDisplayModels();
    
    // Show initial model (first model in the list)
    const firstModel = document.querySelector('.model-list-item');
    if (firstModel) {
        firstModel.click();
    }

    // Create the dropdown for Text to Speech since it's the default view
    const voiceoverButton = document.querySelector('.action-button:nth-child(3)');
    if (voiceoverButton && !voiceoverButton.closest('.action-button-wrapper')) {
        // Create a flex container for the button and dropdown
        const wrapper = document.createElement('div');
        wrapper.className = 'action-button-wrapper';
        
        // Get the button's parent and position
        const parent = voiceoverButton.parentNode;
        const buttonIndex = Array.from(parent.children).indexOf(voiceoverButton);
        
        // Move the button into the wrapper
        wrapper.appendChild(voiceoverButton);
        
        // Create and add the dropdown
        const dropdown = await createModelsDropdown();
        wrapper.appendChild(dropdown);
        
        // Replace the original button with the wrapper
        parent.insertBefore(wrapper, parent.children[buttonIndex]);
    }

    // Remove backdrop creation
    let activeDropdown = null;

    document.querySelectorAll('.sidebar-icon').forEach(icon => {
        icon.addEventListener('click', function (e) {
            e.stopPropagation();
            const dropdown = this.querySelector('.voice-dropdown');

            if (activeDropdown && activeDropdown !== dropdown) {
                activeDropdown.style.display = 'none';
            }

            if (dropdown.style.display === 'block') {
                dropdown.style.display = 'none';
                activeDropdown = null;
            } else {
                dropdown.style.display = 'block';
                activeDropdown = dropdown;
            }
        });
    });

    // Handle voice option clicks
    document.querySelectorAll('.voice-option').forEach(option => {
        option.addEventListener('click', async function (e) {
            e.stopPropagation();
            const optionText = this.textContent;

            // Hide all content sections first
            document.querySelectorAll('.voice-content').forEach(div => {
                div.classList.remove('active');
                div.style.display = 'none'; // Explicitly hide all sections
            });

            // Show appropriate content based on option clicked
            if (optionText.includes('Text to Speech')) {
                const ttsSection = document.querySelector('.text-to-speech');
                ttsSection.classList.add('active');
                ttsSection.style.display = 'block'; // Explicitly show the section
                
                // Create the voiceover button wrapper and dropdown when TTS page is shown
                const voiceoverButton = document.querySelector('.action-button:nth-child(3)');
                if (voiceoverButton && !voiceoverButton.closest('.action-button-wrapper')) {
                    // Create a flex container for the button and dropdown
                    const wrapper = document.createElement('div');
                    wrapper.className = 'action-button-wrapper';
                    
                    // Get the button's parent and position
                    const parent = voiceoverButton.parentNode;
                    const buttonIndex = Array.from(parent.children).indexOf(voiceoverButton);
                    
                    // Move the button into the wrapper
                    wrapper.appendChild(voiceoverButton);
                    
                    // Create and add the dropdown
                    const dropdown = await createModelsDropdown();
                    wrapper.appendChild(dropdown);
                    
                    // Replace the original button with the wrapper
                    parent.insertBefore(wrapper, parent.children[buttonIndex]);
                }
                
                // Always update dropdown options when switching to TTS
                const select = document.getElementById('models-select');
                if (select) {
                    await updateDropdownOptions(select);
                }
            } else if (optionText.includes('Search Models')) {
                const searchSection = document.querySelector('.model-search');
                searchSection.classList.add('active');
                searchSection.style.display = 'block';
                fetchAndDisplayModels();
            } else if (optionText.includes('My Models')) {
                const myModelsSection = document.querySelector('.my-models');
                myModelsSection.classList.add('active');
                myModelsSection.style.display = 'block';
                fetchAndDisplayMyModels();
            } else if (optionText.includes('Text to SFX')) {
                const sfxSection = document.querySelector('.text-to-sfx');
                sfxSection.classList.add('active');
                sfxSection.style.display = 'block';
            } else if (optionText.includes('Voice Changer')) {
                const changerSection = document.querySelector('.voice-changer');
                changerSection.classList.add('active');
                changerSection.style.display = 'block';
            } else if (optionText.includes('Voice Cloning')) {
                const cloningSection = document.querySelector('.voice-cloning');
                cloningSection.classList.add('active');
                cloningSection.style.display = 'block';
            } else if (optionText.includes('System Info')) {
                const sysInfoSection = document.querySelector('.system-info');
                sysInfoSection.classList.add('active');
                sysInfoSection.style.display = 'block';
                updateSystemInfo();
                const statsInterval = setInterval(updatePerformanceStats, 1000);
                this.dataset.statsInterval = statsInterval;
            } else if (optionText.includes('Runtimes')) {
                const runtimesSection = document.querySelector('.runtimes');
                runtimesSection.classList.add('active');
                runtimesSection.style.display = 'block';
            }

            // Close the dropdown after selection
            if (activeDropdown) {
                activeDropdown.style.display = 'none';
                activeDropdown = null;
            }

            // Handle cleanup of intervals
            if (!optionText.includes('System Info') && this.dataset.statsInterval) {
                clearInterval(this.dataset.statsInterval);
                delete this.dataset.statsInterval;
            }
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        if (activeDropdown) {
            activeDropdown.style.display = 'none';
            activeDropdown = null;
        }
    });

    // Prevent dropdown from closing when clicking inside it
    document.querySelectorAll('.voice-dropdown').forEach(dropdown => {
        dropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });

    // Show Text to Speech content by default
    const defaultSection = document.querySelector('.text-to-speech');
    if (defaultSection) {
        defaultSection.classList.add('active');
        defaultSection.style.display = 'block';
    }

    // Handle character count for both text-to-speech and text-to-sfx textareas
    const textInputs = {
        'text-input': document.querySelector('.text-to-speech .character-count'),
        'sfx-input': document.querySelector('.text-to-sfx .character-count')
    };

    Object.entries(textInputs).forEach(([inputId, counter]) => {
        const textarea = document.getElementById(inputId);
        if (textarea && counter) {
            textarea.addEventListener('input', function () {
                const length = this.value.length;
                counter.textContent = `${length}/500`;

                // Optional: Disable input if over limit
                if (length > 500) {
                    this.value = this.value.substring(0, 500);
                }
            });
        }
    });

    // Update the language selector handlers
    document.querySelectorAll('.language-select').forEach(selector => {
        selector.addEventListener('click', function (e) {
            e.stopPropagation();

            // Close any other open dropdowns
            document.querySelectorAll('.language-select.active').forEach(active => {
                if (active !== this) active.classList.remove('active');
            });

            // Toggle current dropdown
            this.classList.toggle('active');
        });
    });

    // Original language option handling
    document.querySelectorAll('.language-option').forEach(option => {
        option.addEventListener('click', function (e) {
            e.stopPropagation();
            const flagImg = this.querySelector('img').cloneNode(true);
            const languageText = this.querySelector('span').textContent;

            const selector = this.closest('.language-select');
            selector.querySelector('.flag-container img').replaceWith(flagImg);
            selector.querySelector('span').textContent = languageText;
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        document.querySelectorAll('.language-select.active').forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    });

    // Handle voice model selection
    document.querySelectorAll('.voice-model-option').forEach(option => {
        option.addEventListener('click', function (e) {
            e.stopPropagation();
            const avatar = this.querySelector('.voice-avatar img').cloneNode(true);
            const voiceName = this.querySelector('.voice-name').textContent;

            const selector = this.closest('.voice-select');
            selector.querySelector('.voice-avatar img').replaceWith(avatar);
            selector.querySelector('span').textContent = voiceName;
            selector.classList.remove('active');
        });
    });

    // Update the button click handlers
    document.querySelectorAll('.action-button').forEach(button => {
        button.addEventListener('click', function () {
            const textInput = document.getElementById('text-input');
            let text = '';

            // Check which button was clicked based on its content
            if (this.textContent.includes('Tell a Story')) {
                text = "Once, a curious inventor named Leo built a machine to capture dreams. At night, it recorded the colors, sounds, and feelings people experienced in their sleep. The machine made an extraordinary discovery—dreams could be shared and felt by others. Leo's invention brought people closer, allowing them to experience each other's joy, fears, and desires. It showed that we're all connected by the unseen threads of our subconscious. The dream world became a place for true empathy";
            } else if (this.textContent.includes('Introduce a Podcast')) {
                text = "Welcome to The Storyteller's Journey, where we dive deep into the art of crafting unforgettable narratives. Each episode, we explore the power of storytelling, from personal experiences to timeless tales that have shaped cultures. Join me as I chat with writers, filmmakers, and creators who have mastered the craft, offering insights that will help you unlock the storyteller within. Let's journey into the world of words and wonders together";
            } else if (this.textContent.includes('Create a video voiceover')) {
                text = "Every day, millions of moments unfold in this city—some fleeting, others life-changing. What makes each one special? The stories behind them. Today, we take you on a journey through the streets, capturing the heartbeat of this urban jungle. From unexpected encounters to quiet reflections, let's uncover the stories that bring this place to life";
            }

            if (textInput && text) {
                textInput.value = text;

                // Trigger input event to update character count
                const inputEvent = new Event('input', {
                    bubbles: true,
                    cancelable: true,
                });
                textInput.dispatchEvent(inputEvent);
            }
        });
    });

    // Handle model filtering
    const modelFilterInput = document.getElementById('modelFilterInput');
    if (modelFilterInput) {
        modelFilterInput.addEventListener('input', function () {
            const searchTerm = this.value.toLowerCase();
            document.querySelectorAll('.model-item').forEach(item => {
                const modelName = item.querySelector('h3').textContent.toLowerCase();
                if (modelName.includes(searchTerm)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    // Handle model actions
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const modelItem = this.closest('.model-item');
            const modelName = modelItem.querySelector('h3').textContent;
            const action = this.querySelector('span').textContent.toLowerCase();

            switch (action) {
                case 'stop':
                    modelItem.querySelector('.model-status').textContent = 'Stopped';
                    modelItem.querySelector('.model-status').classList.remove('running');
                    modelItem.querySelector('.model-status').classList.add('stopped');
                    this.innerHTML = '<i class="fas fa-play"></i><span>Start</span>';
                    this.classList.remove('stop-btn');
                    this.classList.add('start-btn');
                    break;
                case 'start':
                    modelItem.querySelector('.model-status').textContent = 'Running';
                    modelItem.querySelector('.model-status').classList.remove('stopped');
                    modelItem.querySelector('.model-status').classList.add('running');
                    this.innerHTML = '<i class="fas fa-stop"></i><span>Stop</span>';
                    this.classList.remove('start-btn');
                    this.classList.add('stop-btn');
                    break;
                case 'restart':
                    // Add restart animation
                    this.querySelector('i').style.animation = 'spin 1s linear';
                    setTimeout(() => {
                        this.querySelector('i').style.animation = '';
                    }, 1000);
                    break;
                case 'delete':
                    if (confirm(`Are you sure you want to delete ${modelName}?`)) {
                        modelItem.remove();
                    }
                    break;
            }
        });
    });

    // Add click handler for document
    document.addEventListener('click', (e) => {
        const modelSearchInput = document.getElementById('modelSearchInput');
        const searchResults = document.querySelector('.search-results');
        
        // Only run this check if both elements exist
        if (modelSearchInput && searchResults) {
            if (!modelSearchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.style.display = 'none';
            }
        }
    });

    // Update the play button handler
    let currentAudio = null;

    document.addEventListener('click', async (e) => {
        if (e.target.closest('button') && e.target.closest('button').textContent.includes('Generate')) {
            const generateButton = e.target.closest('button');
            try {
                // Get the selected model
                const modelSelect = document.getElementById('models-select');
                const selectedModel = modelSelect.value;
                if (!selectedModel) {
                    alert('Please select a model first');
                    return;
                }


                const textInput = document.getElementById('text-input');
                const text = textInput.value;

                if (!text.trim()) {
                    alert('Please enter some text first');
                    return;
                }
                // Disable button and show loading state
                generateButton.disabled = true;
                generateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';

                // Stop any currently playing audio
                if (currentAudio) {
                    currentAudio.pause();
                    currentAudio = null;
                }

                // Show audio controls with loading state
                const audioControls = document.querySelector('.audio-controls');
                audioControls.style.display = 'block';
                const currentTimeSpan = document.querySelector('.current-time');
                const durationSpan = document.querySelector('.duration');
                currentTimeSpan.textContent = '--:--';
                durationSpan.textContent = '--:--';

                // Include the selected model in your API call
                const response = await fetch(CONFIG.LOCAL_ENDPOINT + '/tts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        text,
                        model_id: selectedModel 
                    })
                });

                if (!response.ok) {
                    console.error('HTTP error:', response.status);
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                const audioFilePath = data.filename;

                // Get absolute path through main process
                const absoluteAudioPath = await window.electronAPI.getAbsolutePath(audioFilePath);
                console.log('Absolute audio path:', absoluteAudioPath);
                currentAudio = new Audio(absoluteAudioPath);

                // Get control elements
                const playPauseBtn = document.getElementById('playPauseBtn');
                const stopBtn = document.getElementById('stopBtn');
                const volumeSlider = document.getElementById('volumeSlider');
                const progressBar = document.querySelector('.progress');
                const progressContainer = document.querySelector('.progress-bar');

                // Set up audio event listeners
                currentAudio.addEventListener('loadedmetadata', () => {
                    if (isNaN(currentAudio.duration) || !isFinite(currentAudio.duration)) {
                        durationSpan.textContent = '--:--';
                    } else {
                        durationSpan.textContent = formatTime(currentAudio.duration);
                    }
                });

                currentAudio.addEventListener('timeupdate', () => {
                    currentTimeSpan.textContent = formatTime(currentAudio.currentTime);
                    if (!isNaN(currentAudio.duration) && isFinite(currentAudio.duration)) {
                        const progress = (currentAudio.currentTime / currentAudio.duration) * 100;
                        progressBar.style.width = `${progress}%`;
                    }
                });

                // Play/Pause button
                playPauseBtn.onclick = () => {
                    if (currentAudio.paused) {
                        currentAudio.play();
                        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                    } else {
                        currentAudio.pause();
                        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                    }
                };

                // Stop button
                stopBtn.onclick = () => {
                    currentAudio.pause();
                    currentAudio.currentTime = 0;
                    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                    progressBar.style.width = '0%';
                    currentTimeSpan.textContent = '0:00';
                };

                // Volume control
                volumeSlider.oninput = (e) => {
                    if (currentAudio) {
                        currentAudio.volume = e.target.value / 100;
                    }
                };

                // Progress bar click handling
                progressContainer.addEventListener('click', (e) => {
                    if (currentAudio && !isNaN(currentAudio.duration)) {
                        const rect = progressContainer.getBoundingClientRect();
                        const pos = (e.clientX - rect.left) / rect.width;
                        currentAudio.currentTime = pos * currentAudio.duration;
                        progressBar.style.width = `${pos * 100}%`;
                    }
                });

                // Start playing the audio
                await currentAudio.play();
                playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';

                // Reset generate button
                generateButton.disabled = false;
                generateButton.innerHTML = '<i class="fas fa-play"></i> Generate';

            } catch (error) {
                console.error('Error generating/playing audio:', error);
                // // Reset generate button on error
                // generateButton.disabled = false;
                // generateButton.innerHTML = '<i class="fas fa-play"></i> Generate';
                
                // Show error message to user
                alert(`Error generating audio. Please try again. ${error}`);
            }
        }
    });

    // Initial system info update if starting on system info page
    if (document.querySelector('.system-info').classList.contains('active')) {
        updateSystemInfo();
        updatePerformanceStats();
    }

    // Add this to handle model selection
    document.querySelectorAll('.model-list-item').forEach(item => {
        item.addEventListener('click', function () {
            // Remove selected class from all items
            document.querySelectorAll('.model-list-item').forEach(i => {
                i.classList.remove('selected');
            });

            // Add selected class to clicked item
            this.classList.add('selected');

            // Show model details section
            document.querySelector('.model-details-section').style.display = 'block';
        });
    });

    // Make sure sidebar icons are visible
    document.querySelectorAll('.sidebar-icon').forEach(icon => {
        icon.style.display = 'flex';
        icon.style.alignItems = 'center';
        icon.style.justifyContent = 'center';
        
        // Ensure the dropdown is properly positioned
        const dropdown = icon.querySelector('.voice-dropdown');
        if (dropdown) {
            dropdown.style.position = 'absolute';
            dropdown.style.left = '100%';
            dropdown.style.top = '0';
            dropdown.style.zIndex = '1000';
            dropdown.style.backgroundColor = '#fff';
            dropdown.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        }
    });
});

// Handle slider value updates
document.querySelectorAll('.effect-slider input[type="range"]').forEach(slider => {
    const valueDisplay = slider.parentElement.querySelector('.slider-value');

    slider.addEventListener('input', function () {
        valueDisplay.textContent = this.value;
    });
});

// Update the file upload handling
const uploadButton = document.querySelector('.voice-changer .action-button:nth-child(2)');
if (uploadButton) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    // Handle upload button click
    uploadButton.addEventListener('click', () => {
        fileInput.click();
    });

    // Handle file selection
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            // Create container for file info and controls
            const fileContainer = document.createElement('div');
            fileContainer.className = 'selected-file';

            // Add file name
            const fileName = document.createElement('span');
            fileName.textContent = file.name;

            // Create audio player
            const audioPlayer = document.createElement('audio');
            audioPlayer.controls = true;
            audioPlayer.src = URL.createObjectURL(file);

            // Add to container
            fileContainer.appendChild(fileName);
            fileContainer.appendChild(audioPlayer);

            // Insert after the buttons but before the controls
            const controlsSection = document.querySelector('.controls-section');
            controlsSection.insertBefore(fileContainer, controlsSection.firstChild);
        }
    });
}

// Add voice recording functionality
const recordButton = document.querySelector('.voice-changer .action-button:first-child');
let mediaRecorder;
let audioChunks = [];
let isRecording = false;

if (recordButton) {
    recordButton.addEventListener('click', async () => {
        try {
            if (!isRecording) {
                // Start recording
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];

                mediaRecorder.ondataavailable = (event) => {
                    audioChunks.push(event.data);
                };

                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    const audioUrl = URL.createObjectURL(audioBlob);

                    // Create container for recorded audio
                    const fileContainer = document.createElement('div');
                    fileContainer.className = 'selected-file';

                    // Add recording name
                    const fileName = document.createElement('span');
                    fileName.textContent = 'Recorded Audio';

                    // Create audio player
                    const audioPlayer = document.createElement('audio');
                    audioPlayer.controls = true;
                    audioPlayer.src = audioUrl;

                    // Add to container
                    fileContainer.appendChild(fileName);
                    fileContainer.appendChild(audioPlayer);

                    // Insert into page
                    const controlsSection = document.querySelector('.controls-section');
                    let existingContainer = document.querySelector('.selected-file');
                    if (existingContainer) {
                        existingContainer.replaceWith(fileContainer);
                    } else {
                        controlsSection.insertBefore(fileContainer, controlsSection.firstChild);
                    }
                };

                mediaRecorder.start();
                isRecording = true;
                recordButton.style.background = '#ef4444';  // Red background while recording
                recordButton.querySelector('span').textContent = '⏺';
                recordButton.querySelector('span').nextSibling.textContent = ' Stop Recording';
            } else {
                // Stop recording
                mediaRecorder.stop();
                mediaRecorder.stream.getTracks().forEach(track => track.stop());
                isRecording = false;
                recordButton.style.background = '';  // Reset background
                recordButton.querySelector('span').textContent = '🎤';
                recordButton.querySelector('span').nextSibling.textContent = ' Record Voice';
            }
        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Unable to access microphone. Please ensure you have granted permission.');
        }
    });
}

// Add voice cloning functionality
const cloningRecordButton = document.querySelector('.voice-cloning .action-button:first-child');
const cloningUploadButton = document.querySelector('.voice-cloning .action-button:nth-child(2)');

// Handle file upload for voice cloning
if (cloningUploadButton) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    cloningUploadButton.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const fileContainer = document.createElement('div');
            fileContainer.className = 'selected-file';

            const fileName = document.createElement('span');
            fileName.textContent = file.name;

            const audioPlayer = document.createElement('audio');
            audioPlayer.controls = true;
            audioPlayer.src = URL.createObjectURL(file);

            fileContainer.appendChild(fileName);
            fileContainer.appendChild(audioPlayer);

            // Insert after buttons
            const inputContainer = document.querySelector('.voice-cloning .input-container');
            let existingContainer = inputContainer.querySelector('.selected-file');
            if (existingContainer) {
                existingContainer.replaceWith(fileContainer);
            } else {
                inputContainer.insertBefore(fileContainer, inputContainer.querySelector('.selector-row'));
            }
        }
    });
}

// Handle voice recording for voice cloning
if (cloningRecordButton) {
    let mediaRecorder;
    let audioChunks = [];
    let isRecording = false;

    cloningRecordButton.addEventListener('click', async () => {
        try {
            if (!isRecording) {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];

                mediaRecorder.ondataavailable = (event) => {
                    audioChunks.push(event.data);
                };

                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    const audioUrl = URL.createObjectURL(audioBlob);

                    const fileContainer = document.createElement('div');
                    fileContainer.className = 'selected-file';

                    const fileName = document.createElement('span');
                    fileName.textContent = 'Voice Sample Recording';

                    const audioPlayer = document.createElement('audio');
                    audioPlayer.controls = true;
                    audioPlayer.src = audioUrl;

                    fileContainer.appendChild(fileName);
                    fileContainer.appendChild(audioPlayer);

                    const inputContainer = document.querySelector('.voice-cloning .input-container');
                    let existingContainer = inputContainer.querySelector('.selected-file');
                    if (existingContainer) {
                        existingContainer.replaceWith(fileContainer);
                    } else {
                        inputContainer.insertBefore(fileContainer, inputContainer.querySelector('.selector-row'));
                    }
                };

                mediaRecorder.start();
                isRecording = true;
                cloningRecordButton.style.background = '#ef4444';
                cloningRecordButton.querySelector('span').textContent = '⏺';
                cloningRecordButton.querySelector('span').nextSibling.textContent = ' Stop Recording';
            } else {
                mediaRecorder.stop();
                mediaRecorder.stream.getTracks().forEach(track => track.stop());
                isRecording = false;
                cloningRecordButton.style.background = '';
                cloningRecordButton.querySelector('span').textContent = '🎤';
                cloningRecordButton.querySelector('span').nextSibling.textContent = ' Record Voice';
            }
        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Unable to access microphone. Please ensure you have granted permission.');
        }
    });
}

// Add character counter for cloning text input
const cloningTextarea = document.getElementById('cloning-input');
const cloningCharCount = document.querySelector('.voice-cloning .character-count');

if (cloningTextarea && cloningCharCount) {
    cloningTextarea.addEventListener('input', function () {
        const length = this.value.length;
        cloningCharCount.textContent = `${length}/500`;

        if (length > 500) {
            this.value = this.value.substring(0, 500);
        }
    });
}

// Add this to your existing code
const modelSearchInput = document.getElementById('modelSearchInput');
const searchResults = document.querySelector('.search-results');

if (modelSearchInput) {
    // Show search results when typing
    modelSearchInput.addEventListener('input', function () {
        if (this.value.length > 0) {
            searchResults.style.display = 'block';
        } else {
            searchResults.style.display = 'none';
        }
    });

    // Handle clicking outside to close search results
    document.addEventListener('click', function (e) {
        if (!modelSearchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });

    // Handle search result selection
    document.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', function () {
            const modelTitle = this.querySelector('.result-title').textContent;
            modelSearchInput.value = modelTitle;
            searchResults.style.display = 'none';

            // Show model details section
            document.querySelector('.model-list').style.display = 'block';
        });
    });
}

// Add this to handle model selection
document.querySelectorAll('.model-list-item').forEach(item => {
    item.addEventListener('click', function () {
        // Remove selected class from all items
        document.querySelectorAll('.model-list-item').forEach(i => {
            i.classList.remove('selected');
        });

        // Add selected class to clicked item
        this.classList.add('selected');

        // Show model details section
        document.querySelector('.model-details-section').style.display = 'block';
    });
});

// Initial system info update if starting on system info page
if (document.querySelector('.system-info').classList.contains('active')) {
    updateSystemInfo();
    updatePerformanceStats();
}

// Helper function to format time
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Define these functions outside of DOMContentLoaded
async function updateSystemInfo() {
    try {
        const sysInfo = await window.electronAPI.getSystemInfo();
        console.log('Received system info:', sysInfo);  // Add this line for debugging

        // Log the entire system info object
        console.log('System Information:', {
            CPU: {
                Architecture: sysInfo.cpu.architecture,
                Model: sysInfo.cpu.model,
                Cores: sysInfo.cpu.cores,
                PhysicalCores: sysInfo.cpu.physicalCores,
                Speed: sysInfo.cpu.speed,
                Instructions: sysInfo.cpu.instructions
            },
            Memory: {
                Total: `${(sysInfo.memory.total / (1024 * 1024 * 1024)).toFixed(2)} GB`,
                Free: `${(sysInfo.memory.free / (1024 * 1024 * 1024)).toFixed(2)} GB`,
                Used: `${(sysInfo.memory.used / (1024 * 1024 * 1024)).toFixed(2)} GB`
            },
            GPU: sysInfo.gpu.map(g => ({
                Model: g.model,
                VRAM: `${(g.vram / 1024).toFixed(2)} GB`,
                Vendor: g.vendor
            }))
        });

        // Update CPU Architecture
        const archElement = document.querySelector('.info-card:nth-child(1) .info-row:first-child .chip-badge');
        if (archElement) {
            archElement.textContent = sysInfo.cpu.architecture;
        }

        // Update Instruction Set Extensions
        const instructionSet = document.querySelector('.info-card:nth-child(1) .chip-group');
        if (instructionSet) {
            instructionSet.innerHTML = '';
            if (sysInfo.cpu.instructions.hasAVX) {
                instructionSet.innerHTML += '<span class="chip-badge">AVX</span>';
            }
            if (sysInfo.cpu.instructions.hasAVX2) {
                instructionSet.innerHTML += '<span class="chip-badge">AVX2</span>';
            }
        }

        // Update GPU info
        if (sysInfo.gpu.length > 0) {
            const gpu = sysInfo.gpu[0];  // Using first GPU
            const gpuModelElement = document.querySelector('.info-card:nth-child(2) .gpu-model');
            const gpuCountElement = document.querySelector('.info-card:nth-child(2) .gpu-count');
            const vramElement = document.querySelector('.info-card:nth-child(2) .info-row:last-child .info-value');

            if (gpuModelElement) gpuModelElement.textContent = gpu.model;
            if (gpuCountElement) gpuCountElement.textContent = `${sysInfo.gpu.length} GPU detected`;
            if (vramElement) vramElement.textContent = `${(gpu.vram / 1024).toFixed(2)} GB`;
        }

        // Update Memory info
        const ramElement = document.querySelector('.info-card:nth-child(3) .info-row:first-child .info-value');
        const vramTotalElement = document.querySelector('.info-card:nth-child(3) .info-row:last-child .info-value');

        if (ramElement) {
            const totalRAM = (sysInfo.memory.total / (1024 * 1024 * 1024)).toFixed(2);
            ramElement.textContent = `${totalRAM} GB`;
        }

        if (vramTotalElement && sysInfo.gpu.length > 0) {
            vramTotalElement.textContent = `${(sysInfo.gpu[0].vram / 1024).toFixed(2)} GB`;
        }

    } catch (error) {
        console.error('Error updating system info:', error);
    }
}

async function updatePerformanceStats() {
    try {
        const stats = await window.electronAPI.getPerformanceStats();
        console.log('Received performance stats:', stats);  // Add this line for debugging

        // Log the performance stats
        console.log('Performance Stats:', {
            CPU_Usage: `${stats.cpu}%`,
            Memory: {
                Used: `${(stats.memory.used / (1024 * 1024 * 1024)).toFixed(2)} GB`,
                Total: `${(stats.memory.total / (1024 * 1024 * 1024)).toFixed(2)} GB`
            },
            GPU: stats.gpu.map(g => ({
                Usage: `${g.usage}%`,
                MemoryUsed: `${(g.memoryUsed / 1024).toFixed(2)} GB`,
                MemoryTotal: `${(g.memoryTotal / 1024).toFixed(2)} GB`
            }))
        });
        // Update RAM + VRAM usage
        const ramVramElement = document.querySelector('.monitor-card:first-child .monitor-value');
        if (ramVramElement) {
            const ramUsage = (stats.memory.used / (1024 * 1024 * 1024)).toFixed(2);
            ramVramElement.textContent = `${ramUsage} GB`;
        }

        // Update CPU usage
        const cpuElement = document.querySelector('.monitor-card:last-child .monitor-value');
        if (cpuElement) {
            cpuElement.textContent = `${stats.cpu}%`;
        }

    } catch (error) {
        console.error('Error updating performance stats:', error);
    }
}

// Add these at the top of renderer.js with other global variables
let downloadedModels = new Map();
let downloadingSockets = new Map(); // Track active download sockets

// Function to fetch already downloaded models
async function fetchDownloadedModels() {
    const CONFIG = getConfig();
    try {
        console.log('Fetching downloaded models...');
        const response = await fetch(`${CONFIG.LOCAL_ENDPOINT}/models/download`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Downloaded models:', data);
        
        // Convert array of objects to Map
        downloadedModels = new Map(
            data.map(model => [model.model_id, model.download_status])
        );
        
        // Log the Map to verify conversion
        console.log('Downloaded models Map:', downloadedModels);
    } catch (error) {
        console.error('Error fetching downloaded models:', error);
        downloadedModels = new Map();
    }
}

// Update handleModelDownload to maintain the Map structure
function handleModelDownload(modelId, downloadBtn) {
    const CONFIG = getConfig();
    console.log('Attempting to download model:', modelId);
    
    // If already downloading, return
    if (downloadingSockets.has(modelId)) {
        console.log('Download already in progress');
        return;
    }

    const socket = new WebSocket(CONFIG.DOWNLOAD_ENDPOINT);
    
    socket.onopen = () => {
        // Set initial downloading status
        downloadedModels.set(modelId, CONFIG.DOWNLOAD_STATUS.DOWNLOADING);
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        downloadBtn.disabled = true;
        
        const message = JSON.stringify({ model_id: modelId });
        socket.send(message);
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch (data.status) {
            case CONFIG.DOWNLOAD_STATUS.DOWNLOADING:
                if (data.model_id === modelId) {
                    downloadedModels.set(modelId, CONFIG.DOWNLOAD_STATUS.DOWNLOADING);
                    downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                    downloadBtn.disabled = true;
                }
                break;
            
            case CONFIG.DOWNLOAD_STATUS.READY:
                if (data.model_id === modelId) {
                    downloadedModels.set(modelId, CONFIG.DOWNLOAD_STATUS.READY);
                    downloadBtn.innerHTML = '<i class="fas fa-check"></i>';
                    downloadBtn.classList.remove('download-btn');
                    downloadBtn.classList.add('downloaded-btn');
                    downloadBtn.disabled = true;
                    downloadingSockets.delete(modelId);
                    socket.close();
                }
                break;
        }
    };

    socket.onerror = (error) => {
        console.error('WebSocket Error:', error);
        downloadedModels.delete(modelId); // Remove failed download from Map
        downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
        downloadBtn.disabled = false;
        downloadingSockets.delete(modelId);
    };

    socket.onclose = () => {
        downloadingSockets.delete(modelId);
    };

    downloadingSockets.set(modelId, socket);
}

// Update the populateModelDetails function to include download status
function populateModelDetails(model) {
    const CONFIG = getConfig();
    const modelDetailsSection = document.querySelector('.model-details-section');
    if (!modelDetailsSection) return;

    console.log('Populating model details for:', model.model_id);
    console.log('Downloaded models Map:', Array.from(downloadedModels.entries()));
    console.log('Current model status:', downloadedModels.get(model.model_id));

    // Update staff pick banner and title (existing code)
    const staffPickBanner = modelDetailsSection.querySelector('.staff-pick-banner p');
    if (staffPickBanner) {
        staffPickBanner.textContent = model.description || 'No description available.';
    }

    const modelTitleElement = modelDetailsSection.querySelector('.staff-pick-banner h3');
    if (modelTitleElement) {
        modelTitleElement.textContent = model.model_id;
    }

    // Create and populate download section
    let downloadSection = modelDetailsSection.querySelector('.download-section');
    if (!downloadSection) {
        downloadSection = document.createElement('div');
        downloadSection.className = 'download-section';
        modelDetailsSection.appendChild(downloadSection);
    }

    // Get the current download status for this model
    const downloadStatus = downloadedModels.get(model.model_id);
    console.log(`Model ${model.model_id} status:`, downloadStatus);

    // Determine button classes and state based on download status
    const isDownloading = downloadStatus === CONFIG.DOWNLOAD_STATUS.DOWNLOADING;
    const isDownloaded = downloadStatus === CONFIG.DOWNLOAD_STATUS.READY;
    const buttonClass = isDownloaded ? 'downloaded-btn' : 'download-btn';
    const buttonDisabled = isDownloaded || isDownloading;
    const buttonIcon = isDownloaded ? 'fa-check' : (isDownloading ? 'fa-spinner fa-spin' : 'fa-download');

    // Debug logging
    console.log('Button state:', {
        modelId: model.model_id,
        downloadStatus,
        isDownloaded,
        isDownloading,
        buttonClass,
        buttonDisabled,
        buttonIcon
    });

    // Update the download button section
    downloadSection.innerHTML = `
        <div class="download-header">
            <span>4 download options available</span>
            <span class="info-icon"><i class="fas fa-info-circle"></i></span>
        </div>
        <div class="download-item">
            <div class="file-info">
                <span class="file-name">Q4_K_M</span>
                <span class="model-name">Qwen2.5 7B Instruct 1M</span>
            </div>
            <div class="file-actions">
                <button class="copy-btn"><i class="fas fa-clipboard"></i></button>
                <button class="like-btn"><i class="fas fa-thumbs-up"></i></button>
                <button class="${buttonClass} action-btn" ${buttonDisabled ? 'disabled' : ''}>
                    <i class="fas ${buttonIcon}"></i>
                    <span>${isDownloaded ? 'Downloaded' : 'Download'}</span>
                </button>
                <span class="file-size">4.68 GB</span>
                <button class="expand-btn"><i class="fas fa-chevron-down"></i></button>
            </div>
        </div>
    `;

    // Debug: Check if button was created
    console.log('Created button:', downloadSection.querySelector('.download-btn, .downloaded-btn'));

    // Add meta row (existing code)
    const metaRow = modelDetailsSection.querySelector('.meta-row');
    if (metaRow) {
        metaRow.innerHTML = '';
        metaRow.appendChild(createMetaItem('Author:', model.author));
        metaRow.appendChild(createMetaItem('Downloads:', model.downloads));
        metaRow.appendChild(createMetaItem('Likes:', model.likes));
        metaRow.appendChild(createMetaItem('Last Modified:', new Date(model.last_modified).toLocaleDateString()));
    }

    // Update the download button event listener
    const downloadBtn = downloadSection.querySelector('.download-btn, .downloaded-btn');
    if (downloadBtn) {
        downloadBtn.replaceWith(downloadBtn.cloneNode(true));
        const newDownloadBtn = downloadSection.querySelector('.download-btn, .downloaded-btn');
        
        // Only add click listener if model is not downloaded or downloading
        if (!isDownloaded && !isDownloading) {
            newDownloadBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                handleModelDownload(model.model_id, newDownloadBtn);
            });
        }
    }

    // Show model details section
    document.querySelector('.model-list').style.display = 'block';
    modelDetailsSection.style.display = 'block';
}

function createMetaItem(label, value) {
    const metaItem = document.createElement('div');
    metaItem.classList.add('meta-item');

    const metaLabel = document.createElement('span');
    metaLabel.classList.add('meta-label');
    metaLabel.textContent = label;

    const metaValue = document.createElement('span');
    metaValue.textContent = value || 'N/A';

    metaItem.appendChild(metaLabel);
    metaItem.appendChild(metaValue);
    return metaItem;
}

// Update the fetchAndDisplayModels function to include initial download status check
async function fetchAndDisplayModels() {
    const CONFIG = getConfig();
    const modelListContainer = document.querySelector('.model-list');
    if (!modelListContainer) return;

    modelListContainer.innerHTML = '<div class="loading-message">Loading models...</div>';

    try {
        // Fetch downloaded models first
        await fetchDownloadedModels();
        
        // Then fetch and display models using the correct endpoint
        const response = await fetch(`${CONFIG.BACKEND_ENDPOINT}/models`, {method: 'POST'});
        if (!response.ok) {
            console.error(`HTTP error fetching models: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            console.error('Response body:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        modelListContainer.innerHTML = '';

        if (data.models && data.models.length > 0) {
            data.models.forEach(model => {
                const modelItem = createModelListItem(model);
                modelListContainer.appendChild(modelItem);
            });
        } else {
            modelListContainer.innerHTML = '<div class="no-models-message">No models found.</div>';
        }
    } catch (error) {
        console.error('Error fetching models:', error);
        modelListContainer.innerHTML = '<div class="error-message">Failed to load models. Please check console.</div>';
    }
}

// Function to create a model list item element
function createModelListItem(model) {
    const item = document.createElement('div');
    item.classList.add('model-list-item');

    const header = document.createElement('div');
    header.classList.add('model-list-header');

    const icon = document.createElement('div');
    icon.classList.add('model-icon');
    icon.textContent = '🤖'; // Default icon

    const title = document.createElement('div');
    title.classList.add('model-title');
    title.textContent = model.model_id;

    const tag = document.createElement('div');
    tag.classList.add('model-tag');
    tag.textContent = model.tags.length > 0 ? model.tags[0] : 'N/A'; // Using first tag as example

    header.appendChild(icon);
    header.appendChild(title);
    header.appendChild(tag);

    const description = document.createElement('p');
    description.classList.add('model-description');
    description.textContent = model.description || 'No description available.'; // Use description or default message

    item.appendChild(header);
    item.appendChild(description);

    // Add event listener to handle model selection (you can expand this later)
    item.addEventListener('click', () => {
        // Remove selected class from all items
        document.querySelectorAll('.model-list-item').forEach(i => {
            i.classList.remove('selected');
        });
        // Add selected class to clicked item
        item.classList.add('selected');
        // Show model details section (you'll need to implement populateModelDetails function)
        populateModelDetails(model);
    });

    return item;
}

// Update the createModelsDropdown function to add click listener
async function createModelsDropdown() {
    const CONFIG = getConfig();
    const dropdown = document.createElement('div');
    dropdown.className = 'models-dropdown';
    
    const select = document.createElement('select');
    select.id = 'models-select';
    select.className = 'models-select';
    
    // Add default option with improved styling
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Choose a voice model';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    select.appendChild(defaultOption);

    // Fetch and populate models immediately
    await updateDropdownOptions(select);
    
    dropdown.appendChild(select);
    return dropdown;
}

// New function to update dropdown options
async function updateDropdownOptions(select) {
    const CONFIG = getConfig();
    try {
        // Clear existing options except the default one
        while (select.options.length > 1) {
            select.remove(1);
        }

        // Show loading state
        const loadingOption = document.createElement('option');
        loadingOption.disabled = true;
        loadingOption.textContent = 'Loading models...';
        select.appendChild(loadingOption);

        // Fetch latest models
        await fetchDownloadedModels();
        
        // Remove loading option
        select.remove(select.options.length - 1);

        // Filter and add downloaded models that are ready
        const readyModels = Array.from(downloadedModels.entries())
            .filter(([_, status]) => status === CONFIG.DOWNLOAD_STATUS.READY);
        
        if (readyModels.length === 0) {
            const noModelsOption = document.createElement('option');
            noModelsOption.disabled = true;
            noModelsOption.textContent = 'No models available';
            select.appendChild(noModelsOption);
        } else {
            readyModels.forEach(([modelId, _]) => {
                const option = document.createElement('option');
                option.value = modelId;
                option.textContent = modelId;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error updating model options:', error);
        const errorOption = document.createElement('option');
        errorOption.disabled = true;
        errorOption.textContent = 'Error loading models';
        select.appendChild(errorOption);
    }
}

async function fetchAndDisplayMyModels() {
    const CONFIG = getConfig();
    const modelListContainer = document.querySelector('.my-models .models-list');
    if (!modelListContainer) return;

    modelListContainer.innerHTML = '<div class="loading-message">Loading your models...</div>';

    try {
        // 1. First fetch downloaded models
        const downloadResponse = await fetch(`${CONFIG.LOCAL_ENDPOINT}/models/download`);
        if (!downloadResponse.ok) throw new Error(`HTTP error! status: ${downloadResponse.status}`);
        const downloadData = await downloadResponse.json();
        
        // Filter for READY models and extract their IDs
        const readyModelIds = downloadData
            .filter(model => model.download_status === CONFIG.DOWNLOAD_STATUS.READY)
            .map(model => model.model_id);

        if (readyModelIds.length === 0) {
            modelListContainer.innerHTML = '<div class="no-models-message">No downloaded models found.</div>';
            return;
        }

        // 2. Fetch loaded/running models
        const loadResponse = await fetch(`${CONFIG.LOCAL_ENDPOINT}/models/load`);
        if (!loadResponse.ok) throw new Error(`HTTP error! status: ${loadResponse.status}`);
        const loadedModels = await loadResponse.json();
        const loadedModelIds = new Set(loadedModels);

        // 3. Fetch detailed model information
        const modelResponse = await fetch(`${CONFIG.BACKEND_ENDPOINT}/models/batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ids: readyModelIds  // Note: key is 'ids' not 'model_ids'
            })
        });
        if (!modelResponse.ok) throw new Error(`HTTP error! status: ${modelResponse.status}`);
        const modelData = await modelResponse.json();

        // Clear container
        modelListContainer.innerHTML = '';

        // Create model items
        modelData.models.forEach(model => {
            const isRunning = loadedModelIds.has(model.model_id);
            const modelItem = createMyModelItem(model, isRunning);
            modelListContainer.appendChild(modelItem);
        });

    } catch (error) {
        console.error('Error fetching my models:', error);
        modelListContainer.innerHTML = '<div class="error-message">Failed to load models. Please try again.</div>';
    }
}

function createMyModelItem(model, isRunning) {
    const modelItem = document.createElement('div');
    modelItem.className = 'model-item';
    
    const status = isRunning ? 'running' : 'downloaded';
    const statusText = isRunning ? 'Running' : 'Downloaded';
    const actionButton = isRunning ? 
        `<button class="action-btn stop-btn">
            <i class="fas fa-stop"></i>
            <span>Stop</span>
        </button>` :
        `<button class="action-btn start-btn">
            <i class="fas fa-play"></i>
            <span>Start</span>
        </button>`;

    modelItem.innerHTML = `
        <div class="model-info">
            <div class="model-icon">
                <i class="fas fa-brain"></i>
            </div>
            <div class="model-details">
                <h3>${model.model_id}</h3>
                <span class="model-status ${status}">${statusText}</span>
                <span class="model-meta">${isRunning ? 'Port: 3000 • Memory: 7GB' : `Size: ${model.size || 'N/A'} • Modified: ${new Date(model.last_modified).toLocaleDateString()}`}</span>
            </div>
        </div>
        <div class="model-actions">
            ${actionButton}
            <button class="action-btn delete-btn">
                <i class="fas fa-trash"></i>
                <span>Delete</span>
            </button>
        </div>
    `;

    // Add event listeners for buttons
    const startStopBtn = modelItem.querySelector('.start-btn, .stop-btn');
    if (startStopBtn) {
        startStopBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const CONFIG = getConfig();
            const endpoint = isRunning ? 
                `${CONFIG.LOCAL_ENDPOINT}/models/unload` : 
                `${CONFIG.LOCAL_ENDPOINT}/models/load`;

            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ model_id: model.model_id })
                });

                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                
                // Refresh the display after action
                fetchAndDisplayMyModels();
            } catch (error) {
                console.error('Error updating model status:', error);
                alert('Failed to update model status. Please try again.');
            }
        });
    }

    const deleteBtn = modelItem.querySelector('.delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (confirm(`Are you sure you want to delete ${model.model_id}?`)) {
                const CONFIG = getConfig();
                try {
                    const response = await fetch(`${CONFIG.LOCAL_ENDPOINT}/models/delete`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ model_id: model.model_id })
                    });

                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    
                    // Refresh the display after deletion
                    fetchAndDisplayMyModels();
                } catch (error) {
                    console.error('Error deleting model:', error);
                    alert('Failed to delete model. Please try again.');
                }
            }
        });
    }

    return modelItem;
}
