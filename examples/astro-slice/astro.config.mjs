import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
const family = process.env.NIGHTJAR_FAMILY;
if (!['martlet', 'krigsvold'].includes(family)) throw new Error('Set NIGHTJAR_FAMILY to martlet or krigsvold');
const component = family === 'martlet' ? 'Martlet' : 'Krigsvold';
export default defineConfig({ base: process.env.NIGHTJAR_BASE || '/', outDir: `./dist/${family}`, vite: {build: {assetsInlineLimit: 0}, resolve: {alias: {'@nightjar/shell': fileURLToPath(new URL(`./src/components/${component}.astro`, import.meta.url)), '@nightjar/button': `@${family}/astro/Button.astro`}}} });
