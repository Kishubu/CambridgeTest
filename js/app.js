/**
 * app.js — Orchestrateur du site Cambridge B1 Reading.
 * Charge la BDD intégrée, pilote le minuteur et les écrans.
 */

import examDB from './db.js';
import Timer from './timer.js';
import {
  showScreen, renderHome, showCurrentPart, nextQuestion, prevQuestion,
  state, BTN_PREV, BTN_NEXT, BTN_FINISH, finishTest
} from './ui.js';

let timer = null;

// ------------------------------------------------------------------ 
// Affichage des erreurs JS à l'écran (débogage, pas de console)
// ------------------------------------------------------------------ 
function showErrorBanner(msg) {
  let banner = document.getElementById('error-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'error-banner';
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#dc2626;color:#fff;padding:0.75rem 1rem;font-family:system-ui;font-size:0.9rem;z-index:9999;box-shadow:0 2px 6px rgba(0,0,0,0.2);';
    document.body.insertBefore(banner, document.body.firstChild);
  }
  banner.textContent = '⚠️ ' + msg;
  console.error('ERREUR:', msg);
}

function log(msg) {
  console.log('[APP]', msg);
}

// ------------------------------------------------------------------ 
// Gestionnaire d'erreur global (affiche à l'écran si une erreur survient)
// ------------------------------------------------------------------ 
window.addEventListener('error', (ev) => {
  showErrorBanner(ev.message + (ev.filename ? ' (' + ev.filename + ':' + ev.lineno + ')' : ''));
});
window.addEventListener('unhandledrejection', (ev) => {
  showErrorBanner('Promise rejetée: ' + (ev.reason && ev.reason.message ? ev.reason.message : String(ev.reason)));
});

function $(sel) { return document.querySelector(sel); }

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ------------------------------------------------------------------
// Initialisation
// ------------------------------------------------------------------
async function init() {
  log('init() démarré');
  try {
    await examDB.load();
    log('BDD chargée OK');
    state.parts = examDB.getParts();
    state.timerSeconds = examDB.getTimerSeconds();
    log('Parties:', state.parts.length, 'timerSeconds:', state.timerSeconds);

    renderHome(examDB);
    log('écran d\'accueil rendu');

    // Accueil
    const btnStart = document.getElementById('btn-start-test');
    log('btn-start-test présent:', !!btnStart);
    btnStart.addEventListener('click', startTest);

    document.getElementById('btn-retry').addEventListener('click', () => {
      resetTest();
      showScreen(document.getElementById('screen-home'));
    });
    document.getElementById('btn-home').addEventListener('click', () => {
      resetTest();
      showScreen(document.getElementById('screen-home'));
    });

    // Test
    BTN_PREV.addEventListener('click', prevQuestion);
    BTN_NEXT.addEventListener('click', nextQuestion);
    document.getElementById('btn-finish-test').addEventListener('click', finishTestConfirm);

    // Pause/reprise du timer quand l'onglet est masqué (anti-triche basique)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && timer && timer.isRunning()) timer.pause();
      else if (!document.hidden && timer && timer.isRunning() && !timer.isFinished()) timer.resume();
    });

    log('init() terminé avec succès');
  } catch (err) {
    showErrorBanner('Erreur lors de l\'initialisation: ' + err.message);
  }
}

// ------------------------------------------------------------------
// Démarrer le test
// ------------------------------------------------------------------
function startTest() {
  state.answers = {};
  state.currentPartIndex = 0;
  state.currentQIndex = 0;
  state.finished = false;

  timer = new Timer(
    (remaining) => {
      document.getElementById('timer-display').textContent = formatTime(remaining);
      if (remaining <= 5 * 60) {
        document.getElementById('timer-warn').classList.remove('hidden');
      }
    },
    () => {
      // Temps écoulé -> test terminé automatiquement
      state.timer = timer;
      finishTest();
    }
  );
  timer.setDuration(examDB.getTimerSeconds());
  timer.start();
  state.timer = timer;

  showScreen(document.getElementById('screen-test'));
  showCurrentPart();
}

// ------------------------------------------------------------------
// Fin du test (confirmation)
// ------------------------------------------------------------------
function finishTestConfirm() {
  if (!state.finished && !confirm('Voulez-vous vraiment terminer le test et voir votre score ?')) {
    return;
  }
  state.timer = timer;
  finishTest();
}

// ------------------------------------------------------------------
// Reset
// ------------------------------------------------------------------
function resetTest() {
  if (timer) timer.reset();
  state.answers = {};
  state.currentPartIndex = 0;
  state.currentQIndex = 0;
  state.finished = false;
  timer = null;
  document.getElementById('timer-warn').classList.add('hidden');
}

// Démarrage
init();
