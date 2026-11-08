/**
 * db.js — Mini base de données intégrée (front-only).
 * Charge db/questions.json générée une fois par scripts/parse-exam.js.
 */

class ExamDB {
  constructor() {
    this.db = null;
    this.ready = false;
  }

  async load() {
    try {
      const res = await fetch('db/questions.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(`Impossible de charger db/questions.json (${res.status})`);
      this.db = await res.json();
      this.ready = true;
      console.log('[DB] BDD chargée:', this.db.totalQuestions, 'questions,', this.db.parts.length, 'parties');
      return this.db;
    } catch (err) {
      console.error('[DB]', err);
      throw err;
    }
  }

  getPart(id) {
    return this.db.parts.find(p => p.id === id);
  }

  getParts() {
    return this.db.parts;
  }

  getTimerSeconds() {
    return this.db.timerSeconds || 45 * 60;
  }
}

const examDB = new ExamDB();
export default examDB;
