// Verify that unresolved rendering conditions stay explicit in the evidence.
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {captureIncompleteTargets} from './contrast-incomplete-evidence.mjs';
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
try{
 const page=await browser.newPage({viewport:{width:320,height:240}});
 await page.setContent(`<style>body{background:rgb(255,255,255)} .clip{width:20px;overflow:hidden}.wide{display:block;width:100px}.half{opacity:.5}.gradient{background:linear-gradient(red,blue)} #hidden{display:none}.fixed{position:fixed;bottom:0;left:0}</style><p id="solid" style="color:rgb(1,2,3)">Solid</p><div class="clip"><span class="wide" id="clipped">Clipped</span></div><div class="half"><span id="opacity">Opacity</span></div><div class="gradient"><span id="gradient">Gradient</span></div><p id="hidden">Hidden</p><svg><text id="axis" x="5" y="20">Axis</text></svg><i class="many">One</i><i class="many">Two</i><div class="fixed"><span id="fixed">Fixed overlay</span></div>`);
 const selectors=['#solid','#clipped','#opacity','#gradient','#hidden','#axis','.many','#missing','#fixed'];
 const records=await captureIncompleteTargets(page,selectors.map(selector=>[selector]));
 assert.equal(records[0].matches[0].foreground,'rgb(1, 2, 3)');assert.equal(records[0].matches[0].background,'rgb(255, 255, 255)');assert.equal(records[0].matches[0].font.size,'16px');
 assert.equal(records[1].matches[0].background,null);assert.ok(records[1].matches[0].unknown.includes('ancestor_clipped'));assert.equal(records[2].matches[0].background,null);assert.ok(records[2].matches[0].unknown.includes('opacity_requires_compositing'));
 assert.equal(records[3].matches[0].background,null);assert.ok(records[3].matches[0].unknown.includes('gradient_or_image_background'));
 assert.ok(records[4].matches[0].unknown.includes('not_rendered'));assert.ok(records[5].matches[0].unknown.includes('svg_paint_overlap_not_evaluated'));
 assert.equal(records[6].matches.length,2);assert.ok(records[6].unknown.includes('selector_matches_multiple_elements'));assert.ok(records[7].unknown.includes('selector_did_not_match'));assert.equal(records[8].matches[0].background,null);assert.ok(records[8].matches[0].unknown.includes('positioned_transparent_backdrop_not_evaluated'));assert.ok(records[8].matches[0].hitStack.length>0);
 await page.evaluate(()=>{const r=document.querySelector('#solid').getBoundingClientRect(),cover=document.createElement('div');Object.assign(cover.style,{position:'fixed',left:`${r.left}px`,top:`${r.top}px`,width:`${r.width}px`,height:`${r.height}px`,zIndex:'999',background:'rgb(0,0,0)'});document.body.append(cover)});
 const [covered]=await captureIncompleteTargets(page,[['#solid']]);assert.equal(covered.matches[0].background,null);assert.ok(covered.matches[0].unknown.includes('overlapping_paint_not_evaluated'));
 console.log('Computed foreground/background and gradient, clipping, opacity, hidden, SVG and selector ambiguity evidence passed.');
}finally{await browser.close()}
