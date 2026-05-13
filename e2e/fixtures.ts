import { test as base, Page } from '@playwright/test';

const SUPABASE_PROJECT = 'kmokerewodxljtywkwbi';

const FAKE_USER = {
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'authenticated',
  aud: 'authenticated',
  app_metadata: { provider: 'email' },
  user_metadata: {},
  created_at: '2024-01-01T00:00:00Z',
};

const FAKE_SESSION = {
  access_token: 'fake-access-token',
  refresh_token: 'fake-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: FAKE_USER,
};

async function mockAuth(page: Page): Promise<void> {
  // Inject a valid session into localStorage before the app boots
  await page.addInitScript(
    ({ key, session }) => {
      localStorage.setItem(key, JSON.stringify(session));
    },
    { key: `sb-${SUPABASE_PROJECT}-auth-token`, session: FAKE_SESSION },
  );

  // Mock all Supabase auth API calls
  await page.route(`**/${SUPABASE_PROJECT}**/auth/v1/**`, route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(FAKE_SESSION),
    });
  });

  // Mock all Supabase DB/REST API calls with empty arrays so stores don't crash
  await page.route(`**/${SUPABASE_PROJECT}**/rest/v1/**`, route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });
}

export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page }, use) => {
    await mockAuth(page);
    await use(page);
  },
});

export { expect } from '@playwright/test';
