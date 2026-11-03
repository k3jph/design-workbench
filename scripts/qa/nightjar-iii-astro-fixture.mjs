// Create the consumer-owned dashboard in a disposable Astro starter copy.
import {readFileSync,writeFileSync} from 'node:fs';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const [family,destination]=process.argv.slice(2);if(!['martlet','krigsvold'].includes(family)||!destination)throw Error('Pass martlet or krigsvold and a disposable Astro starter directory.');
const template=readFileSync(join(dirname(fileURLToPath(import.meta.url)),'fixtures/astro-clean-room-dashboard.astro'),'utf8');
const output=resolve(destination,'src/pages/clean-room-dashboard.astro');writeFileSync(output,template.replaceAll('__FAMILY__',family),{flag:'wx'});console.log(output);
