import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

// --- Serveur statique local (détaché) ---------------------------------------
const serverProc = spawn(process.execPath, ['./scripts/local-server.mjs'], {
  detached: true,
  stdio: 'ignore',
  cwd: process.cwd(),
});
serverProc.unref();

let ready = false;
for (let i = 0; i < 40; i++) {
  try {
    await fetch('http://127.0.0.1:5001/');
    ready = true;
    break;
  } catch (e) {
    await new Promise((r) => setTimeout(r, 250));
  }
}

function log(...args) { console.error('[repro]', ...args); }

let failures = 0;
function check(name, cond) {
  if (cond) { log('OK  -', name); }
  else { failures++; log('KO  -', name); }
}

(async () => {
  if (!ready) { log('SERVEUR NON DISPONIBLE'); process.exit(1); }

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  // Capture les erreurs console / page pour diagnostiquer
  page.on('console', (m) => log('PAGE console:', m.type(), m.text().slice(0, 200)));
  page.on('pageerror', (e) => log('PAGE error:', e.message));

  try {
    await page.goto('http://127.0.0.1:5001/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#screen-home.active', { state: 'visible' });
    await page.click('#btn-start-test');
    await page.waitForSelector('.part-tab.active', { state: 'visible' });
    const activeText = await page.locator('.part-tab.active').textContent();
    check('Partie 1 active au démarrage', activeText.includes('Part 1'));

    const cards = page.locator('.question-card');
    const n = await cards.count();
    log('nombre de cartes question:', n);
    check('5 cartes présentes', n === 5);

    const q1 = cards.nth(0);
    const q2 = cards.nth(1);

    // Q1 -> option A (index 0)
    await q1.locator('.option-btn').first().click();
    check('Q1 option A sélectionnée', (await q1.locator('.option-btn.selected').count()) === 1
      && (await q1.locator('.option-btn.selected').textContent()).includes('A'));

    // Q2 -> option B (index 1)
    await q2.locator('.option-btn').nth(1).click();
    check('Q2 option B sélectionnée', (await q2.locator('.option-btn.selected').count()) === 1
      && (await q2.locator('.option-btn.selected').textContent()).includes('B'));

    // === LE BUG : Q1 doit rester sur A, pas de liaison ===
    check('Q1 reste sur A après avoir répondu à Q2', (await q1.locator('.option-btn.selected').textContent()).includes('A'));

    // Les questions suivantes (Q3, Q4, Q5) ne doivent pas être sélectionnées
    for (let i = 2; i < n; i++) {
      const c = cards.nth(i);
      check(`Q${i + 1} non sélectionnée après réponse Q2`, (await c.locator('.option-btn.selected').count()) === 0);
    }

    // On modifie la réponse de Q2 -> option C (index 2) : Q1 ne doit PAS bouger
    await q2.locator('.option-btn').nth(2).click();
    check('Q2 passe sur C', (await q2.locator('.option-btn.selected').textContent()).includes('C'));
    check('Q1 reste sur A après modification de Q2', (await q1.locator('.option-btn.selected').textContent()).includes('A'));

  } catch (e) {
    failures++;
    log('EXCEPTION:', e.message);
  }

  await browser.close();
  try { serverProc.kill(); } catch (_) {}
  log('=== RESULTAT :', failures === 0 ? 'TOUT EST OK' : failures + ' ECHEC(S)');
  process.exit(failures === 0 ? 0 : 1);
})();
