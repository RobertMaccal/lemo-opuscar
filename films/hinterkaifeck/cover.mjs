// Render the Reels cover as a lossless PNG:  node films/hinterkaifeck/cover.mjs [out.png]
import path from 'node:path';
import { openDemo, closeServer } from '../../core/render/page.mjs';
const dir = path.dirname(new URL(import.meta.url).pathname), out = process.argv[2] || path.join(dir, 'out/cover.png');
const { browser, page } = await openDemo(dir, { w: 1080, h: 1920, q: 'thumb=1' });
await page.evaluate(() => window.render(3.3));
await page.screenshot({ path: out, type: 'png' }); console.log(out);
await browser.close(); closeServer();
