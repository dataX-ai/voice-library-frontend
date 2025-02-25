import React, { useState, useEffect, useRef } from 'react';
import { FaBook, FaPodcast, FaVideo, FaPlay, FaPause, FaStop, FaVolumeUp, FaSpinner } from 'react-icons/fa';
import styles from './TextToSpeech.module.css';

const TextToSpeech = () => {
  const [text, setText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAudioControls, setShowAudioControls] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isGenerating, setIsGenerating] = useState(false);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const downloadedModels = await window.electronAPI.fetchDownloadedModels();
      const readyModels = downloadedModels.filter(
        model => model.download_status === window.electronAPI.DOWNLOAD_STATUS.READY
      );
      setModels(readyModels);
    } catch (error) {
      console.error('Error fetching models:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (type) => {
    let sampleText = '';
    switch (type) {
      case 'story':
        sampleText = "Once, a curious inventor named Leo built a machine to capture dreams. At night, it recorded the colors, sounds, and feelings people experienced in their sleep. The machine made an extraordinary discovery—dreams could be shared and felt by others. Leo's invention brought people closer, allowing them to experience each other's joy, fears, and desires. It showed that we're all connected by the unseen threads of our subconscious. The dream world became a place for true empathy";
        break;
      case 'podcast':
        sampleText = "Welcome to The Storyteller's Journey, where we dive deep into the art of crafting unforgettable narratives. Each episode, we explore the power of storytelling, from personal experiences to timeless tales that have shaped cultures. Join me as I chat with writers, filmmakers, and creators who have mastered the craft, offering insights that will help you unlock the storyteller within. Let's journey into the world of words and wonders together";
        break;
      case 'voiceover':
        sampleText = "Every day, millions of moments unfold in this city—some fleeting, others life-changing. What makes each one special? The stories behind them. Today, we take you on a journey through the streets, capturing the heartbeat of this urban jungle. From unexpected encounters to quiet reflections, let's uncover the stories that bring this place to life";
        break;
      default:
        break;
    }
    setText(sampleText);
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      alert('Please enter some text first');
      return;
    }

    if (!selectedModel) {
      alert('Please select a model first');
      return;
    }

    try {
      setIsGenerating(true);
      
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Show audio controls with loading state
      setShowAudioControls(true);
      setCurrentTime(0);
      setDuration(0);

      // Generate speech
      const result = await window.electronAPI.generateSpeech(text, selectedModel);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      // Get audio path with proper protocol
      const audioUrl = await window.electronAPI.getAbsoluteAudioPath(result.audioPath);
      
      // Create and set up new audio element
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // Set up audio event listeners
      audio.addEventListener('loadedmetadata', () => {
        if (!isNaN(audio.duration) && isFinite(audio.duration)) {
          setDuration(audio.duration);
        }
      });

      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
      });

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });

      // Start playing
      await audio.play();
      setIsPlaying(true);

    } catch (error) {
      console.error('Error generating/playing audio:', error);
      alert(`Error generating audio. Please try again. ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value;
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  const handleProgressBarClick = (e) => {
    if (audioRef.current && progressBarRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      audioRef.current.currentTime = pos * duration;
      setCurrentTime(pos * duration);
    }
  };

  return (
    <div className={styles.textToSpeech}>
      <div className={styles.voiceHeader}>
        <h1>Text to Speech</h1>
        <p>The TwelveLabs voice generator can deliver high-quality, human-like speech in 32 languages. Perfect for audiobooks, video voiceovers, commercials, and more.</p>
      </div>

      <div className={styles.voiceActions}>
        <button className={styles.actionButton} onClick={() => handleActionClick('story')}>
          <FaBook /> Tell a Story
        </button>
        <button className={styles.actionButton} onClick={() => handleActionClick('podcast')}>
          <FaPodcast /> Introduce a Podcast
        </button>
        <button className={styles.actionButton} onClick={() => handleActionClick('voiceover')}>
          <FaVideo /> Create a video voiceover
        </button>
      </div>

      <div className={styles.inputContainer}>
        <div className={styles.modelSelect}>
          <label className={styles.modelSelectLabel}>
            Select Model
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={isLoading}
            className={styles.modelSelectDropdown}
          >
            <option value="" disabled>Select a voice model to generate speech</option>
            {isLoading ? (
              <option value="" disabled>Loading models...</option>
            ) : models.length === 0 ? (
              <option value="" disabled>No voice models available</option>
            ) : (
              models.map(model => (
                <option key={model.model_id} value={model.model_id}>
                  {model.model_id}
                </option>
              ))
            )}
          </select>
        </div>

        <textarea
          className={styles.textInput}
          placeholder="Type something..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        
        {showAudioControls && (
          <div className={styles.audioControls}>
            <div className={styles.audioProgress}>
              <div 
                className={styles.progressBar}
                ref={progressBarRef}
                onClick={handleProgressBarClick}
              >
                <div 
                  className={styles.progress}
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
              <div className={styles.progressTime}>
                <span className={styles.currentTime}>{formatTime(currentTime)}</span>
                <span className={styles.duration}>{formatTime(duration)}</span>
              </div>
            </div>
            <div className={styles.controlButtons}>
              <button 
                className={styles.controlBtn}
                onClick={handlePlayPause}
              >
                {isPlaying ? <FaPause /> : <FaPlay />}
              </button>
              <button 
                className={styles.controlBtn}
                onClick={handleStop}
              >
                <FaStop />
              </button>
              <div className={styles.volumeControl}>
                <FaVolumeUp />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={handleVolumeChange}
                  className={styles.volumeSlider}
                />
              </div>
            </div>
          </div>
        )}

        <div className={styles.buttonContainer}>
          <button 
            className={styles.generateButton} 
            onClick={handleGenerate}
            disabled={isGenerating || !selectedModel || !text.trim()}
          >
            {isGenerating ? (
              <>
                <FaSpinner className={styles.spinner} /> Generating...
              </>
            ) : (
              <>
                <FaPlay /> Generate
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextToSpeech; 