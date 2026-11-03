import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url));
export default defineConfig(({mode})=>({root,base:process.env.NIGHTJAR_BASE||'/',plugins:[{name:'react-family',resolveId(id){if(id==='catalog-family')return '\0catalog-family';},load(id){if(id==='\0catalog-family')return `export * from '@${mode}/react'; import '@${mode}/react/styles.css'; import '@${mode}/theme/fonts.css'; export const family='${mode}';`;}}],build:{outDir:`${root}/analytics-dist/${mode}`,emptyOutDir:true,rollupOptions:{input:`${root}/dashboard-test.html`},assetsInlineLimit:0}}));
