// Render the preproduction boards as PNG:  node films/that-one-friend/tools/boards.mjs [id ...]   (run from the library root)
import path from 'path'; import fs from 'fs'; import { fileURLToPath, pathToFileURL } from 'url';
const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.env.OUT || path.resolve(HERE, '..', 'out');   // generated files go outside demo/
const LIB = process.env.LIB || process.cwd();
const { openDemo, closeServer } = await import(pathToFileURL(path.join(LIB, 'core/render/page.mjs')).href);
const want = process.argv.slice(2).filter(a => !a.startsWith('--'));
const outDir = path.join(OUT, 'preproduction'); fs.mkdirSync(outDir, { recursive: true });
let { browser, page } = await openDemo(HERE, { w: 400, h: 400, q: 'boards=1' });
const list = await page.evaluate(() => window.FRAME_LIST); await browser.close();
for (const f of list) {
  if (want.length && !want.includes(f.id)) continue;
  const t0 = Date.now();
  ({ browser, page } = await openDemo(HERE, { w: f.w, h: f.h, q: 'frame=' + f.id }));
  await page.evaluate(t => window.render(t), f.t);
  const out = path.join(outDir, f.file + '.png');
  await page.screenshot({ path: out, type: 'png' }); await browser.close();
  console.log(out, `${f.w}x${f.h}`, Date.now() - t0 + 'ms');
}
closeServer();
