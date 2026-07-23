import { test, expect } from './fixtures';

// Guests (signed-out visitors) can create up to 3 of each entity to try the
// product before signing up; the 4th attempt should prompt a sign-up modal.
// Subjects also start pre-seeded with 2 samples (RxJS, Signals), free of
// charge — they don't count toward the 3-item limit.

test.describe('Guest trial limits', () => {
  test('subjects page starts with RxJS and Signals sample subjects, and the full 3 free slots', async ({ page }) => {
    await page.goto('/subjects');
    await expect(page.getByText('RxJS', { exact: true })).toBeVisible();
    await expect(page.getByText('Signals', { exact: true })).toBeVisible();
    await expect(page.getByText('3 free subjects left before sign-up.')).toBeVisible();
  });

  test('guests can add 3 subjects on top of the 2 samples, the 4th prompts sign-up', async ({ page }) => {
    for (let i = 0; i < 3; i++) {
      await page.goto('/subjects');
      await page.getByRole('button', { name: 'New subject' }).click();
      await page.getByLabel(/Title/).fill(`Test Subject ${i}`);
      await page.getByRole('button', { name: 'Add subject' }).click();
      await expect(page).toHaveURL(/\/subjects\/.+/);
    }

    await page.goto('/subjects');
    await expect(page.getByText('0 free subjects left before sign-up.')).toBeVisible();

    await page.getByRole('button', { name: 'New subject' }).click();
    await page.getByLabel(/Title/).fill('Fourth Subject');
    await page.getByRole('button', { name: 'Add subject' }).click();

    await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();
    await expect(page.getByText("You've added 3 free subjects")).toBeVisible();
  });

  test('guest subjects persist across a page reload', async ({ page }) => {
    await page.goto('/subjects');
    await page.getByRole('button', { name: 'New subject' }).click();
    await page.getByLabel(/Title/).fill('Persisted Subject');
    await page.getByRole('button', { name: 'Add subject' }).click();
    await expect(page).toHaveURL(/\/subjects\/.+/);

    await page.goto('/subjects');
    await expect(page.getByText('Persisted Subject')).toBeVisible();
  });
});
