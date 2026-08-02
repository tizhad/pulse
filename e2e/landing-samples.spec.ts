import { test, expect } from './fixtures';

// ── Index / gallery ───────────────────────────────────────────────────────

test.describe('Landing samples index', () => {
  test('lists all three samples with working links', async ({ page }) => {
    await page.goto('/landing-samples');
    await expect(page.getByRole('heading', { name: 'Flowdesk', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Vaultly', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Forge Kit', exact: true })).toBeVisible();

    await page.getByRole('link', { name: /Flowdesk/ }).click();
    await expect(page).toHaveURL(/\/landing-samples\/saas$/);
  });

  test('shows the fictional-product disclaimer', async ({ page }) => {
    await page.goto('/landing-samples');
    await expect(
      page.getByText('fictional products built purely to demonstrate landing page design'),
    ).toBeVisible();
  });

  test('does not render the dashboard sidebar', async ({ page }) => {
    await page.goto('/landing-samples');
    await expect(page.getByRole('link', { name: 'Dashboard' })).toHaveCount(0);
  });
});

// ── Sample pages ──────────────────────────────────────────────────────────

test.describe('Flowdesk (SaaS sample)', () => {
  test('renders hero and links back to the samples index', async ({ page }) => {
    await page.goto('/landing-samples/saas');
    await expect(page.getByRole('heading', { name: /Work flows better/ })).toBeVisible();
    await page.getByRole('link', { name: 'Landing Page Samples' }).click();
    await expect(page).toHaveURL(/\/landing-samples$/);
  });

  test('waitlist form validates and submits', async ({ page }) => {
    await page.goto('/landing-samples/saas');
    const email = page.getByLabel('Work email');
    const submit = page.getByRole('button', { name: 'Join the waitlist' });

    await email.fill('not-an-email');
    await submit.click();
    await expect(page.getByRole('alert')).toHaveText(/valid email/i);

    await email.fill('tina@example.com');
    await submit.click();
    await expect(page.getByRole('status')).toContainText("you're on the list");
  });
});

test.describe('Vaultly (fintech sample)', () => {
  test('renders hero and comparison table', async ({ page }) => {
    await page.goto('/landing-samples/fintech');
    await expect(page.getByRole('heading', { name: /See where your money/ })).toBeVisible();
    await expect(page.getByRole('cell', { name: '2 minutes' })).toBeVisible();
  });
});

test.describe('Forge Kit (dev-tool sample)', () => {
  test('renders hero and before/after code comparison', async ({ page }) => {
    await page.goto('/landing-samples/dev-tool');
    await expect(page.getByRole('heading', { name: /Stop rebuilding/ })).toBeVisible();
    await expect(page.getByText('// Before Forge Kit')).toBeVisible();
    await expect(page.getByText('// After Forge Kit')).toBeVisible();
  });
});
