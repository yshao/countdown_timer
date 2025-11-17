/**
 * Countdown Timer - Core Logic
 * This file contains all the timer functionality
 */

class CountdownTimer {
    constructor() {
        this.totalSeconds = 0;
        this.remainingSeconds = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.intervalId = null;
        this.lastAnnouncement = null;

        // Callbacks (initialized but can be set by user)
        this.onTick = undefined;
        this.onComplete = undefined;
        this.onAnnouncement = undefined;
    }

    /**
     * Initialize timer with hours, minutes, and seconds
     */
    setTime(hours, minutes, seconds) {
        if (this.isRunning) {
            throw new Error('Cannot set time while timer is running');
        }

        const h = parseInt(hours) || 0;
        const m = parseInt(minutes) || 0;
        const s = parseInt(seconds) || 0;

        this.totalSeconds = (h * 3600) + (m * 60) + s;
        this.remainingSeconds = this.totalSeconds;
        this.lastAnnouncement = null;

        return this.totalSeconds;
    }

    /**
     * Format seconds to HH:MM:SS
     */
    formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        return {
            hours: String(h).padStart(2, '0'),
            minutes: String(m).padStart(2, '0'),
            seconds: String(s).padStart(2, '0'),
            display: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        };
    }

    /**
     * Start the countdown
     */
    start() {
        if (this.isRunning) {
            return false;
        }

        if (this.remainingSeconds <= 0) {
            throw new Error('Cannot start timer with 0 seconds');
        }

        this.isRunning = true;
        this.isPaused = false;

        this.intervalId = setInterval(() => {
            this.tick();
        }, 1000);

        return true;
    }

    /**
     * Pause the countdown
     */
    pause() {
        if (!this.isRunning || this.isPaused) {
            return false;
        }

        this.isPaused = true;
        this.isRunning = false;

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        return true;
    }

    /**
     * Resume the countdown
     */
    resume() {
        if (this.isRunning || !this.isPaused) {
            return false;
        }

        this.isPaused = false;
        this.isRunning = true;

        this.intervalId = setInterval(() => {
            this.tick();
        }, 1000);

        return true;
    }

    /**
     * Reset the timer
     */
    reset() {
        this.isRunning = false;
        this.isPaused = false;

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        this.remainingSeconds = this.totalSeconds;
        this.lastAnnouncement = null;

        return true;
    }

    /**
     * Stop and clear the timer
     */
    stop() {
        this.isRunning = false;
        this.isPaused = false;

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        this.remainingSeconds = 0;
        this.totalSeconds = 0;
        this.lastAnnouncement = null;

        return true;
    }

    /**
     * Tick function - called every second
     */
    tick() {
        if (!this.isRunning) {
            return;
        }

        this.remainingSeconds--;

        // Call tick callback
        if (this.onTick) {
            this.onTick(this.remainingSeconds, this.formatTime(this.remainingSeconds));
        }

        // Check for announcements
        this.checkAnnouncements();

        // Check if timer is complete
        if (this.remainingSeconds <= 0) {
            this.complete();
        }
    }

    /**
     * Check if we need to make voice announcements
     */
    checkAnnouncements() {
        // Priority 1: 10 second countdown (10 to 1)
        if (this.remainingSeconds <= 10 && this.remainingSeconds >= 1) {
            const announcement = `${this.remainingSeconds}`;
            if (this.lastAnnouncement !== announcement) {
                this.announce(announcement);
                this.lastAnnouncement = announcement;
            }
            return;
        }

        // Priority 2: 30 seconds
        if (this.remainingSeconds === 30) {
            const announcement = '30 seconds remaining';
            if (this.lastAnnouncement !== announcement) {
                this.announce(announcement);
                this.lastAnnouncement = announcement;
            }
            return;
        }

        // Priority 3: Every minute
        if (this.remainingSeconds % 60 === 0 && this.remainingSeconds > 0) {
            const minutes = this.remainingSeconds / 60;
            const announcement = `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} remaining`;
            if (this.lastAnnouncement !== announcement) {
                this.announce(announcement);
                this.lastAnnouncement = announcement;
            }
        }
    }

    /**
     * Make an announcement
     */
    announce(message) {
        if (this.onAnnouncement) {
            this.onAnnouncement(message);
        }
    }

    /**
     * Complete the timer
     */
    complete() {
        this.isRunning = false;

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        this.remainingSeconds = 0;

        // Final announcement
        this.announce("Time's up!");

        if (this.onComplete) {
            this.onComplete();
        }
    }

    /**
     * Get current state
     */
    getState() {
        return {
            totalSeconds: this.totalSeconds,
            remainingSeconds: this.remainingSeconds,
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            formatted: this.formatTime(this.remainingSeconds)
        };
    }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CountdownTimer;
}
