import { test, expect } from './fixtures';

// ── Viewports ──────────────────────────────────────────────────────────────

const MOBILE = { width: 375, height: 812 };
const DESKTOP = { width: 1280, height: 800 };

// ── Landing page ─────────────────────────────────────────────────────────────

test.describe('Landing page — desktop nav', () => {
  test.use({ viewport: DESKTOP });

  test('nav links are visible, toggle button is hidden', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.mkt-nav-links')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Toggle navigation menu' })).toBeHidden();
  });
});

test.describe('Landing page — mobile nav', () => {
  test.use({ viewport: MOBILE });

  test('nav links are hidden, toggle button is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.mkt-nav-links')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Toggle navigation menu' })).toBeVisible();
  });

  test('clicking the toggle opens the mobile menu with both links', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
    const menu = page.locator('#mkt-mobile-menu');
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Features' })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'About creator' })).toBeVisible();
  });

  test('clicking the backdrop closes the mobile menu', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
    await expect(page.locator('#mkt-mobile-menu')).toBeVisible();
    await page.locator('.mkt-mobile-backdrop').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('#mkt-mobile-menu')).toBeHidden();
  });

  test('clicking a link in the mobile menu navigates and closes it', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
    await page.locator('#mkt-mobile-menu').getByRole('link', { name: 'About creator' }).click();
    await expect(page).toHaveURL(/\/portfolio/);
  });
});

// ── Starter kit page ─────────────────────────────────────────────────────────

test.describe('Starter kit page — desktop nav', () => {
  test.use({ viewport: DESKTOP });

  test('nav links are visible, toggle button is hidden', async ({ page }) => {
    await page.goto('/starter-kit');
    await expect(page.locator('.mkt-nav-links')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Toggle navigation menu' })).toBeHidden();
  });
});

test.describe('Starter kit page — mobile nav', () => {
  test.use({ viewport: MOBILE });

  test('nav links are hidden, toggle button is visible', async ({ page }) => {
    await page.goto('/starter-kit');
    await expect(page.locator('.mkt-nav-links')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Toggle navigation menu' })).toBeVisible();
  });

  test('clicking the toggle opens the mobile menu with all links', async ({ page }) => {
    await page.goto('/starter-kit');
    await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
    const menu = page.locator('#mkt-mobile-menu');
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Job Mate' })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Portfolio' })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Get the kit' })).toBeVisible();
  });

  test('clicking the backdrop closes the mobile menu', async ({ page }) => {
    await page.goto('/starter-kit');
    await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
    await expect(page.locator('#mkt-mobile-menu')).toBeVisible();
    await page.locator('.mkt-mobile-backdrop').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('#mkt-mobile-menu')).toBeHidden();
  });

  test('clicking a link in the mobile menu navigates and closes it', async ({ page }) => {
    await page.goto('/starter-kit');
    await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
    await page.locator('#mkt-mobile-menu').getByRole('link', { name: 'Portfolio' }).click();
    await expect(page).toHaveURL(/\/portfolio/);
  });
});
