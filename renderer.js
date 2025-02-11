document.addEventListener('DOMContentLoaded', async () => {
    // Track current active dropdown
    let activeDropdown = null;

    // Handle sidebar icon clicks to show/hide dropdown
    document.querySelectorAll('.sidebar-icon').forEach(icon => {
        icon.addEventListener('click', function (e) {
            e.stopPropagation();
            const dropdown = this.querySelector('.voice-dropdown');

            // Close any other open dropdown
            if (activeDropdown && activeDropdown !== dropdown) {
                activeDropdown.style.display = 'none';
            }

            // Toggle current dropdown
            const isVisible = window.getComputedStyle(dropdown).display !== 'none';
            if (isVisible) {
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
        option.addEventListener('click', function (e) {
            e.stopPropagation();
            const optionText = this.textContent;

            // Hide all content first
            document.querySelectorAll('.voice-content').forEach(div => {
                div.classList.remove('active');
            });

            // Show appropriate content based on option clicked
            if (optionText.includes('Text to Speech')) {
                document.querySelector('.text-to-speech').classList.add('active');
            } else if (optionText.includes('Text to SFX')) {
                document.querySelector('.text-to-sfx').classList.add('active');
            } else if (optionText.includes('Voice Changer')) {
                document.querySelector('.voice-changer').classList.add('active');
            } else if (optionText.includes('Voice Cloning')) {
                document.querySelector('.voice-cloning').classList.add('active');
            }

            // Close the dropdown after selection
            if (activeDropdown) {
                activeDropdown.style.display = 'none';
                activeDropdown = null;
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
    document.querySelector('.text-to-speech').classList.add('active');

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

    // Add this to your existing DOMContentLoaded event listener
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

    // Add this to your existing code
    document.querySelectorAll('.voice-model-option').forEach(option => {
        option.addEventListener('click', function (e) {
            e.stopPropagation();
            const avatarImg = this.querySelector('.avatar-icon').cloneNode(true);
            const voiceName = this.querySelector('span').textContent;

            const selector = this.closest('.voice-select');
            selector.querySelector('.voice-avatar img').replaceWith(avatarImg);
            selector.querySelector('span').textContent = voiceName;
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
            } else if (this.textContent.includes('Intoduce a Podcast')) {
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
}); 
