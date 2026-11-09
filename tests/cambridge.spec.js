import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:5001' });

test.describe('Cambridge B1 Preliminary — Reading', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#screen-home.active', { state: 'visible' });
  });

  test('ecran accueil avec titre et bouton demarrage', async ({ page }) => {
    await expect(page.locator('#screen-home h1')).toContainText('Cambridge B1');
    await expect(page.locator('#btn-start-test')).toBeVisible();
  });

  test('demarre un test et affiche le minuteur 45:00', async ({ page }) => {
    await page.click('#btn-start-test');
    await expect(page.locator('#screen-test')).toHaveClass(/active/);
    await expect(page.locator('#timer-display')).toHaveText('45:00');
  });

  test('Partie 1 : cliquer une reponse ne selectionne qu elle', async ({ page }) => {
    await page.click('#btn-start-test');
    await expect(page.locator('.part-tab.active')).toContainText('Part 1');

    const firstCard = page.locator('.question-card').first();
    await firstCard.locator('.option-btn').first().click();
    await expect(firstCard.locator('.option-btn.selected')).toHaveCount(1);
    await expect(firstCard.locator('.option-btn:not(.selected)')).toHaveCount(2);

    await firstCard.locator('.option-btn').nth(1).click();
    await expect(firstCard.locator('.option-btn.selected')).toHaveCount(1);
    await expect(firstCard.locator('.option-btn.selected')).toContainText('B');
  });

  test('Partie 2 : selectionner une personne puis une offre cree un lien', async ({ page }) => {
    await page.click('#btn-start-test');
    await page.click('.part-tab:nth-child(2)'); // Aller à Partie 2 maintenant que le test est lancé
    await expect(page.locator('.part-tab.active')).toContainText('Part 2');
    await expect(page.locator('.person-item')).toHaveCount(3);
    await expect(page.locator('.offer-item')).toHaveCount(5);

    const firstPerson = page.locator('.person-item').first();
    await firstPerson.click();
    await expect(firstPerson).toHaveClass(/selected/);

    const firstOffer = page.locator('.offer-item').first();
    await firstOffer.click();
    await expect(firstOffer).toHaveClass(/linked/);

    await firstOffer.click();
    await expect(firstOffer).not.toHaveClass(/linked/);
  });

  test('navigue entre les 6 parties', async ({ page }) => {
    await page.click('#btn-start-test');
    for (let i = 1; i <= 6; i++) {
      await page.click(`.part-tab:nth-child(${i})`);
      await expect(page.locator('.part-tab.active')).toContainText(`Part ${i}`);
    }
  });

  test('affiche l ecran de score apres validation', async ({ page }) => {
    await page.click('#btn-start-test');

    const firstCard = page.locator('.question-card').first();
    await firstCard.locator('.option-btn').first().click();

    await page.click('.part-tab:nth-child(2)');
    await page.locator('.person-item').first().click();
    await page.locator('.offer-item').first().click();

    await page.click('#btn-finish-test');
    await page.click('text=Voulez-vous vraiment terminer');

    await expect(page.locator('#screen-score')).toHaveClass(/active/);
    await expect(page.locator('#score-big')).toMatch(/\d+\/20/);
    await expect(page.locator('#score-pct')).toMatch(/\d+%/);
  });

  test('minuteur alerte moins de 5 minutes', async ({ page }) => {
    await page.click('#btn-start-test');
    await expect(page.locator('#timer-warn')).toHaveClass(/hidden/);
    await expect(page.locator('#timer-warn')).toBeInViewport();
  });
});
