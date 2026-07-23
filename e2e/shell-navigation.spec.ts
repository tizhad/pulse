import { test, expect } from './fixtures';

// ── Viewports ──────────────────────────────────────────────────────────────

const MOBILE = { width: 375, height: 812 };
const TABLET = { width: 768, height: 1024 };
const DESKTOP = { width: 1280, height: 800 };

const SHELL_ROUTE = '/dashboard';

// Scoped helpers so duplicate link text elsewhere on the page doesn't confuse selectors
const navLink = (page: ReturnType<typeof require>, name: RegExp) =>
  page.locator('aside.sidebar nav').getByRole('link', { name, exact: false });

// ── Desktop layout ─────────────────────────────────────────────────────────

test.describe('Desktop layout', () => {
  test.use({ viewport: DESKTOP });

  test('sidebar is always visible on load', async ({ authedPage: page }) => {
    await page.goto(SHELL_ROUTE);
    await expect(page.locator('aside.sidebar')).toBeVisible();
  });

  test('mobile top bar is hidden on desktop', async ({ authedPage: page }) => {
    await page.goto(SHELL_ROUTE);
    await expect(page.locator('.mobile-header')).toBeHidden();
  });

  test('hamburger button is not visible on desktop', async ({ authedPage: page }) => {
    await page.goto(SHELL_ROUTE);
    await expect(page.getByRole('button', { name: 'Toggle menu' })).toBeHidden();
  });

  test('all nav links are visible', async ({ authedPage: page }) => {
    await page.goto(SHELL_ROUTE);
    const nav = page.locator('aside.sidebar nav');
    await expect(nav.getByRole('link', { name: 'Dashboard', exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Subjects', exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Companies', exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Applications', exact: true })).toBeVisible();
  });

  test('clicking nav links navigates correctly', async ({ authedPage: page }) => {
    await page.goto(SHELL_ROUTE);
    const nav = page.locator('aside.sidebar nav');
    await nav.getByRole('link', { name: 'Subjects', exact: true }).click();
    await expect(page).toHaveURL(/\/subjects/);
    await nav.getByRole('link', { name: 'Applications', exact: true }).click();
    await expect(page).toHaveURL(/\/applications/);
    await nav.getByRole('link', { name: 'Companies', exact: true }).click();
    await expect(page).toHaveURL(/\/companies/);
  });

  test('sidebar does not have .open class on desktop', async ({ authedPage: page }) => {
    await page.goto(SHELL_ROUTE);
    await expect(page.locator('aside.sidebar')).not.toHaveClass(/open/);
  });
});

// ── Mobile layout ──────────────────────────────────────────────────────────

test.describe('Mobile — sidebar closed by default', () => {
  test.use({ viewport: MOBILE });

  test('sidebar is hidden off-screen on load', async ({ authedPage: page }) => {
    await page.goto(SHELL_ROUTE);
    const sidebar = page.locator('aside.sidebar');
    await expect(sidebar).not.toHaveClass(/open/);
    const box = await sidebar.boundingBox();
    expect(box === null || box.x + box.width <= 0).toBeTruthy();
  });

  test('mobile top bar is visible', async ({ authedPage: page }) => {
    await page.goto(SHELL_ROUTE);
    await expect(page.locator('.mobile-header')).toBeVisible();
  });

  test('hamburger button is visible', async ({ authedPage: page }) => {
    await page.goto(SHELL_ROUTE);
    await expect(page.getByRole('button', { name: 'Toggle menu' })).toBeVisible();
  });

  test('sidebar does not overlap content on load', async ({ authedPage: page }) => {
    await page.goto(SHELL_ROUTE);
    const box = await page.locator('aside.sidebar').boundingBox();
    expect(box === null || box.x + box.width <= 0).toBeTruthy();
  });

  test('content fills full viewport width when sidebar is closed', async ({ authedPage: page }) => {
    await page.goto(SHELL_ROUTE);
    const contentBox = await page.locator('main.content').boundingBox();
    if (contentBox) {
      expect(contentBox.width).toBeGreaterThan(MOBILE.width * 0.9);
    }
  });

  test('clicking hamburger opens sidebar', async ({ authedPage: page }) => {
    await page.goto(SHELL_ROUTE);
    await page.getByRole('button', { name: 'Toggle menu' }).click();
    await expect(page.locator('aside.sidebar')).toHaveClass(/open/);
  });

  test('backdrop is present when sidebar is open', async ({ authedPage: page }) => {
    await page.goto(SHELL_ROUTE);
    await page.getByRole('button', { name: 'Toggle menu' }).click();
    await expect(page.locator('.sidebar-backdrop')).toBeVisible();
  });

  test('backdrop is absent when sidebar is closed', async ({ authedPage: page }) => {
    await page.goto(SHELL_ROUTE);
    await expect(page.locator('.sidebar-backdrop')).toHaveCount(0);
  });

  test('clicking backdrop closes sidebar', async ({ authedPage: page }) => {
    await page.goto(SHELL_ROUTE);
    await page.getByRole('button', { name: 'Toggle menu' }).click();
    await page.locator('.sidebar-backdrop').click();
    await expect(page.locator('aside.sidebar')).not.toHaveClass(/open/);
  });

  test('clicking hamburger again closes sidebar', async ({ authedPage: page }) => {
    await page.goto(SHELL_ROUTE);
    await page.getByRole('button', { name: 'Toggle menu' }).click();
    await expect(page.locator('aside.sidebar')).toHaveClass(/open/);
    await page.getByRole('button', { name: 'Toggle menu' }).click();
    await expect(page.locator('aside.sidebar')).not.toHaveClass(/open/);
  });

  test('clicking a nav link closes sidebar and navigates', async ({ authedPage: page }) => {
    await page.goto(SHELL_ROUTE);
    await page.getByRole('button', { name: 'Toggle menu' }).click();
    await expect(page.locator('aside.sidebar')).toHaveClass(/open/);
    await page.locator('aside.sidebar nav').getByRole('link', { name: 'Subjects', exact: true }).click();
    await expect(page).toHaveURL(/\/subjects/);
    await expect(page.locator('aside.sidebar')).not.toHaveClass(/open/);
  });
});

// ── Tablet layout ──────────────────────────────────────────────────────────

test.describe('Tablet — same as mobile', () => {
  test.use({ viewport: TABLET });

  test('sidebar is hidden by default at 768px', async ({ authedPage: page }) => {
    await page.goto(SHELL_ROUTE);
    await expect(page.locator('aside.sidebar')).not.toHaveClass(/open/);
    const box = await page.locator('aside.sidebar').boundingBox();
    expect(box === null || box.x + box.width <= 0).toBeTruthy();
  });

  test('mobile header is visible at tablet width', async ({ authedPage: page }) => {
    await page.goto(SHELL_ROUTE);
    await expect(page.locator('.mobile-header')).toBeVisible();
  });

  test('hamburger opens sidebar on tablet', async ({ authedPage: page }) => {
    await page.goto(SHELL_ROUTE);
    await page.getByRole('button', { name: 'Toggle menu' }).click();
    await expect(page.locator('aside.sidebar')).toHaveClass(/open/);
  });
});

// ── Breakpoint boundary ────────────────────────────────────────────────────

test.describe('Breakpoint boundary', () => {
  test('at 768px sidebar uses mobile behaviour', async ({ authedPage: page }) => {
    await page.setViewportSize({ width: 768, height: 800 });
    await page.goto(SHELL_ROUTE);
    await expect(page.locator('.mobile-header')).toBeVisible();
    const box = await page.locator('aside.sidebar').boundingBox();
    expect(box === null || box.x + box.width <= 0).toBeTruthy();
  });

  test('at 769px sidebar is always visible without hamburger', async ({ authedPage: page }) => {
    await page.setViewportSize({ width: 769, height: 800 });
    await page.goto(SHELL_ROUTE);
    await expect(page.locator('.mobile-header')).toBeHidden();
    await expect(page.locator('aside.sidebar')).toBeVisible();
  });
});

// ── Accessibility ──────────────────────────────────────────────────────────

test.describe('Accessibility', () => {
  test.use({ viewport: MOBILE });

  test('hamburger has an accessible aria-label', async ({ authedPage: page }) => {
    await page.goto(SHELL_ROUTE);
    await expect(
      page.getByRole('button', { name: 'Toggle menu' })
    ).toHaveAttribute('aria-label', 'Toggle menu');
  });

  test('all sidebar nav links are reachable after opening', async ({ authedPage: page }) => {
    await page.goto(SHELL_ROUTE);
    await page.getByRole('button', { name: 'Toggle menu' }).click();
    const links = page.locator('aside.sidebar nav a');
    await expect(links).toHaveCount(7);
    for (const link of await links.all()) {
      await expect(link).toBeVisible();
    }
  });
});
