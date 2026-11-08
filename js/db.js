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
      // Résoudre l'URL de façon robuste par rapport à la page courante (marche avec ou sans slash final,
      // en local et sur GitHub Pages sous /CambridgeTest/).
      const url = new URL('db/questions.json', document.baseURI);
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) {
        throw new Error(
          `Impossible de charger la base de données (${url.pathname}) — HTTP ${res.status}. ` +
          `Vérifiez que le fichier db/questions.json est bien présent et que le site est servi via un serveur HTTP.`
        );
      }
      this.db = await res.json();
      this.ready = true;
      console.log('[DB] BDD chargée depuis', url.pathname, ':', this.db.totalQuestions, 'questions,', this.db.parts.length, 'parties');
      return this.db;
    } catch (err) {
      console.error('[DB]', err);
      alert(err.message);
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
