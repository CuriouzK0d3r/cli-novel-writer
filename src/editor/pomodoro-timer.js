/**
 * Pomodoro Timer for Writers CLI Editor
 * Provides focused writing sessions with work/break intervals
 */

class PomodoroTimer {
  constructor() {
    // Timer configuration (in minutes, converted to milliseconds)
    this.config = {
      workDuration: 25 * 60 * 1000,     // 25 minutes
      shortBreak: 5 * 60 * 1000,        // 5 minutes
      longBreak: 15 * 60 * 1000,        // 15 minutes
      longBreakInterval: 4,              // Long break every 4 Pomodoros
    };

    // Timer state
    this.isRunning = false;
    this.isPaused = false;
    this.currentPhase = 'work';          // 'work', 'shortBreak', 'longBreak'
    this.timeRemaining = this.config.workDuration;
    this.completedPomodoros = 0;
    this.startTime = null;
    this.pausedTime = 0;

    // Timer interval
    this.timerInterval = null;
    this.updateInterval = 1000;          // Update every second

    // Callbacks
    this.onTick = null;                  // Called every second with time remaining
    this.onPhaseComplete = null;         // Called when work/break phase completes
    this.onPomodoroComplete = null;      // Called when a full Pomodoro completes
  }

  /**
   * Start the timer
   */
  start() {
    if (this.isRunning && !this.isPaused) {
      return; // Already running
    }

    this.isRunning = true;
    this.isPaused = false;
    this.startTime = Date.now() - this.pausedTime;

    this.timerInterval = setInterval(() => {
      this.tick();
    }, this.updateInterval);

    this.tick(); // Immediate update
  }

  /**
   * Pause the timer
   */
  pause() {
    if (!this.isRunning || this.isPaused) {
      return;
    }

    this.isPaused = true;
    this.pausedTime = Date.now() - this.startTime;

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Resume the timer
   */
  resume() {
    if (!this.isRunning || !this.isPaused) {
      return;
    }

    this.start(); // start() handles resuming correctly
  }

  /**
   * Stop and reset the timer
   */
  stop() {
    this.isRunning = false;
    this.isPaused = false;
    this.pausedTime = 0;
    this.startTime = null;

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.reset();
  }

  /**
   * Reset timer to beginning of current phase
   */
  reset() {
    this.timeRemaining = this.getCurrentPhaseDuration();
    this.pausedTime = 0;
    this.startTime = null;

    if (this.onTick) {
      this.onTick(this.timeRemaining, this.currentPhase);
    }
  }

  /**
   * Skip to next phase
   */
  skipPhase() {
    this.completeCurrentPhase();
  }

  /**
   * Reset all progress (completed Pomodoros, etc.)
   */
  resetAll() {
    this.stop();
    this.completedPomodoros = 0;
    this.currentPhase = 'work';
    this.reset();
  }

  /**
   * Timer tick - called every second
   */
  tick() {
    if (!this.isRunning || this.isPaused) {
      return;
    }

    const elapsed = Date.now() - this.startTime;
    const duration = this.getCurrentPhaseDuration();
    this.timeRemaining = Math.max(0, duration - elapsed);

    // Call tick callback
    if (this.onTick) {
      this.onTick(this.timeRemaining, this.currentPhase);
    }

    // Check if phase is complete
    if (this.timeRemaining <= 0) {
      this.completeCurrentPhase();
    }
  }

  /**
   * Handle phase completion
   */
  completeCurrentPhase() {
    const wasWorkPhase = this.currentPhase === 'work';

    if (wasWorkPhase) {
      this.completedPomodoros++;

      // Determine next break type
      if (this.completedPomodoros % this.config.longBreakInterval === 0) {
        this.currentPhase = 'longBreak';
      } else {
        this.currentPhase = 'shortBreak';
      }

      // Call Pomodoro complete callback
      if (this.onPomodoroComplete) {
        this.onPomodoroComplete(this.completedPomodoros);
      }
    } else {
      // Break is over, back to work
      this.currentPhase = 'work';
    }

    // Call phase complete callback
    if (this.onPhaseComplete) {
      this.onPhaseComplete(wasWorkPhase ? 'work' : 'break', this.currentPhase);
    }

    // Reset timer for new phase
    this.timeRemaining = this.getCurrentPhaseDuration();
    this.pausedTime = 0;
    this.startTime = Date.now();
  }

  /**
   * Get duration for current phase
   */
  getCurrentPhaseDuration() {
    switch (this.currentPhase) {
      case 'work':
        return this.config.workDuration;
      case 'shortBreak':
        return this.config.shortBreak;
      case 'longBreak':
        return this.config.longBreak;
      default:
        return this.config.workDuration;
    }
  }

  /**
   * Format time in MM:SS format
   */
  formatTime(milliseconds) {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get current timer status for display
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      phase: this.currentPhase,
      timeRemaining: this.timeRemaining,
      timeFormatted: this.formatTime(this.timeRemaining),
      completedPomodoros: this.completedPomodoros,
      phaseProgress: 1 - (this.timeRemaining / this.getCurrentPhaseDuration()),
    };
  }

  /**
   * Get phase display name
   */
  getPhaseDisplayName(phase = this.currentPhase) {
    switch (phase) {
      case 'work':
        return 'Focus';
      case 'shortBreak':
        return 'Short Break';
      case 'longBreak':
        return 'Long Break';
      default:
        return 'Focus';
    }
  }

  /**
   * Update timer configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };

    // If not running, update current time remaining
    if (!this.isRunning) {
      this.timeRemaining = this.getCurrentPhaseDuration();
    }
  }

  /**
   * Get configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Set callback functions
   */
  setCallbacks({ onTick, onPhaseComplete, onPomodoroComplete }) {
    if (onTick) this.onTick = onTick;
    if (onPhaseComplete) this.onPhaseComplete = onPhaseComplete;
    if (onPomodoroComplete) this.onPomodoroComplete = onPomodoroComplete;
  }
}

module.exports = PomodoroTimer;
