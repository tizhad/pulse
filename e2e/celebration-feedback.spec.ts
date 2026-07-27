import { test, expect } from './fixtures';

// Application status changes give the user feedback: a success toast when a
// new application is logged, a confetti celebration modal when a status
// moves to Offer, and a no-confetti "encouragement" variant of the same
// modal when a status moves to Rejected.

const SUPABASE_PROJECT = 'kmokerewodxljtywkwbi';

const SEEDED_APP = {
  id: 'app-1',
  user_id: 'test-user-id',
  title: 'Senior Frontend Engineer',
  company: 'Vercel',
  date: '2026-07-01',
  location: 'Remote',
  status: 'applied',
  salary: '€95k',
  url: null,
  tags: [],
  created_at: '2026-07-01T00:00:00Z',
  updated_at: '2026-07-01T00:00:00Z',
};

async function mockSeededApplication(page: import('@playwright/test').Page): Promise<void> {
  await page.route(`**/${SUPABASE_PROJECT}**/rest/v1/applications**`, (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([SEEDED_APP]),
      });
    } else if (route.request().method() === 'PATCH') {
      route.fulfill({ status: 204, contentType: 'application/json', body: '' });
    } else {
      route.continue();
    }
  });
}

test.describe('Application status feedback', () => {
  test('creating an application as a guest shows a success toast', async ({ page }) => {
    await page.goto('/applications');
    await page.getByRole('button', { name: 'New application' }).click();
    await page.locator('#app-title').fill('Frontend Engineer');
    await page.locator('#app-company').fill('Adyen');
    await page.getByRole('button', { name: 'Add application' }).click();

    await expect(page.getByRole('alert').getByText(/Good job! Application logged/)).toBeVisible();
  });

  test('moving an application to Offer opens the confetti celebration modal', async ({ authedPage: page }) => {
    await mockSeededApplication(page);
    await page.goto('/applications');

    await page.getByText('Senior Frontend Engineer', { exact: true }).click();
    await page.locator('#edit-status').selectOption('offer');
    await page.getByRole('button', { name: 'Save' }).click();

    const dialog = page.getByRole('dialog', { name: 'Well done!' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/congrats on the offer/i)).toBeVisible();
    await expect(dialog.locator('.confetti-field')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Nice!' })).toBeVisible();

    await dialog.getByRole('button', { name: 'Nice!' }).click();
    await expect(dialog).toBeHidden();
  });

  test('moving an application to Rejected opens the encouragement modal without confetti', async ({ authedPage: page }) => {
    await mockSeededApplication(page);
    await page.goto('/applications');

    await page.getByText('Senior Frontend Engineer', { exact: true }).click();
    await page.locator('#edit-status').selectOption('rejected');
    await page.getByRole('button', { name: 'Save' }).click();

    const dialog = page.getByRole('dialog', { name: 'Oh no!' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/isn't the end/i)).toBeVisible();
    await expect(dialog.locator('.confetti-field')).toHaveCount(0);
    await expect(dialog.getByRole('button', { name: 'Thanks' })).toBeVisible();

    await dialog.getByRole('button', { name: 'Thanks' }).click();
    await expect(dialog).toBeHidden();
  });
});
