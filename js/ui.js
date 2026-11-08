/**
 * ui.js — Rendu de l'interface (écrans, questions, navigation, score).
 */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const SCREEN_HOME = $('#screen-home');
const SCREEN_TEST = $('#screen-test');
const SCREEN_SCORE = $('#screen-score');

const TIMER_EL = $('#timer-display');
const TIMER_WARN = $('#timer-warn');
const PROGRESS_TEXT = $('#progress-text');
const PROGRESS_FILL = $('#progress-fill');
const PART_NAV = $('#part-nav');
const TEST_CONTENT = $('#test-content');
const BTN_PREV = $('#btn-prev');
const BTN_NEXT = $('#btn-next');
const BTN_FINISH = $('#btn-finish-test');

// État du test en cours
let state = {
  db: null,
  parts: [],
  currentPartIndex: 0,
  currentQIndex: 0,
  answers: {},
  timer: null,
  startTime: null,
  finished: false
};

function showScreen(screen) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/* ------------------------------------------------------------------ */
/*  Écran d'accueil : liste des 6 parties                             */
/* ------------------------------------------------------------------ */
function renderHome(parts) {
  const grid = $('#parts-grid');
  grid.innerHTML = '';
  parts.forEach(part => {
    const card = document.createElement('article');
    card.className = 'part-card';
    card.innerHTML = `
      <div class="part-head">
        <div class="part-title">${escapeHtml(part.title)}</div>
        <div class="part-count">${part.questionCount} questions</div>
      </div>
      <div class="part-instr">${escapeHtml(part.instruction)}</div>
    `;
    grid.appendChild(card);
  });
}

/* ------------------------------------------------------------------ */
/*  Navigation des parties (chips)                                    */
/* ------------------------------------------------------------------ */
function renderPartNav() {
  PART_NAV.innerHTML = '';
  state.parts.forEach((part, i) => {
    const chip = document.createElement('button');
    chip.className = 'part-chip';
    chip.type = 'button';
    chip.textContent = `P${part.id}`;
    if (i === state.currentPartIndex) chip.classList.add('current');
    PART_NAV.appendChild(chip);
  });
}

/* ------------------------------------------------------------------ */
/*  Rendu d'une question selon son type                               */
/* ------------------------------------------------------------------ */
function renderQuestion(part, qIndex) {
  const q = part.questions[qIndex];
  TEST_CONTENT.innerHTML = '';

  const article = document.createElement('article');
  article.className = 'question';
  article.dataset.qid = q.id;

  const meta = document.createElement('div');
  meta.className = 'q-meta';
  meta.innerHTML = `
    <span>Partie ${part.id} — ${part.title}</span>
    <span>Question ${qIndex + 1} / ${part.questionCount}</span>
  `;
  article.appendChild(meta);

  const stim = document.createElement('div');
  stim.className = 'q-stimulus';
  stim.textContent = q.stimulus || '';
  article.appendChild(stim);

  const optionsContainer = document.createElement('div');

  if (q.type === 'single-choice' || q.type === 'multiple-choice') {
    renderSingleChoice(article, q, optionsContainer);
  } else if (q.type === 'gap-fill') {
    renderGapFill(article, q, optionsContainer);
  } else if (q.type === 'open-cloze') {
    renderOpenCloze(article, q, optionsContainer);
  } else if (q.type === 'matching') {
    renderMatching(article, q, optionsContainer);
  }

  TEST_CONTENT.appendChild(article);

  const saved = state.answers[q.id];
  if (saved !== undefined) restoreAnswer(q, saved);
}

function renderSingleChoice(article, q, optionsContainer) {
  optionsContainer.className = 'options-list';
  q.options.forEach((opt, idx) => {
    const label = document.createElement('label');
    label.className = 'option';
    label.innerHTML = `
      <input type="radio" name="q-${q.id}" value="${idx}" />
      <span class="option-label">${escapeHtml(opt)}</span>
    `;
    const input = label.querySelector('input');
    input.addEventListener('change', () => {
      selectOption(q.id, idx);
      markSelected(label);
    });
    optionsContainer.appendChild(label);
  });
  article.appendChild(optionsContainer);
}

function renderGapFill(article, q, optionsContainer) {
  const wrap = document.createElement('div');
  wrap.className = 'gap-fill-wrap';

  const gaps = q.stimulus.match(/\(\d+\)/g) || [];
  gaps.forEach((gap, gapIdx) => {
    const row = document.createElement('div');
    row.className = 'gap-item';
    row.innerHTML = `<span class="gap-num">${gap}</span>`;
    const select = document.createElement('select');
    select.className = 'gap-select';
    select.innerHTML = '<option value="">—</option>' +
      q.options.map((opt, i) => `<option value="${i}">${escapeHtml(opt)}</option>`).join('');
    select.addEventListener('change', () => {
      const val = select.value;
      state.answers[q.id] = state.answers[q.id] || {};
      if (val === '') delete state.answers[q.id][gapIdx];
      else state.answers[q.id][gapIdx] = parseInt(val, 10);
    });
    row.appendChild(select);
    wrap.appendChild(row);
  });

  const stimText = document.createElement('div');
  stimText.className = 'q-stimulus';
  stimText.style.marginTop = '0.75rem';
  stimText.textContent = q.stimulus || '';
  wrap.appendChild(stimText);

  article.appendChild(wrap);
}

function renderOpenCloze(article, q, optionsContainer) {
  const wrap = document.createElement('div');
  wrap.className = 'open-cloze-wrap';
  const gaps = q.stimulus.match(/\(\d+\)/g) || [];
  gaps.forEach((gap, gapIdx) => {
    const row = document.createElement('div');
    row.className = 'open-item';
    row.innerHTML = `<span class="gap-num">${gap}</span>`;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'open-input';
    input.maxLength = 40;
    input.placeholder = '?';
    input.addEventListener('input', (e) => {
      state.answers[q.id] = state.answers[q.id] || {};
      state.answers[q.id][gapIdx] = e.target.value.toUpperCase();
    });
    row.appendChild(input);
    wrap.appendChild(row);
  });
  article.appendChild(wrap);
}

function renderMatching(article, q, optionsContainer) {
  const text = q.stimulus || '';
  const offersPart = text.split('Personnes')[0] || text;
  const peoplePart = text.split('Personnes')[1] || '';

  const offers = extractListItems(offersPart);
  const people = extractListItems(peoplePart);

  // État du matching : { [offreIndex]: personneIndex } ou null si délié
  const links = state.answers[q.id] && typeof state.answers[q.id] === 'object' && !Array.isArray(state.answers[q.id])
    ? { ...state.answers[q.id] }
    : {};

  const wrap = document.createElement('div');
  wrap.className = 'matching-wrap';

  const colOffers = document.createElement('div');
  colOffers.className = 'matching-col';
  colOffers.innerHTML = '<h4>Offres</h4>';

  const colPeople = document.createElement('div');
  colPeople.className = 'matching-col';
  colPeople.innerHTML = '<h4>Personnes</h4>';

  // États visuels pour savoir quelle offre est sélectionnée en cours de lien
  let selectedOfferIdx = null;

  function renderPeopleColumn() {
    colPeople.innerHTML = '<h4>Personnes</h4>';
    people.forEach((opt, pIdx) => {
      const item = document.createElement('div');
      item.className = 'match-item';
      // Trouver quelle offre est liée à cette personne
      const linkedOffer = Object.entries(links).find(([o, p]) => parseInt(p, 10) === pIdx);
      if (linkedOffer) item.classList.add('linked');

      const isSelected = pIdx === selectedOfferIdx && selectedOfferIdx !== null;
      if (isSelected) item.classList.add('active');

      const letterEl = document.createElement('span');
      letterEl.className = 'match-linked-letter';
      letterEl.textContent = linkedOffer ? String.fromCharCode(65 + parseInt(linkedOffer[0], 10)) : '';

      const numEl = document.createElement('span');
      numEl.className = 'match-person-num';
      numEl.textContent = (pIdx + 1).toString();

      const span = document.createElement('span');
      span.textContent = escapeHtml(opt);

      item.appendChild(numEl);
      item.appendChild(span);
      if (linkedOffer) item.appendChild(letterEl);

      item.addEventListener('click', () => {
        if (selectedOfferIdx === null) return;
        // Lier / délier
        if (links[selectedOfferIdx] === pIdx) {
          delete links[selectedOfferIdx];
        } else {
          // Enlever cette offre de toute autre personne si elle était liée
          // (une offre ne peut être liée qu'à une seule personne)
          links[selectedOfferIdx] = pIdx;
        }
        state.answers[q.id] = links;
        selectedOfferIdx = null;
        renderMatching(article, q, optionsContainer); // re-render
      });
      colPeople.appendChild(item);
    });
  }

  offers.forEach((opt, oIdx) => {
    const item = document.createElement('div');
    item.className = 'match-item';
    const linkedPerson = links[oIdx];
    if (linkedPerson !== undefined) item.classList.add('linked');

    const letterEl = document.createElement('span');
    letterEl.className = 'match-letter';
    letterEl.textContent = String.fromCharCode(65 + oIdx);

    const span = document.createElement('span');
    span.textContent = escapeHtml(opt);

    item.appendChild(letterEl);
    item.appendChild(span);

    item.addEventListener('click', () => {
      if (item.classList.contains('linked')) {
        // Décliquer = délier cette offre
        delete links[oIdx];
        selectedOfferIdx = null;
        state.answers[q.id] = links;
        renderMatching(article, q, optionsContainer);
      } else {
        selectedOfferIdx = oIdx;
        renderMatching(article, q, optionsContainer);
      }
    });
    colOffers.appendChild(item);
  });

  renderPeopleColumn();

  article.appendChild(wrap);
}

function extractListItems(text) {
  const parts = text.split(/(?=[A-E]\))/).filter(s => s.trim().length > 0);
  return parts.map(p => p.replace(/^[A-E]\)\s*/, '').trim());
}

function markSelected(el) {
  el.parentElement.querySelectorAll('.option, .match-item').forEach(x => x.classList.remove('selected'));
  el.classList.add('selected');
}

function selectOption(qId, value) {
  state.answers[qId] = value;
}

function restoreAnswer(q, saved) {
  if (q.type === 'gap-fill' || q.type === 'open-cloze') {
    return;
  }
  const article = TEST_CONTENT.querySelector(`.question[data-qid="${q.id}"]`);
  if (!article) return;
  const radios = article.querySelectorAll('input[type="radio"]');
  radios.forEach(r => {
    if (parseInt(r.value, 10) === saved) r.checked = true;
  });
  const selectedLabel = article.querySelector(`input[value="${saved}"]`);
  if (selectedLabel) markSelected(selectedLabel.closest('.option, .match-item'));
}

/* ------------------------------------------------------------------ */
/*  Affichage de la partie courante                                   */
/* ------------------------------------------------------------------ */
function showCurrentPart() {
  const part = state.parts[state.currentPartIndex];
  if (!part) return;

  PROGRESS_TEXT.textContent = `Partie ${part.id} sur ${state.parts.length}`;
  const pct = ((state.currentPartIndex) / state.parts.length) * 100;
  PROGRESS_FILL.style.width = `${pct}%`;

  renderPartNav();

  state.currentQIndex = 0;
  renderQuestion(part, state.currentQIndex);

  BTN_PREV.classList.add('hidden');
  BTN_NEXT.classList.remove('hidden');
  BTN_NEXT.textContent = 'Suivant';
}

function nextQuestion() {
  const part = state.parts[state.currentPartIndex];
  if (state.currentQIndex < part.questionCount - 1) {
    state.currentQIndex++;
    renderQuestion(part, state.currentQIndex);
    BTN_PREV.classList.remove('hidden');
    if (state.currentQIndex === part.questionCount - 1) BTN_NEXT.textContent = 'Partie suivante';
  } else {
    if (state.currentPartIndex < state.parts.length - 1) {
      state.currentPartIndex++;
      state.currentQIndex = 0;
      showCurrentPart();
    } else {
      finishTest();
    }
  }
}

function prevQuestion() {
  const part = state.parts[state.currentPartIndex];
  if (state.currentQIndex > 0) {
    state.currentQIndex--;
    renderQuestion(part, state.currentQIndex);
    BTN_NEXT.textContent = 'Suivant';
    if (state.currentQIndex === 0) BTN_PREV.classList.add('hidden');
  } else {
    if (state.currentPartIndex > 0) {
      state.currentPartIndex--;
      const prevPart = state.parts[state.currentPartIndex];
      state.currentQIndex = prevPart.questionCount - 1;
      showCurrentPart();
    }
  }
}

export { showScreen, renderHome, showCurrentPart, nextQuestion, prevQuestion, state, BTN_FINISH, BTN_PREV, BTN_NEXT, formatTime };

/* ------------------------------------------------------------------ */
/*  Fin du test : calcul du score                                     */
/* ------------------------------------------------------------------ */
function finishTest() {
  if (state.timer) state.timer.stop();
  state.finished = true;

  let correct = 0;
  let total = 0;
  const details = [];

  for (const part of state.parts) {
    for (const q of part.questions) {
      total++;
      const saved = state.answers[q.id];
      let isCorrect = false;

      if (q.type === 'gap-fill' || q.type === 'open-cloze') {
        const expected = (q.allCorrectLetters || []).map(l => l.toUpperCase());
        if (saved && typeof saved === 'object') {
          const given = Object.keys(saved)
            .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
            .map(k => String(saved[k]).toUpperCase());
          isCorrect = given.length === expected.length &&
            given.every((v, i) => v === expected[i]);
        }
      } else if (q.type === 'matching') {
        // saved = { [offreIndex]: personneIndex }
        // allCorrectLetters = lettre attendue pour chaque personne (dans l'ordre des personnes)
        const expected = (q.allCorrectLetters || []).map(l => l.toUpperCase());
        if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
          // Inverser : { personneIndex: offreIndex }
          const personToOffer = {};
          for (const [oIdx, pIdx] of Object.entries(saved)) {
            personToOffer[pIdx] = parseInt(oIdx, 10);
          }
          let allMatch = true;
          for (let pIdx = 0; pIdx < expected.length; pIdx++) {
            const linkedOffer = personToOffer[pIdx];
            if (linkedOffer === undefined) {
              allMatch = false;
              break;
            }
            const expectedLetter = expected[pIdx];
            const actualLetter = String.fromCharCode(65 + linkedOffer);
            if (actualLetter !== expectedLetter) {
              allMatch = false;
              break;
            }
          }
          isCorrect = allMatch && Object.keys(saved).length === expected.length;
        }
      } else {
        if (q.correctIndex !== null && saved !== undefined && parseInt(saved, 10) === q.correctIndex) {
          isCorrect = true;
        }
      }

      if (isCorrect) correct++;
      details.push({ part: part.id, q: q.id, correct: isCorrect });
    }
  }

  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  showScore(correct, total, pct, details, state.timer ? state.timer.getRemaining() : 0);
}

function showScore(correct, total, pct, details, timeLeft) {
  const scoreBig = $('#score-big');
  const scorePct = $('#score-pct');
  const scoreDetail = $('#score-detail');
  if (scoreBig) scoreBig.textContent = `${correct} / ${total}`;
  if (scorePct) scorePct.textContent = `${pct} %`;
  if (scoreDetail) {
    scoreDetail.innerHTML = `
      <div>Bonnes réponses : <strong>${correct}</strong> sur <strong>${total}</strong></div>
      <div>Score : <strong>${pct} %</strong></div>
      <div>Temps utilisé : ${formatTime((state.timer ? state.timer.durationSeconds : 0) - timeLeft)} sur 45:00</div>
    `;
  }

  const detailEl = document.createElement('div');
  detailEl.style.marginTop = '1rem';
  detailEl.style.textAlign = 'left';
  detailEl.style.fontSize = '0.85rem';
  detailEl.style.color = '#6b7280';
  detailEl.innerHTML = '<strong>Détail par partie :</strong>' +
    state.parts.map(part => {
      const partDetails = details.filter(d => d.part === part.id);
      const pc = partDetails.filter(d => d.correct).length;
      return `<div>Partie ${part.id} : ${pc} / ${part.questionCount}</div>`;
    }).join('');

  const scoreBody = document.querySelector('.score-body');
  // Enlever un éventuel détail précédent
  const existing = scoreBody.querySelector('.score-detail-extra');
  if (existing) existing.remove();
  detailEl.className = 'score-detail-extra';
  scoreBody.appendChild(detailEl);

  showScreen(SCREEN_SCORE);
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

export { finishTest, showScore, escapeHtml };
