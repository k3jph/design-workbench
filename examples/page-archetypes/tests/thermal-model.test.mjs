import test from 'node:test';
import assert from 'node:assert/strict';
import {thermalModel,thermalDefaults,thermalCsv,thermalNumber} from '../jekyll/assets/js/thermal-model.mjs';
test('thermal model follows the exponential response and endpoints',()=>{
 const {errors,rows}=thermalModel(thermalDefaults);assert.deepEqual(errors,{});assert.equal(rows.length,6);assert.equal(rows[0].temperature,80);assert.equal(rows[0].minutes,0);assert.equal(rows.at(-1).minutes,10);assert.ok(Math.abs(rows[2].temperature-(20+60/Math.E))<1e-12);assert.ok(rows.every((row,index)=>index===0||row.temperature<rows[index-1].temperature));
});
test('heating and equilibrium remain stable',()=>{
 const heating=thermalModel({...thermalDefaults,initial:'0',ambient:'100'}).rows;assert.ok(heating.at(-1).temperature>heating[0].temperature);assert.ok(heating.at(-1).temperature<100);
 assert.ok(thermalModel({...thermalDefaults,initial:'20',ambient:'20'}).rows.every(row=>row.temperature===20));
});
test('invalid, non-finite and physically unsupported values cannot produce results',()=>{
 for(const [key,value] of [['initial',''],['initial','0x10'],['ambient','-273.16'],['initial','1001'],['timeConstant','0'],['timeConstant','Infinity'],['duration','0.049'],['duration','10001'],['duration','NaN']]){const result=thermalModel({...thermalDefaults,[key]:value});assert.ok(result.errors[key],`${key}=${value}`);assert.deepEqual(result.rows,[]);}
 assert.deepEqual(thermalModel({...thermalDefaults,initial:'-273.15',duration:'0.05'}).errors,{});
});
test('export uses the same rounded numbers as the table',()=>{
 const rows=thermalModel(thermalDefaults).rows;const csv=thermalCsv(rows).split('\r\n');assert.equal(csv.length,7);for(let i=0;i<6;i++)assert.equal(csv[i+1],`${thermalNumber(rows[i].minutes)},${thermalNumber(rows[i].temperature)}`);assert.equal(thermalNumber(-0.001),'0.00');
});
