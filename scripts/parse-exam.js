/**
 * parse-exam.js (v7) — lecture linéaire du fichier + extraction dédiée des réponses.
 * Génère db/questions.json.
 *
 * Partie 2 (matching) : sépare Offres et Personnes correctement.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'Cambridge B1 Exam.txt');
const OUT = path.join(ROOT, 'db', 'questions.json');

const raw = fs.readFileSync(SRC, 'utf-8');
const clean = raw.split('\n')
  .map(l => l.replace(/^\s*\d+\|\s?/, ''))
  .map(l => l.replace(/\r$/, ''));

const SERIES = [
  { id: 1, title: 'Partie 1 — Choix multiples', type: 'single-choice', instruction: 'Pour chaque message, choisis la proposition qui correspond à son sens.' },
  { id: 2, title: 'Partie 2 — Associations', type: 'matching', instruction: 'Associe chaque personne à l’offre qui lui correspond.' },
  { id: 3, title: 'Partie 3 — Choix multiples', type: 'multiple-choice', instruction: 'Lis le texte et réponds aux questions (A, B ou C).' },
  { id: 4, title: 'Partie 4 — Texte à trous', type: 'gap-fill', instruction: 'Complète le texte en choisissant la bonne phrase pour chaque trou (A–E).' },
  { id: 5, title: 'Partie 5 — Choix multiples (cloze)', type: 'cloze', instruction: 'Choisis A, B, C ou D pour chacun des blancs (1), (2), (3).' },
  { id: 6, title: 'Partie 6 — Texte à trous libre', type: 'open-cloze', instruction: 'Complète chaque trou par le mot manquant.' }
];

const NB_Q_PER_PART = { 1: 5, 2: 5, 3: 5, 4: 5, 5: 6, 6: 6 };

let currentSerieId = null;
let currentMiniTestNum = null;
let questions = [];
let qGlobalCounter = 0;

const SERIE_RE = /^Série\s+(\d+)\s*—/i;
const MINI_TEST_RE = /^Mini-test\s+(\d+)(?:\s*—\s*(.*))?$/i;
const CONSIGNE_RE = /^Consigne\s*:\s*/i;
const RANGE_RE = /^Mini-tests\s+\d+\s+à\s+\d+/i;
const MSG_LINE_RE = /^“/;
const OFFRES_RE = /^Offres\s*$/i;
const PERSONNES_RE = /^Personnes\s*$/i;

function extractOptions(line) {
  const opts = [];
  const re = /([A-E])\)\s*([^A-E\)]*?)(?=\s*[A-E]\)|$)/gs;
  let m;
  while ((m = re.exec(line)) !== null) opts.push({ letter: m[1], text: m[2].trim() });
  return opts;
}

function newQuestion(num, type, stimulus, options, serieId, msgIndex, offers, people) {
  qGlobalCounter++;
  return {
    id: `p${serieId}_q${qGlobalCounter}`,
    number: num,
    type,
    stimulus: (Array.isArray(stimulus) ? stimulus.join(' ') : stimulus).trim(),
    options: options.map(o => o.text),
    serieId,
    sourceIndex: num,
    msgIndex: msgIndex || 0,
    correctIndex: null,
    correctLetter: null,
    allCorrectLetters: [],
    offers: offers || null,
    people: people || null
  };
}

function flushPending(pending) {
  if (!pending) return;
  const q = newQuestion(pending.num, pending.type, pending.stimulus, pending.options, pending.serieId, pending.msgIndex, pending.offers, pending.people);
  questions.push(q);
}

let pending = null;
let serieMsgCounter = 0;

for (let i = 0; i < clean.length; i++) {
  let line = clean[i];
  if (!line.trim()) continue;

  const sm = line.match(SERIE_RE);
  if (sm) {
    currentSerieId = parseInt(sm[1], 10);
    serieMsgCounter = 0;
    continue;
  }
  if (line.match(CONSIGNE_RE)) continue;
  if (line.match(RANGE_RE)) continue;

  const mm = line.match(MINI_TEST_RE);
  if (mm) {
    flushPending(pending);
    pending = {
      num: parseInt(mm[1], 10),
      type: SERIES.find(s => s.id === currentSerieId)?.type || 'single-choice',
      stimulus: [],
      options: [],
      serieId: currentSerieId,
      msgIndex: 0,
      offers: null,
      people: null,
      inOffers: false,
      inPeople: false
    };
    if (currentSerieId === 1) serieMsgCounter = 0;
    continue;
  }
  if (!pending) continue;

  // Détection des sections Offres / Personnes (partie 2)
  if (currentSerieId === 2) {
    if (line.match(OFFRES_RE)) {
      pending.inOffers = true;
      pending.inPeople = false;
      continue;
    }
    if (line.match(PERSONNES_RE)) {
      pending.inOffers = false;
      pending.inPeople = true;
      continue;
    }
  }

  if (currentSerieId === 1) {
    // === Série 1 : chaque message “…” = 1 question ===
    const isMsg = MSG_LINE_RE.test(line);
    const opts = extractOptions(line);
    if (isMsg) {
      if (pending.stimulus.length > 0 && pending.options.length > 0) flushPending(pending);
      pending = {
        num: pending.num,
        type: pending.type,
        stimulus: [],
        options: [],
        serieId: pending.serieId,
        msgIndex: 0,
        offers: null,
        people: null,
        inOffers: false,
        inPeople: false
      };
      serieMsgCounter++;
      pending.msgIndex = serieMsgCounter;
      pending.stimulus.push(line.trim());
    } else if (opts.length > 0) {
      pending.options.push(...opts);
      if (pending.stimulus.length > 0) {
        flushPending(pending);
        pending = {
          num: pending.num,
          type: pending.type,
          stimulus: [],
          options: [],
          serieId: pending.serieId,
          msgIndex: 0,
          offers: null,
          people: null,
          inOffers: false,
          inPeople: false
        };
      }
    } else {
      pending.stimulus.push(line.trim());
    }
  } else if (currentSerieId === 2) {
    // === Série 2 : Offres puis Personnes ===
    if (pending.inOffers) {
      const opts = extractOptions(line);
      if (opts.length > 0) {
        if (!pending.offers) pending.offers = [];
        pending.offers.push(...opts);
      }
    } else if (pending.inPeople) {
      // Les personnes sont des descriptions simples (sans lettre)
      if (line.trim().length > 0) {
        if (!pending.people) pending.people = [];
        pending.people.push(line.trim());
      }
      // Quand on a les 3 personnes, créer la question
      if (pending.people && pending.people.length === 3 && pending.offers && pending.offers.length >= 3) {
        flushPending(pending);
        pending = {
          num: pending.num,
          type: pending.type,
          stimulus: [],
          options: [],
          serieId: pending.serieId,
          msgIndex: 0,
          offers: null,
          people: null,
          inOffers: false,
          inPeople: false
        };
      }
    } else {
      // Avant "Offres" — ignorer
    }
  } else {
    // === Séries 3-6 : stimulus puis options ===
    const opts = extractOptions(line);
    if (opts.length > 0) {
      pending.options.push(...opts);
    } else {
      pending.stimulus.push(line.trim());
    }
  }
}
flushPending(pending);

// Nettoyage stimulus séries 3-6
for (const q of questions) {
  if (q.serieId === 1 || q.serieId === 2) continue;
  q.stimulus = q.stimulus.replace(/^(Offres|Personnes)\s*/gi, '').trim();
}

// ------------------------------------------------------------------
// Extraction des réponses
// ------------------------------------------------------------------
const answerLines = [];
for (let i = clean.length - 1; i >= 0; i--) {
  const l = clean[i].trim();
  if (!l) continue;
  if (/^[A-E]\s*\//.test(l)) {
    answerLines.unshift(l);
  }
}

const answerKey = [];
for (const l of answerLines) {
  const letters = l.match(/[A-E]/g);
  if (letters) answerKey.push(letters.map(x => x.toUpperCase()));
}

// Affectation des réponses
let answerIdx = 0;
const questionsBySerie = {};
SERIES.forEach(s => { questionsBySerie[s.id] = questions.filter(q => q.serieId === s.id); });

for (const sid of [1, 2, 3, 4, 5, 6]) {
  const qs = questionsBySerie[sid];
  let nbAnswers = (sid === 2) ? 3 : 3; // Série 2 : 3 lettres pour 3 personnes
  const bySource = {};
  qs.forEach(q => { if (!bySource[q.sourceIndex]) bySource[q.sourceIndex] = []; bySource[q.sourceIndex].push(q); });
  const sources = Object.keys(bySource).map(Number).sort((a, b) => a - b);

  for (const source of sources) {
    if (answerIdx >= answerKey.length) break;
    const letters = answerKey[answerIdx];
    const relevant = letters.slice(0, nbAnswers);
    answerIdx++;

    const group = bySource[source];
    if (sid === 1) {
      group.forEach((q, k) => {
        if (k < relevant.length) {
          q.correctLetter = relevant[k];
          q.correctIndex = relevant[k].charCodeAt(0) - 'A'.charCodeAt(0);
          q.allCorrectLetters = [relevant[k]];
        }
      });
    } else if (sid === 2) {
      // Série 2 : les lettres sont dans l'ordre des personnes
      group.forEach(q => {
        q.allCorrectLetters = relevant;
        q.correctLetter = relevant[0];
        q.correctIndex = relevant[0].charCodeAt(0) - 'A'.charCodeAt(0);
      });
    } else {
      group.forEach(q => {
        q.allCorrectLetters = relevant;
        q.correctLetter = relevant[0];
        q.correctIndex = relevant[0].charCodeAt(0) - 'A'.charCodeAt(0);
      });
    }
  }
}

console.log('=== Parsing terminé ===');
for (const sid of [1, 2, 3, 4, 5, 6]) {
  console.log(`Série ${sid} (${SERIES.find(s => s.id === sid).title}): ${questionsBySerie[sid].length} questions`);
}
console.log('Clés de réponses consommées:', answerIdx, '/', answerKey.length);

// ------------------------------------------------------------------
// Sélection finale et JSON
// ------------------------------------------------------------------
const parts = SERIES.map(s => {
  const available = questionsBySerie[s.id];
  const need = NB_Q_PER_PART[s.id];
  const selected = available.slice(0, need);
  const questionsFinal = selected.map(q => ({
    id: q.id,
    type: q.type,
    title: q.title,
    stimulus: q.stimulus,
    options: q.options,
    offers: q.offers,
    people: q.people,
    correctIndex: q.correctIndex !== null ? q.correctIndex : null,
    correctLetter: q.correctLetter,
    allCorrectLetters: q.allCorrectLetters
  }));
  return {
    id: s.id,
    title: s.title,
    type: s.type,
    instruction: s.instruction,
    questionCount: questionsFinal.length,
    questions: questionsFinal
  };
});

const db = {
  version: '1.0',
  source: 'Cambridge B1 Exam.txt',
  generatedAt: new Date().toISOString(),
  totalQuestions: parts.reduce((sum, p) => sum + p.questionCount, 0),
  timerSeconds: 45 * 60,
  parts
};

fs.writeFileSync(OUT, JSON.stringify(db, null, 2), 'utf-8');
console.log('\n=== Fichier écrit :', OUT);
console.log('Total questions:', db.totalQuestions);
for (const p of parts) {
  console.log(`  Partie ${p.id} (${p.type}): ${p.questionCount} questions`);
}
let missing = 0;
for (const p of parts) for (const q of p.questions) if (q.correctIndex === null) missing++;
console.log('Questions sans réponse correcte:', missing);
