const AUDIO_ASSETS_AVAILABLE = true; // Set to true when assets are available

export class AudioManager {
    constructor() {
        this.ambientAudio = null;
        this.effectAudio = null;
        this.masterVolume = 0.5;
        this.ambientVolume = 0.3;
        this.effectVolume = 0.7;
        this.isEnabled = AUDIO_ASSETS_AVAILABLE;
        this.currentAmbientTrack = null;
        this.fadeInterval = null;
    }

    async init() {
        try {
            // Get audio elements
            this.ambientAudio = document.getElementById('ambient-audio');
            this.effectAudio = document.getElementById('effect-audio');
            
            if (!this.ambientAudio || !this.effectAudio) {
                console.warn('Audio elements not found, creating fallback elements');
                this.createFallbackAudioElements();
            }
            
            // Set initial volumes
            this.updateVolumes();
            
            // Load user preferences
            this.loadAudioSettings();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('Audio manager initialized');
        } catch (error) {
            console.error('Failed to initialize audio manager:', error);
            this.isEnabled = false;
        }
    }

    createFallbackAudioElements() {
        this.ambientAudio = document.createElement('audio');
        this.ambientAudio.id = 'ambient-audio';
        this.ambientAudio.loop = true;
        this.ambientAudio.preload = 'auto';
        document.body.appendChild(this.ambientAudio);

        this.effectAudio = document.createElement('audio');
        this.effectAudio.id = 'effect-audio';
        this.effectAudio.preload = 'auto';
        document.body.appendChild(this.effectAudio);
    }

    setupEventListeners() {
        if (!this.isEnabled) return;

        // Handle audio loading errors
        this.ambientAudio.addEventListener('error', (e) => {
            console.warn('Ambient audio failed to load:', e);
        });

        this.effectAudio.addEventListener('error', (e) => {
            console.warn('Effect audio failed to load:', e);
        });

        // Handle audio ending
        this.effectAudio.addEventListener('ended', () => {
            this.effectAudio.currentTime = 0;
        });

        // Handle browser audio policy restrictions
        document.addEventListener('click', this.handleFirstUserInteraction.bind(this), { once: true });
        document.addEventListener('keydown', this.handleFirstUserInteraction.bind(this), { once: true });
    }

    async handleFirstUserInteraction() {
        try {
            // Try to play a silent audio to unlock audio context
            if (this.ambientAudio) {
                await this.ambientAudio.play();
                this.ambientAudio.pause();
            }
        } catch (error) {
            console.log('Audio unlock attempt failed:', error);
        }
    }

    // Ambient audio methods
    async playAmbientSound(src) {
        if (!this.isEnabled || !src || !this.ambientAudio) return;

        try {
            // If same track is already playing, don't restart
            if (this.currentAmbientTrack === src && !this.ambientAudio.paused) {
                return;
            }

            // Fade out current track if playing
            if (!this.ambientAudio.paused) {
                await this.fadeOut(this.ambientAudio);
            }

            // Load and play new track
            this.ambientAudio.src = src;
            this.currentAmbientTrack = src;
            this.ambientAudio.volume = 0;
            
            await this.ambientAudio.play();
            await this.fadeIn(this.ambientAudio, this.ambientVolume * this.masterVolume);
            
        } catch (error) {
            console.warn('Failed to play ambient sound:', error);
        }
    }

    stopAmbientSound() {
        if (!this.isEnabled || !this.ambientAudio) return;

        this.fadeOut(this.ambientAudio).then(() => {
            this.ambientAudio.pause();
            this.currentAmbientTrack = null;
        });
    }

    // Effect audio methods
    async playEffectSound(src, volume = this.effectVolume) {
        if (!this.isEnabled || !src || !this.effectAudio) return;

        try {
            this.effectAudio.src = src;
            this.effectAudio.volume = volume * this.masterVolume;
            await this.effectAudio.play();
        } catch (error) {
            console.warn('Failed to play effect sound:', error);
        }
    }

    // Volume control
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        this.updateVolumes();
        this.saveAudioSettings();
    }

    setAmbientVolume(volume) {
        this.ambientVolume = Math.max(0, Math.min(1, volume));
        this.updateVolumes();
        this.saveAudioSettings();
    }

    setEffectVolume(volume) {
        this.effectVolume = Math.max(0, Math.min(1, volume));
        this.saveAudioSettings();
    }

    updateVolumes() {
        if (!this.isEnabled) return;

        if (this.ambientAudio) {
            this.ambientAudio.volume = this.ambientVolume * this.masterVolume;
        }
        
        if (this.effectAudio) {
            this.effectAudio.volume = this.effectVolume * this.masterVolume;
        }
    }

    // Fade effects
    async fadeIn(audioElement, targetVolume, duration = 1000) {
        if (!audioElement) return;

        return new Promise((resolve) => {
            const startVolume = 0;
            const volumeStep = (targetVolume - startVolume) / (duration / 50);
            let currentVolume = startVolume;

            audioElement.volume = currentVolume;

            const interval = setInterval(() => {
                currentVolume += volumeStep;
                
                if (currentVolume >= targetVolume) {
                    audioElement.volume = targetVolume;
                    clearInterval(interval);
                    resolve();
                } else {
                    audioElement.volume = currentVolume;
                }
            }, 50);

            this.fadeInterval = interval;
        });
    }

    async fadeOut(audioElement, duration = 1000) {
        if (!audioElement) return;

        return new Promise((resolve) => {
            const startVolume = audioElement.volume;
            const volumeStep = startVolume / (duration / 50);
            let currentVolume = startVolume;

            const interval = setInterval(() => {
                currentVolume -= volumeStep;
                
                if (currentVolume <= 0) {
                    audioElement.volume = 0;
                    clearInterval(interval);
                    resolve();
                } else {
                    audioElement.volume = currentVolume;
                }
            }, 50);

            this.fadeInterval = interval;
        });
    }

    // Crossfade between ambient tracks
    async crossfadeAmbient(newSrc, duration = 2000) {
        if (!this.isEnabled || !newSrc) return;

        // Create a temporary audio element for the new track
        const newAudio = document.createElement('audio');
        newAudio.src = newSrc;
        newAudio.loop = true;
        newAudio.volume = 0;

        try {
            await newAudio.play();
            
            // Fade in new track and fade out old track simultaneously
            const fadeOutPromise = this.fadeOut(this.ambientAudio, duration);
            const fadeInPromise = this.fadeIn(newAudio, this.ambientVolume * this.masterVolume, duration);
            
            await Promise.all([fadeOutPromise, fadeInPromise]);
            
            // Replace the old audio element
            this.ambientAudio.pause();
            this.ambientAudio.src = newSrc;
            this.ambientAudio.volume = this.ambientVolume * this.masterVolume;
            this.ambientAudio.currentTime = newAudio.currentTime;
            await this.ambientAudio.play();
            
            // Clean up temporary element
            newAudio.pause();
            newAudio.remove();
            
            this.currentAmbientTrack = newSrc;
            
        } catch (error) {
            console.warn('Crossfade failed:', error);
            newAudio.remove();
            // Fallback to regular ambient sound change
            this.playAmbientSound(newSrc);
        }
    }

    // Playback control
    pauseAll() {
        if (this.ambientAudio && !this.ambientAudio.paused) {
            this.ambientAudio.pause();
        }
        if (this.effectAudio && !this.effectAudio.paused) {
            this.effectAudio.pause();
        }
    }

    resumeAll() {
        if (this.ambientAudio && this.ambientAudio.paused && this.currentAmbientTrack) {
            this.ambientAudio.play().catch(console.warn);
        }
    }

    stopAll() {
        this.stopAmbientSound();
        if (this.effectAudio) {
            this.effectAudio.pause();
            this.effectAudio.currentTime = 0;
        }
        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
        }
    }

    // Audio settings persistence
    saveAudioSettings() {
        const settings = {
            masterVolume: this.masterVolume,
            ambientVolume: this.ambientVolume,
            effectVolume: this.effectVolume,
            isEnabled: this.isEnabled
        };
        
        try {
            localStorage.setItem('troubles_simulator_audio_settings', JSON.stringify(settings));
        } catch (error) {
            console.warn('Failed to save audio settings:', error);
        }
    }

    loadAudioSettings() {
        try {
            const saved = localStorage.getItem('troubles_simulator_audio_settings');
            if (saved) {
                const settings = JSON.parse(saved);
                this.masterVolume = settings.masterVolume ?? this.masterVolume;
                this.ambientVolume = settings.ambientVolume ?? this.ambientVolume;
                this.effectVolume = settings.effectVolume ?? this.effectVolume;
                this.isEnabled = AUDIO_ASSETS_AVAILABLE && (settings.isEnabled ?? this.isEnabled);

                this.updateVolumes();

                // Update UI controls if they exist
                this.updateUIControls();
            }
        } catch (error) {
            console.warn('Failed to load audio settings:', error);
        }
    }

    updateUIControls() {
        const masterVolumeControl = document.getElementById('master-volume');
        const ambientVolumeControl = document.getElementById('ambient-volume');
        
        if (masterVolumeControl) {
            masterVolumeControl.value = this.masterVolume * 100;
        }
        
        if (ambientVolumeControl) {
            ambientVolumeControl.value = this.ambientVolume * 100;
        }
    }

    // Utility methods
    preloadAudio(src) {
        if (!this.isEnabled) return Promise.resolve();

        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.addEventListener('canplaythrough', resolve);
            audio.addEventListener('error', reject);
            audio.src = src;
        });
    }

    getCurrentAmbientTrack() {
        return this.currentAmbientTrack;
    }

    isPlaying() {
        return {
            ambient: this.ambientAudio && !this.ambientAudio.paused,
            effect: this.effectAudio && !this.effectAudio.paused
        };
    }

    // Audio context for more advanced features (if needed)
    async getAudioContext() {
        if (!this.audioContext) {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.audioContext = new AudioContext();
            } catch (error) {
                console.warn('Web Audio API not supported:', error);
                return null;
            }
        }
        
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
        
        return this.audioContext;
    }

    // Cleanup
    destroy() {
        this.stopAll();
        
        if (this.ambientAudio) {
            this.ambientAudio.remove();
        }
        
        if (this.effectAudio) {
            this.effectAudio.remove();
        }
        
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}