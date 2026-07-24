import { test, expect } from './fixtures';

// ── Portfolio page ────────────────────────────────────────────────────────

test.describe('Portfolio page', () => {
  test('renders role and bio', async ({ page }) => {
    await page.goto('/portfolio');
    await expect(page.getByText('Frontend engineer · Amsterdam')).toBeVisible();
  });

  test('/about redirects to /portfolio', async ({ page }) => {
    await page.goto('/about');
    await expect(page).toHaveURL(/\/portfolio$/);
    await expect(page.getByText('Frontend engineer · Amsterdam')).toBeVisible();
  });

  test('lists all three featured projects', async ({ page }) => {
    await page.goto('/portfolio');
    await expect(page.getByRole('heading', { name: 'Pulse', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Angular 21 SaaS Starter Kit' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'MoneyCho', exact: true })).toBeVisible();
  });

  test('starter kit project links to /starter-kit', async ({ page }) => {
    await page.goto('/portfolio');
    await page
      .locator('.pf-project-card', { hasText: 'Angular 21 SaaS Starter Kit' })
      .getByRole('link', { name: 'View case study' })
      .click();
    await expect(page).toHaveURL(/\/starter-kit/);
  });

  test('contact section exposes real GitHub and email endpoints', async ({ page }) => {
    await page.goto('/portfolio');
    const github = page.getByRole('link', { name: 'GitHub', exact: true });
    await expect(github).toHaveAttribute('href', 'https://github.com/tizhad');
    const email = page.getByRole('link', { name: 'tiizhad@gmail.com' });
    await expect(email).toHaveAttribute('href', 'mailto:tiizhad@gmail.com');
  });

  test('in-page nav anchors scroll to their sections', async ({ page }) => {
    await page.goto('/portfolio');
    await page.getByRole('link', { name: 'Projects', exact: true }).click();
    await expect(page).toHaveURL(/#projects$/);
    await page.getByRole('link', { name: 'Contact', exact: true }).click();
    await expect(page).toHaveURL(/#contact$/);
  });
});

// ── Entry points ──────────────────────────────────────────────────────────

test.describe('Portfolio entry points', () => {
  // The landing page nav only renders at >=768px — no mobile menu fallback exists yet.
  test.use({ viewport: { width: 1280, height: 800 } });

  test('landing page links to /portfolio', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'About creator', exact: true }).click();
    await expect(page).toHaveURL(/\/portfolio/);
  });

  test('starter-kit page links to /portfolio', async ({ page }) => {
    await page.goto('/starter-kit');
    await page.getByRole('link', { name: 'Portfolio', exact: true }).first().click();
    await expect(page).toHaveURL(/\/portfolio/);
  });
});
