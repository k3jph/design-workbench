// Compare the source reading hierarchy and form sizing across built examples.
// See READING-VERIFICATION.md for fixture build instructions.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname, resolve} from 'node:path';
import {chromium} from '@playwright/test';

const roots = {jekyll: process.env.NIGHTJAR_JEKYLL_ROOT, astro: process.env.NIGHTJAR_ASTRO_ROOT || 'examples/astro-slice/dist', react: process.env.NIGHTJAR_REACT_ROOT || 'examples/react-catalog/dist'};
if (!roots.jekyll) throw Error('Set NIGHTJAR_JEKYLL_ROOT; see READING-VERIFICATION.md.');
const routes = [['article', 'Return to the same place'], ['documentation', 'Start here'], ['contact', 'Find the right route'], ['sign-up', 'Try the form']];
async function serve(root) {
  const server = createServer(async (req, res) => {
    const path = new URL(req.url, 'http://localhost').pathname;
    const name = decodeURIComponent(path.slice(1));
    const file = resolve(root, name.endsWith('/') ? `${name}index.html` : name);
    if (!file.startsWith(root + '/')) return res.writeHead(403).end();
    try {
      const types = {'.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.mjs':'text/javascript', '.woff':'font/woff', '.woff2':'font/woff2', '.svg':'image/svg+xml'};
      const bytes = await readFile(file);
      res.writeHead(200, {'Content-Type': types[extname(file)] || 'application/octet-stream'}).end(bytes);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return server;
}
const browser = await chromium.launch({headless: true, ...(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {})});
try {
  for (const family of ['martlet', 'krigsvold']) for (const framework of ['jekyll', 'astro', 'react']) {
    const server = await serve(resolve(roots[framework], family));
    const origin = `http://127.0.0.1:${server.address().port}`;
    try {
      for (const width of [320, 1440]) {
        const context = await browser.newContext({viewport: {width, height: 900}});
        const page = await context.newPage(), errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
        for (const [route, label] of routes) {
          await page.goto(`${origin}/examples/${route}/`, {waitUntil: 'networkidle'});
          await page.evaluate(() => document.fonts.ready);
          const style = locator => locator.evaluate(node => { const s = getComputedStyle(node); return {family: s.fontFamily, size: parseFloat(s.fontSize), weight: s.fontWeight}; });
          const h1 = await style(page.locator('h1'));
          const h2 = await style(page.getByRole('heading', {name: label, exact: true}));
          assert.match(h1.family, family === 'martlet' ? /Cambo/ : /Roboto Slab/, `${family} ${framework} ${route} h1 family`);
          assert.match(h2.family, family === 'martlet' ? /Cambo/ : /^Roboto,/, `${family} ${framework} ${route} h2 family`);
          const expectedH1 = width === 320 ? 32 : family === 'martlet' ? 79.2 : 86.4;
          assert.ok(Math.abs(h1.size - expectedH1) < 0.2, `${family} ${framework} ${route} h1 ${h1.size}`);
          assert.ok(Math.abs(h2.size - (width === 320 ? 24 : 32)) < 0.2, `${family} ${framework} ${route} h2 ${h2.size}`);
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${family} ${framework} ${route} ${width} overflow`);
          if (route === 'contact' || route === 'sign-up') {
            const field = page.getByRole('textbox', {name: 'Email address', exact: true});
            assert.ok((await style(field)).size >= 16, `${family} ${framework} ${route} field text`);
          }
        }
        assert.deepEqual(errors, []);
        await context.close();
      }
      if (framework !== 'jekyll') {
        const context = await browser.newContext({viewport: {width: 320, height: 900}}), page = await context.newPage();
        await page.goto(`${origin}/examples/contact/`, {waitUntil: 'networkidle'});
        await page.evaluate(() => document.documentElement.style.fontSize = '200%');
        const field = page.getByRole('textbox', {name: 'Email address', exact: true});
        assert.equal(await field.evaluate(node => parseFloat(getComputedStyle(node).fontSize)), 32);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${family} ${framework} scaled contact overflow`);
        await context.close();
      }
      const nojs = await browser.newContext({javaScriptEnabled: false, viewport: {width: 320, height: 900}});
      const staticPage = await nojs.newPage();
      await staticPage.goto(`${origin}/examples/contact/`, {waitUntil: 'load'});
      assert.ok(await staticPage.getByRole('textbox', {name: 'Email address', exact: true}).isDisabled());
      assert.ok(await staticPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${family} ${framework} no-JS overflow`);
      await nojs.close();
      console.log(`${family} ${framework}: reading hierarchy, responsive layout and form sizing passed`);
    } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  }
} finally { await browser.close(); }
