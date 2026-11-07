// Lossless thumbnail capture: node tools/thumb_png.cjs <W> <H> <out.png> [variant t]   (run from the project folder)
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const [w, h, out, t = '0'] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
  p.on('pageerror', e => { console.error(e); process.exit(1); });
  await p.goto('file://' + path.resolve('thumb/index.html'));
  await p.waitForFunction('window.READY === true', null, { timeout: 60000 });
  await p.evaluate(t => window.render(+t), t);
  await p.screenshot({ path: out, type: 'png' });
  await b.close(); console.log(out);
})();
