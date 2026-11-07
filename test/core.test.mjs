import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolveTheme,coverUV,shuffle,validateCatalog,smooth} from '../src/core.js';
test('automatic theme changes at local 07:00 and 19:00',()=>{for(const [hour,expected] of [[6,'dark'],[7,'light'],[18,'light'],[19,'dark']])assert.equal(resolveTheme('auto',new Date(2026,0,1,hour)),expected);assert.equal(resolveTheme('dark',new Date(2026,0,1,12)),'dark');});
test('framing keeps aspect ratio on ultrawide and portrait',()=>{assert.deepEqual(coverUV(3,1.5),[1,.5]);assert.deepEqual(coverUV(.75,1.5),[.5,1]);});
test('shuffle preserves catalog without modifying its source',()=>{let source=[1,2,3,4];let result=shuffle(source,()=>.2);assert.deepEqual(source,[1,2,3,4]);assert.deepEqual(result.slice().sort(),source);});
test('catalog requires image provenance',()=>{assert.throws(()=>validateCatalog([{file:'x.webp',title:'x'}]));assert.throws(()=>validateCatalog([]));});
test('transition endpoint continuity',()=>{assert.equal(smooth(-1),0);assert.equal(smooth(0),0);assert.equal(smooth(1),1);assert.equal(smooth(2),1);assert.equal(smooth(.5),.5);});
