/**
 * Re-captures the project screenshots shown on /portfolio.
 *
 * Usage:
 *   npx nx serve job-mate     # in another terminal (local pages)
 *   node tools/capture-portfolio-shots.mjs
 *
 * Output: apps/job-mate/public/portfolio/*.png
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(repoRoot, 'apps/job-mate/public/portfolio');
mkdirSync(outDir, { recursive: true });

const shots = [
  { name: 'pulse', url: 'http://localhost:4200/', settleMs: 2500 },
  { name: 'starter-kit', url: 'http://localhost:4200/starter-kit', settleMs: 2500 },
  { name: 'moneycho', url: 'https://www.moneycho.com', settleMs: 4000 },
];

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 2,
  colorScheme: 'light',
});
const page = await context.newPage();

for (const shot of shots) {
  console.log(`Capturing ${shot.name} from ${shot.url}`);
  await page
    .goto(shot.url, { waitUntil: 'networkidle', timeout: 60_000 })
    .catch((error) => console.log(`networkidle timeout for ${shot.name}, continuing: ${error.message}`));
  await page.waitForTimeout(shot.settleMs);
  await page.screenshot({ path: resolve(outDir, `${shot.name}.png`) });
}

await browser.close();
console.log(`Done — screenshots written to ${outDir}`);
