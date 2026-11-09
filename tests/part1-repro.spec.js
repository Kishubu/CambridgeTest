import { test, expect } from '@playwright/test';

// Reproduction du bug Partie 1 : répondre à la 2e question sélectionne/lie
// les réponses des questions suivantes (modif l'une => modif toutes).
test.use({ baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5001' });

test.describe('Partie 1 — reproduction bug sélection liée', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#screen-home.active', { state: 'visible' });
    await page.click('#btn-start-test');
    await expect(page.locator('.part-tab.active')).toContainText('Part 1');
  });

  test('répondre à la Q2 ne doit pas lier/modifier les autres questions', async ({ page }) => {
    const cards = page.locator('.question-card');
    await expect(cards).toHaveCount(5);

    const q1 = cards.nth(0);
    const q2 = cards.nth(1);

    // Q1 -> option A (premier bouton)
    await q1.locator('.option-btn').first().click();
    await expect(q1.locator('.option-btn.selected')).toHaveCount(1);
    await expect(q1.locator('.option-btn.selected')).toContainText('A');

    // Q2 -> option B (deuxième bouton)
    await q2.locator('.option-btn').nth(1).click();
    await expect(q2.locator('.option-btn.selected')).toHaveCount(1);
    await expect(q2.locator('.option-btn.selected')).toContainText('B');

    // Q1 doit rester sur A (pas de liaison)
    await expect(q1.locator('.option-btn.selected')).toHaveCount(1);
    await expect(q1.locator('.option-btn.selected')).toContainText('A');

    // Aucune des questions suivantes (Q3, Q4, Q5) ne doit être sélectionnée
    for (let i = 2; i < 5; i++) {
      await expect(cards.nth(i).locator('.option-btn.selected')).toHaveCount(0);
    }

    // On modifie la réponse de Q2 (option C) : Q1 ne doit PAS bouger
    await q2.locator('.option-btn').nth(2).click();
    await expect(q2.locator('.option-btn.selected')).toHaveCount(1);
    await expect(q2.locator('.option-btn.selected')).toContainText('C');
    await expect(q1.locator('.option-btn.selected')).toContainText('A');
  });
});
