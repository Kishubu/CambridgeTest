export class Timer {
  constructor(durationSeconds, onTick) {
    this.duration = durationSeconds;
    this.remaining = durationSeconds;
    this.onTick = onTick;
    this.interval = null;
    this.running = false;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.interval = setInterval(() => {
      this.remaining--;
      if (this.onTick) this.onTick(this.remaining);
      if (this.remaining <= 0) {
        this.stop();
        if (this.onTick) this.onTick(0);
      }
    }, 1000);
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
    this.running = false;
  }

  format() {
    const m = Math.floor(this.remaining / 60);
    const s = this.remaining % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}
