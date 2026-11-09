import { Part1 } from './parts/part1.js';
import { Part2 } from './parts/part2.js';
import { Part3 } from './parts/part3.js';
import { Part4 } from './parts/part4.js';
import { Part5 } from './parts/part5.js';
import { Part6 } from './parts/part6.js';

const PART_COMPONENTS = {
  1: Part1,
  2: Part2,
  3: Part3,
  4: Part4,
  5: Part5,
  6: Part6
};

export const UI = {
  showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + name).classList.add('active');
  },

  renderHome() {
    this.showScreen('home');
  },

  bindNavigation(app) {
    document.getElementById('btn-start-test').addEventListener('click', () => app.startExam());
    document.getElementById('btn-prev').addEventListener('click', () => app.prevPart());
    document.getElementById('btn-next').addEventListener('click', () => app.nextPart());
    document.getElementById('btn-retry').addEventListener('click', () => app.retryExam());
    document.getElementById('btn-review').addEventListener('click', () => app.showReview());
    document.getElementById('btn-home').addEventListener('click', () => app.retryExam());
  },

  bindFinish(app) {
    document.getElementById('btn-finish-test').addEventListener('click', () => {
      if (confirm('Voulez-vous vraiment terminer et corriger votre examen ?')) {
        app.finishExam();
      }
    });
  },

  bindHome(app) {
    // rien de plus pour l'instant
  },

  updateTimer(timer) {
    if (!timer) return;
    const el = document.getElementById('timer-display');
    const warn = document.getElementById('timer-warn');
    el.textContent = timer.format();
    if (timer.remaining <= 300) {
      warn.classList.remove('hidden');
      el.classList.add('warn');
    } else {
      warn.classList.add('hidden');
      el.classList.remove('warn');
    }
  },

  updateProgress(app) {
    const totalAnswered = Object.values(app.session.answers).filter(v => v !== null && v !== '').length;
    let totalQuestions = 0;
    for (const p of app.session.parts) {
      totalQuestions += (p.id === 2 ? p.people.length : p.questions.length);
    }
    document.getElementById('progress-text').textContent = `Partie ${app.currentPart} sur 6`;
    const fill = document.getElementById('progress-fill');
    fill.style.width = ((app.currentPart - 1) / 6 * 100) + '%';
    // onglets
    const tabs = document.querySelectorAll('.part-tab');
    tabs.forEach((tab, i) => {
      const p = app.session.parts[i];
      const n = (p.id === 2 ? p.people.length : p.questions.length);
      const answered = Object.values(app.session.answers).filter((v, idx) => {
        // approximatif par onglet : on compte les réponses pour les ids de cette partie
        return false;
      }).length;
      tab.classList.toggle('active', i + 1 === app.currentPart);
    });
  },

  renderPartNav(app) {
    const nav = document.getElementById('part-nav');
    nav.innerHTML = '';
    const labels = ['Part 1 — Multiple Choice', 'Part 2 — Matching', 'Part 3 — Reading', 'Part 4 — Sentence Insertion', 'Part 5 — Multiple Choice Cloze', 'Part 6 — Open Cloze'];
    for (let i = 0; i < 6; i++) {
      const p = app.session.parts[i];
      const n = (p.id === 2 ? p.people.length : p.questions.length);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `part-tab ${i + 1 === app.currentPart ? 'active' : ''}`;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', i + 1 === app.currentPart);
      btn.innerHTML = `<span>${labels[i]}</span><span class="tab-count">${p.id === 2 ? '' : '—'}</span>`;
      // indicateur de progression sur l'onglet
      const answeredCount = Object.keys(p.id === 2 ? p.people.map(ppl => ppl.id) : p.questions.map(q => q.id === undefined ? q.blank_id : q.id)).filter(id => {
        const v = sessionAnswers(app.session, id);
        return v !== null && v !== '';
      }).length;
      btn.title = `${answeredCount} / ${n} répondu(es)`;
      btn.addEventListener('click', () => app.goToPart(i + 1));
      nav.appendChild(btn);
    }
  },

  renderPart(part, container, answers, onChange) {
    const Component = PART_COMPONENTS[part.id];
    if (!Component) {
      container.innerHTML = '<p>Composant non disponible pour cette partie.</p>';
      return;
    }
    container.innerHTML = '';
    Component.render(container, part, answers, onChange);
  },

  updateNavButtons(app) {
    const prev = document.getElementById('btn-prev');
    const next = document.getElementById('btn-next');
    prev.classList.toggle('hidden', app.currentPart <= 1);
    next.classList.toggle('hidden', app.currentPart >= 6);
  },

  renderScore(result, session) {
    this.showScreen('score');
    document.getElementById('score-big').textContent = `${result.total} / ${result.maxTotal}`;
    document.getElementById('score-pct').textContent = `${result.pct} %`;
    const duration = Math.floor((Date.now() - session.startedAt) / 1000);
    const m = Math.floor(duration / 60);
    const s = duration % 60;
    document.getElementById('score-time').textContent = `Temps utilisé : ${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    const detail = document.getElementById('score-detail');
    detail.innerHTML = '';
    for (const p of result.parts) {
      const section = document.createElement('div');
      section.className = 'score-part';
      section.innerHTML = `
        <h3>${p.title}</h3>
        <div class="score-part-row"><span>Score :</span><strong>${p.score} / ${p.max}</strong></div>
        <div class="score-part-row"><span>Correctes :</span><span class="ok">${p.correct}</span></div>
        <div class="score-part-row"><span>Incorrectes :</span><span class="bad">${p.incorrect}</span></div>
        <div class="score-part-row"><span>Non répondues :</span><span class="none">${p.unanswered}</span></div>
      `;
      detail.appendChild(section);
    }
  },

  renderReview(result, session) {
    const detail = document.getElementById('score-detail');
    detail.innerHTML = '';
    for (const p of result.parts) {
      const section = document.createElement('div');
      section.className = 'review-part';
      let html = `<h3>${p.title}</h3>`;
      for (const d of p.detail) {
        const statusClass = d.isCorrect ? 'ok' : (d.userAns === null || d.userAns === '' ? 'none' : 'bad');
        html += `
          <div class="review-item">
            <div class="review-q">${escapeHtml(d.prompt)}</div>
            <div class="review-status ${statusClass}">${d.isCorrect ? '✓ Correct' : (d.userAns === null || d.userAns === '' ? '○ Non répondu' : '✗ Incorrect')}</div>
            <div class="review-answer"><strong>Votre réponse :</strong> ${d.userText !== null && d.userText !== undefined ? escapeHtml(d.userText) : '—'}</div>
            <div class="review-correct"><strong>Bonne réponse :</strong> ${escapeHtml(d.correctText)}</div>
          </div>
        `;
      }
      section.innerHTML = html;
      detail.appendChild(section);
    }
  }
};

function sessionAnswers(session, id) {
  return session.answers[id];
}

function escapeHtml(text) {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}
