/**
 * Main Application Logic
 * Connects the UI with the CountdownTimer and Web Speech API
 */

class TimerApp {
    constructor() {
        this.timer = new CountdownTimer();
        this.speechSynth = window.speechSynthesis;
        this.voiceEnabled = true;

        // Audio context for alarm sound
        this.audioContext = null;

        // DOM Elements
        this.hoursInput = document.getElementById('hours');
        this.minutesInput = document.getElementById('minutes');
        this.secondsInput = document.getElementById('seconds');
        this.timerDisplay = document.getElementById('timer-display');
        this.startBtn = document.getElementById('start-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.voiceToggle = document.getElementById('voice-enabled');
        this.statusMessage = document.getElementById('status-message');
        this.progressBar = document.getElementById('progress-bar');

        this.setupEventListeners();
        this.setupTimerCallbacks();
        this.updateDisplay();
        this.checkSpeechSupport();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Voice toggle
        this.voiceToggle.addEventListener('change', (e) => {
            this.voiceEnabled = e.target.checked;
            this.showStatus(
                this.voiceEnabled ? 'Voice announcements enabled' : 'Voice announcements disabled',
                'info'
            );
        });

        // Input validation
        [this.hoursInput, this.minutesInput, this.secondsInput].forEach(input => {
            input.addEventListener('change', () => {
                this.validateInput(input);
            });
        });
    }

    /**
     * Setup timer callbacks
     */
    setupTimerCallbacks() {
        // On tick - update display
        this.timer.onTick = (remaining, formatted) => {
            this.updateDisplay();
            this.updateProgress();
        };

        // On complete - timer finished
        this.timer.onComplete = () => {
            this.handleComplete();
        };

        // On announcement - speak if enabled
        this.timer.onAnnouncement = (message) => {
            if (this.voiceEnabled) {
                this.speak(message);
            }
        };
    }

    /**
     * Check if speech synthesis is supported
     */
    checkSpeechSupport() {
        if (!this.speechSynth) {
            this.showStatus('⚠️ Voice announcements not supported in this browser', 'error');
            this.voiceToggle.disabled = true;
            this.voiceToggle.checked = false;
            this.voiceEnabled = false;
        }
    }

    /**
     * Validate input fields
     */
    validateInput(input) {
        const min = parseInt(input.min);
        const max = parseInt(input.max);
        let value = parseInt(input.value) || 0;

        if (value < min) value = min;
        if (value > max) value = max;

        input.value = value;
    }

    /**
     * Set preset time
     */
    setPreset(hours, minutes, seconds) {
        if (this.timer.isRunning) {
            this.showStatus('Stop the timer before changing time', 'error');
            return;
        }

        this.hoursInput.value = hours;
        this.minutesInput.value = minutes;
        this.secondsInput.value = seconds;

        this.timer.setTime(hours, minutes, seconds);
        this.updateDisplay();
        this.updateProgress();
    }

    /**
     * Handle start button click
     */
    handleStart() {
        try {
            // If paused, resume instead
            if (this.timer.isPaused) {
                this.timer.resume();
                this.updateButtonStates();
                this.showStatus('Timer resumed', 'success');
                return;
            }

            // Set time from inputs
            const hours = parseInt(this.hoursInput.value) || 0;
            const minutes = parseInt(this.minutesInput.value) || 0;
            const seconds = parseInt(this.secondsInput.value) || 0;

            this.timer.setTime(hours, minutes, seconds);

            // Start timer
            this.timer.start();
            this.updateButtonStates();
            this.disableInputs();
            this.showStatus('Timer started!', 'success');
            this.updateProgress();
        } catch (error) {
            this.showStatus(error.message, 'error');
        }
    }

    /**
     * Handle pause button click
     */
    handlePause() {
        if (this.timer.isPaused) {
            this.timer.resume();
            this.pauseBtn.innerHTML = '<span>⏸</span> Pause';
            this.showStatus('Timer resumed', 'success');
        } else {
            this.timer.pause();
            this.pauseBtn.innerHTML = '<span>▶</span> Resume';
            this.showStatus('Timer paused', 'info');
        }
        this.updateButtonStates();
    }

    /**
     * Handle reset button click
     */
    handleReset() {
        this.timer.reset();
        this.updateDisplay();
        this.updateButtonStates();
        this.enableInputs();
        this.pauseBtn.innerHTML = '<span>⏸</span> Pause';
        this.showStatus('Timer reset', 'info');
        this.updateProgress();

        // Clear any speaking
        if (this.speechSynth) {
            this.speechSynth.cancel();
        }
    }

    /**
     * Handle timer completion
     */
    handleComplete() {
        this.updateDisplay();
        this.updateButtonStates();
        this.enableInputs();
        this.showStatus('⏰ Time\'s up!', 'success');
        this.updateProgress();

        // Flash the display
        this.timerDisplay.classList.add('danger');

        // Play gentle alarm sound for 2 seconds
        this.playAlarm();
    }

    /**
     * Update timer display
     */
    updateDisplay() {
        const state = this.timer.getState();
        this.timerDisplay.textContent = state.formatted.display;

        // Update display colors based on time remaining
        this.timerDisplay.classList.remove('warning', 'danger');
        this.progressBar.classList.remove('warning', 'danger');

        if (state.remainingSeconds <= 10 && state.remainingSeconds > 0) {
            this.timerDisplay.classList.add('danger');
            this.progressBar.classList.add('danger');
        } else if (state.remainingSeconds <= 30 && state.remainingSeconds > 0) {
            this.timerDisplay.classList.add('warning');
            this.progressBar.classList.add('warning');
        }
    }

    /**
     * Update progress bar
     */
    updateProgress() {
        const state = this.timer.getState();
        if (state.totalSeconds === 0) {
            this.progressBar.style.width = '100%';
            return;
        }

        const percentage = (state.remainingSeconds / state.totalSeconds) * 100;
        this.progressBar.style.width = `${percentage}%`;
    }

    /**
     * Update button states
     */
    updateButtonStates() {
        const isRunning = this.timer.isRunning;
        const isPaused = this.timer.isPaused;

        this.startBtn.disabled = isRunning;
        this.pauseBtn.disabled = !isRunning && !isPaused;

        // Update preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.disabled = isRunning || isPaused;
        });
    }

    /**
     * Disable input fields
     */
    disableInputs() {
        this.hoursInput.disabled = true;
        this.minutesInput.disabled = true;
        this.secondsInput.disabled = true;
    }

    /**
     * Enable input fields
     */
    enableInputs() {
        this.hoursInput.disabled = false;
        this.minutesInput.disabled = false;
        this.secondsInput.disabled = false;
    }

    /**
     * Show status message
     */
    showStatus(message, type = 'info') {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message ${type}`;

        // Auto-hide after 3 seconds
        setTimeout(() => {
            this.statusMessage.textContent = '';
            this.statusMessage.className = 'status-message';
        }, 3000);
    }

    /**
     * Speak text using Web Speech API
     */
    speak(text) {
        if (!this.speechSynth || !this.voiceEnabled) {
            return;
        }

        // Cancel any ongoing speech
        this.speechSynth.cancel();

        // Create utterance
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Speak
        this.speechSynth.speak(utterance);
    }

    /**
     * Play a gentle alarm sound for 2 seconds using Web Audio API
     */
    playAlarm() {
        try {
            // Create audio context if it doesn't exist
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            const ctx = this.audioContext;
            const now = ctx.currentTime;

            // Create oscillator for the tone
            const oscillator = ctx.createOscillator();
            oscillator.type = 'sine'; // Gentle sine wave
            oscillator.frequency.setValueAtTime(880, now); // A5 note - pleasant frequency

            // Create gain node for volume control
            const gainNode = ctx.createGain();
            gainNode.gain.setValueAtTime(0, now); // Start silent
            gainNode.gain.linearRampToValueAtTime(0.15, now + 0.1); // Fade in to gentle volume
            gainNode.gain.setValueAtTime(0.15, now + 1.7); // Hold for most of duration
            gainNode.gain.linearRampToValueAtTime(0, now + 2.0); // Fade out at the end

            // Connect nodes
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            // Play for 2 seconds
            oscillator.start(now);
            oscillator.stop(now + 2.0);
        } catch (error) {
            // Silently fail if Web Audio API is not supported
            console.warn('Could not play alarm sound:', error);
        }
    }
}

// Initialize app when DOM is ready
let app;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new TimerApp();
    });
} else {
    app = new TimerApp();
}
