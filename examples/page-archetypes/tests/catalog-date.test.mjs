import {test} from 'node:test';
import assert from 'node:assert/strict';
import {formatCatalogDate} from '../lib/catalog-date.mjs';
test('catalog dates format valid UTC days and reject invalid or unsafe text',()=>{
 assert.equal(formatCatalogDate('2026-10-28'),'Oct 28, 2026');
 assert.equal(formatCatalogDate('2024-02-29','long'),'February 29, 2024');
 for(const value of ['2026-02-31','2026-13-01','2026-2-01','0000-01-01','<img src=x>'])assert.equal(formatCatalogDate(value),null);
});
