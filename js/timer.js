/**
 * timer.js — Minuteur de mise en condition (45 minutes).
 * Gère le décompte, l'alerte aux 5 dernières minutes, la fin automatique.
 */

class Timer {
  constructor(onTick, onTimeUp) {
    this.durationSeconds = 45 * 60;
    this.remaining = this.durationSeconds;
    this.onTick = onTick;
    this.onTimeUp = onTimeUp;
    this.intervalId = null;
    this.running = false;
    this.finished = false;
    this.warned = false;
    this.startTime = null;
    this.elapsedBeforePause = 0;
  }

  setDuration(seconds) {
    this.durationSeconds = seconds;
    this.remaining = seconds;
  }

  start() {
    if (this.running || this.finished) return;
    this.running = true;
    this.startTime = Date.now();
    this.intervalId = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - this.startTime) / 1000);
      this.remaining = this.durationSeconds - elapsed;
      if (this.remaining <= 0) {
        this.remaining = 0;
        this.stop();
        this.finished = true;
        if (this.onTimeUp) this.onTimeUp();
        return;
      }
      if (this.remaining <= 5 * 60 && !this.warned) {
        this.warned = true;
      }
      if (this.onTick) this.onTick(this.remaining);
    }, 1000);
    if (this.onTick) this.onTick(this.remaining);
  }

  stop() {
    this.running = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  pause() {
    this.stop();
    this.elapsedBeforePause = this.durationSeconds - this.remaining;
  }

  resume() {
    if (this.finished) return;
    this.startTime = Date.now();
    this.running = true;
    this.intervalId = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - this.startTime) / 1000);
      this.remaining = this.durationSeconds - this.elapsedBeforePause - elapsed;
      if (this.remaining <= 0) {
        this.remaining = 0;
        this.stop();
        this.finished = true;
        if (this.onTimeUp) this.onTimeUp();
        return;
      }
      if (this.remaining <= 5 * 60 && !this.warned) {
        this.warned = true;
      }
      if (this.onTick) this.onTick(this.remaining);
    }, 1000);
    if (this.onTick) this.onTick(this.remaining);
  }

  reset() {
    this.stop();
    this.remaining = this.durationSeconds;
    this.running = false;
    this.finished = false;
    this.warned = false;
    this.elapsedBeforePause = 0;
    this.startTime = null;
    if (this.onTick) this.onTick(this.remaining);
  }

  format(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  isRunning() { return this.running; }
  isFinished() { return this.finished; }
  getRemaining() { return this.remaining; }
}

export default Timer;
