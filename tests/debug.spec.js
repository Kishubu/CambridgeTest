import { test } from '@playwright/test';

test.use({ baseURL: 'http://localhost:5001' });

test('debug partie 2', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('#screen-home.active', { state: 'visible' });
  await page.click('#btn-start-test');
  await page.click('.part-tab:nth-child(2)');
  
  await page.locator('.person-item').first().click();
  await page.waitForTimeout(300);
  
  const stateAfterPerson = await page.evaluate(() => {
    const container = document.querySelector('#test-content');
    const firstOffer = document.querySelector('.offer-item');
    return {
      datasetSelectedPersonId: container.dataset.selectedPersonId,
      firstOfferClass: firstOffer ? firstOffer.className : 'none',
      firstOfferDataId: firstOffer ? firstOffer.dataset.id : 'none',
    };
  });
  console.log('STATE AFTER PERSON CLICK:', JSON.stringify(stateAfterPerson));
  
  await page.locator('.offer-item').first().click();
  await page.waitForTimeout(300);
  
  const stateAfterOffer = await page.evaluate(() => {
    const container = document.querySelector('#test-content');
    const firstOffer = document.querySelector('.offer-item');
    return {
      datasetSelectedPersonId: container.dataset.selectedPersonId,
      firstOfferClass: firstOffer ? firstOffer.className : 'none',
    };
  });
  console.log('STATE AFTER OFFER CLICK:', JSON.stringify(stateAfterOffer));
});
