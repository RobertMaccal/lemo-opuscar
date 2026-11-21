// Headless Chromium page that runs index.html?render=1 and exposes renderFrame(f).
import { createRequire } from 'module';
import { serve } from './server.js';

async function loadChromium() {
  try { return (await import('playwright')).chromium; } catch {}
  const req = createRequire(import.meta.url);
  for (const name of ['playwright', 'playwright-core']) {
    try { return req(name).chromium; } catch {}
    for (const base of (process.env.NODE_PATH || '').split(':').filter(Boolean)) {
      try { return createRequire(base + '/')(name).chromium; } catch {}
    }
  }
  throw new Error('Playwright not found: run `npm install` in this folder (or install playwright globally).');
}

let srv = null;
export async function openRenderPage(seed) {
  if (!srv) srv = await serve(0);
  const chromium = await loadChromium();
  const exe = process.env.PLAYWRIGHT_CHROME;
  const browser = await chromium.launch({ ...(exe ? { executablePath: exe } : {}), args: ['--font-render-hinting=none', '--force-color-profile=srgb', '--disable-lcd-text'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => { console.error('[pageerror]', e.message); process.exit(1); });
  page.on('console', (m) => { if (m.type() === 'error') console.error('[page]', m.text()); });
  await page.goto(`http://127.0.0.1:${srv.port}/index.html?render=1&seed=${seed}`);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 120000 });
  const info = await page.evaluate(() => window.BAKE_INFO);
  return { browser, page, info };
}
export function closeServer() { if (srv) { srv.server.close(); srv = null; } }
