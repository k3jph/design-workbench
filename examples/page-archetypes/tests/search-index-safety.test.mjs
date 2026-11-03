import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {chromium} from '@playwright/test';

const root = resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const payload = '</script><script>window.__nightjarInjected = true</script>';

test('Jekyll search serializes authored text safely inside the JSON script', {timeout: 120000}, async () => {
  const temp = mkdtempSync(join(tmpdir(), 'nightjar-search-safety-'));
  let browser;
  try {
    const source = join(temp, 'source');
    const template = join(root, 'examples/jekyll/martlet');
    cpSync(template, source, {recursive:true, filter: path => !/(?:^|\/)(?:dist|_site|\.jekyll-cache|vendor)(?:\/|$)/.test(path)});
    const file = join(source, '_data/examples.json');
    const catalog = JSON.parse(readFileSync(file, 'utf8'));
    for (const field of ['title', 'summary', 'category']) catalog.pages[0][field] = payload;
    writeFileSync(file, JSON.stringify(catalog));
    const destination = join(temp, 'built');
    const build = spawnSync('bundle', ['exec','jekyll','build','--source',source,'--destination',destination], {cwd:source, encoding:'utf8'});
    assert.equal(build.status, 0, `Jekyll build failed: ${build.stderr}\n${build.stdout}`);
    const html = readFileSync(join(destination, 'examples/search/index.html'), 'utf8');
    browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {})});
    const page = await browser.newPage();
    await page.route('**/*', route => route.abort());
    await page.setContent(html, {waitUntil:'load'});
    const result = await page.evaluate(() => ({
      injected: window.__nightjarInjected === true,
      scripts: [...document.scripts].filter(script => script.textContent.includes('__nightjarInjected')).length,
      first: JSON.parse(document.querySelector('[data-search-index]').textContent)[0]
    }));
    assert.equal(result.injected, false, 'Fixture text must not escape the inert JSON element');
    assert.equal(result.scripts, 1, 'Fixture text must stay inside one JSON element');
    for (const field of ['title', 'summary', 'category']) assert.equal(result.first[field], payload);
  } finally {
    if (browser) await browser.close();
    rmSync(temp, {recursive:true, force:true});
  }
});
