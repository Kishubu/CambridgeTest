import { ExamData } from './exam.js';
import { Timer } from './timer.js';
import { scoreSession } from './scoring.js';
import { UI } from './ui.js';

export const app = {
  session: null,
  timer: null,
  currentPart: 1,
  screen: 'home',
  reviewData: null,

  async init() {
    UI.bindNavigation(this);
    UI.bindFinish(this);
    UI.bindHome(this);
    UI.renderHome();
  },

  async startExam() {
    const data = await ExamData.load();
    this.session = ExamData.buildSession(data);
    this.currentPart = 1;
    this.screen = 'test';
    this.timer = new Timer(45 * 60, (remaining) => {
      UI.updateTimer(this.timer);
      if (remaining <= 0) {
        this.finishExam();
      }
    });
    this.timer.start();
    UI.showScreen('test');
    this.renderCurrentPart();
  },

  renderCurrentPart() {
    if (!this.session) return;
    UI.updateProgress(this);
    UI.updateTimer(this.timer);
    UI.renderPartNav(this);
    const part = this.session.parts[this.currentPart - 1];
    const container = document.getElementById('test-content');
    const partAnswers = {};
    for (const k of Object.keys(this.session.answers)) {
      if (k.startsWith(`p${part.id}_`)) {
        partAnswers[k.replace(`p${part.id}_`, '')] = this.session.answers[k];
      }
    }
    UI.renderPart(part, container, partAnswers, (newPartAnswers) => {
      const newGlobal = { ...this.session.answers };
      for (const k of Object.keys(newPartAnswers)) {
        newGlobal[ExamData.key(part.id, k)] = newPartAnswers[k];
      }
      // nettoyer les clés de cette partie qui ne sont plus dans newPartAnswers
      for (const k of Object.keys(newGlobal)) {
        if (k.startsWith(`p${part.id}_`) && !(k.replace(`p${part.id}_`, '') in newPartAnswers)) {
          delete newGlobal[k];
        }
      }
      this.session.answers = newGlobal;
    });
    UI.updateNavButtons(this);
  },

  goToPart(n) {
    this.currentPart = Math.max(1, Math.min(6, n));
    this.renderCurrentPart();
  },

  nextPart() {
    this.goToPart(this.currentPart + 1);
  },

  prevPart() {
    this.goToPart(this.currentPart - 1);
  },

  async finishExam() {
    if (this.screen === 'score' || this.screen === 'review') return;
    if (this.timer) this.timer.stop();
    this.screen = 'score';
    const result = scoreSession(this.session);
    this.reviewData = result;
    UI.showScreen('score');
    UI.renderScore(result, this.session);
  },

  retryExam() {
    this.screen = 'home';
    this.session = null;
    this.timer = null;
    this.currentPart = 1;
    this.reviewData = null;
    UI.showScreen('home');
    UI.renderHome();
  },

  showReview() {
    this.screen = 'review';
    UI.showScreen('score');
    UI.renderReview(this.reviewData, this.session);
  }
};
