import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:5001' });

test('obtenir un score de 100% (20/20) en sélectionnant toutes les bonnes réponses', async ({ page }) => {
  // Écouter les erreurs de page pour diagnostiquer
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));

  // Intercepter le dialog de confirmation natif (confirm dans finishExam)
  page.on('dialog', async (dialog) => {
    console.log('[DIALOG]', dialog.type(), dialog.message());
    await dialog.accept();
  });

  console.log('[STEP] chargement page daccueil');
  await page.goto('/');
  await page.waitForSelector('#screen-home.active', { state: 'visible' });

  console.log('[STEP] demarrage examen');
  await page.click('#btn-start-test');
  await expect(page.locator('#screen-test')).toHaveClass(/active/);

  // Remplir toutes les bonnes réponses dans session.answers via window.__app
  console.log('[STEP] remplissage des bonnes reponses');
  const filledCount = await page.evaluate(() => {
    const app = window.__app;
    if (!app || !app.session) throw new Error('app.session non disponible');
    const newAnswers = { ...app.session.answers };

    for (const part of app.session.parts) {
      if (part.id === 1) {
        // Partie 1 : Multiple Choice — good answer est un label (A/B/C)
        for (const q of part.questions) {
          const correct = part.getCorrectAnswer(q);
          newAnswers[`p1_${q.id}`] = correct;
        }
      } else if (part.id === 2) {
        // Partie 2 : Matching — good answer est un offer_id
        for (const p of part.people) {
          const correct = part.getCorrectAnswer(p.id);
          newAnswers[`p2_${p.id}`] = correct;
        }
      } else if (part.id === 3) {
        // Partie 3 : Reading — good answer est un label
        for (const q of part.questions) {
          const correct = part.getCorrectAnswer(q);
          newAnswers[`p3_${q.id}`] = correct;
        }
      } else if (part.id === 4) {
        // Partie 4 : Sentence Insertion — good answer est un label, faut l'id de l'option
        for (const q of part.questions) {
          const correctLabel = part.getCorrectAnswer(q);
          const correctOpt = part.sharedOptions.find((o) => o.label === correctLabel);
          newAnswers[`p4_${q.blank_id}`] = correctOpt ? correctOpt.id : null;
        }
      } else if (part.id === 5) {
        // Partie 5 : Multiple Choice Cloze — good answer est un label, faut l'id de l'option
        for (const q of part.questions) {
          const correctLabel = part.getCorrectAnswer(q);
          const correctOpt = q.options.find((o) => o.label === correctLabel);
          newAnswers[`p5_${q.blank_id}`] = correctOpt ? correctOpt.id : null;
        }
      } else if (part.id === 6) {
        // Partie 6 : Open Cloze — good answer est une chaîne "mot1 ou mot2", prendre le premier
        for (const q of part.questions) {
          const accepted = part.getCorrectAnswer(q);
          newAnswers[`p6_${q.blank_id}`] = accepted.split(' ou ')[0].trim();
        }
      }
    }

    app.session.answers = newAnswers;
    return Object.keys(newAnswers).length;
  });

  console.log(`[INFO] ${filledCount} reponses remplies`);

  // Re-render chaque partie pour que l'UI affiche les sélections
  console.log('[STEP] rendu des 6 parties');
  for (let i = 1; i <= 6; i++) {
    await page.click(`.part-tab:nth-child(${i})`);
    await page.waitForTimeout(100);
  }

  // Soumettre l'examen (le dialog confirm est intercepte ci-dessus)
  console.log('[STEP] soumission examen');
  await page.click('#btn-finish-test');

  // Vérifier l'écran de score
  console.log('[STEP] verification ecran de score');
  await expect(page.locator('#screen-score')).toHaveClass(/active/);

  // Capture d'écran de la page de résultat
  await page.screenshot({ path: 'test-results/full-run-result.png', fullPage: true });
  console.log('[INFO] capture d ecran enregistree : test-results/full-run-result.png');

  // Vérifier le score 20/20 et 100%
  console.log('[STEP] verification score');
  await expect(page.locator('#score-big')).toHaveText('20 / 20');
  await expect(page.locator('#score-pct')).toMatch(/100%/);

  // Vérifier qu'il n'y a pas d'erreurs de page
  expect(pageErrors).toHaveLength(0);
  console.log('[OK] Score 100% confirme - 20/20');
});
