// Exercise native validation and keyboard recovery against all three root-path builds.
// Build fixtures using the cross-framework instructions in DASHBOARDS.md.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname, resolve} from 'node:path';
import {chromium} from '@playwright/test';

const roots = {jekyll: process.env.NIGHTJAR_JEKYLL_ROOT, astro: process.env.NIGHTJAR_ASTRO_ROOT || 'examples/astro-slice/dist', react: process.env.NIGHTJAR_REACT_ROOT || 'examples/react-catalog/dist'};
if (!roots.jekyll) throw Error('Set NIGHTJAR_JEKYLL_ROOT; see DASHBOARDS.md.');
async function serve(root) {
  const server = createServer(async (req, res) => {
    const path = new URL(req.url, 'http://localhost').pathname, name = decodeURIComponent(path.slice(1));
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
const browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {})});
try {
  for (const family of ['martlet','krigsvold']) for (const framework of ['jekyll','astro','react']) {
    const server = await serve(resolve(roots[framework],family));
    const origin = `http://127.0.0.1:${server.address().port}`;
    try {
      const context = await browser.newContext(), page = await context.newPage(), writes = [], errors = [];
      page.on('request', request => {if (request.method() !== 'GET') writes.push(request.url());});
      page.on('pageerror', error => errors.push(error.message));
      for (const route of ['sign-in','two-factor']) {
        await page.goto(`${origin}/examples/${route}/`, {waitUntil:'networkidle'});
        const form = page.locator('form[data-demo-form]');
        const submit = form.getByRole('button', {name:'Validate example'});
        const status = form.getByRole('status');
        const secret = form.getByLabel(route === 'sign-in' ? 'Example password' : 'Six-digit example code');
        const first = route === 'sign-in' ? form.getByLabel('Email address') : secret;
        const helpId = await secret.getAttribute('aria-describedby');
        assert.ok(helpId && (await page.locator(`[id="${helpId}"]`).textContent()).trim(), 'format help is linked to its input');
        await submit.focus(); await page.keyboard.press('Enter');
        assert.ok(await first.evaluate(node => document.activeElement === node && !node.validity.valid && !!node.validationMessage), `${family} ${framework} ${route}: keyboard validation focuses first invalid field`);
        assert.equal(await status.textContent(), '');
        if (route === 'sign-in') {
          await first.fill('invalid-address');
          await submit.focus(); await page.keyboard.press('Enter');
          assert.ok(await first.evaluate(node => document.activeElement === node && node.validity.typeMismatch && !!node.validationMessage), 'invalid email receives native validation focus');
          await first.fill('invented@example.invalid');
        }
        await secret.fill(route === 'sign-in' ? 'invented-password' : '123456');
        await submit.focus(); await page.keyboard.press('Enter');
        assert.match(await status.textContent(), /Example validated locally/);
        assert.equal(await secret.inputValue(), '', 'secret is cleared after success');
        await submit.focus(); await page.keyboard.press('Enter');
        assert.ok(await secret.evaluate(node => document.activeElement === node && node.validity.valueMissing && !!node.validationMessage), `${family} ${framework} ${route}: repeat validation focuses cleared secret`);
        assert.equal(await status.textContent(), '', 'an invalid resubmission must clear stale success');
        await secret.fill(route === 'sign-in' ? 'another-invented-password' : '654321');
        await submit.focus(); await page.keyboard.press('Enter');
        assert.match(await status.textContent(), /Example validated locally/);
        await form.getByRole('button', {name:'Clear'}).focus(); await page.keyboard.press('Enter');
        assert.equal(await status.textContent(), '');
      }
      assert.deepEqual(writes, []); assert.deepEqual(errors, []);
      await context.close();
      const nojs = await browser.newContext({javaScriptEnabled:false}), staticPage = await nojs.newPage();
      await staticPage.goto(`${origin}/examples/sign-in/`);
      assert.ok(await staticPage.getByRole('button', {name:'Validate example'}).isDisabled());
      await nojs.close();
      console.log(`${family} ${framework}: keyboard validation, repeat submission, recovery and no-JS passed`);
    } finally {server.closeAllConnections(); await new Promise(resolve => server.close(resolve));}
  }
} finally {await browser.close();}
