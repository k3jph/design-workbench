import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {Client, StreamableHTTPClientTransport} from '@modelcontextprotocol/client';
import {createLanguageHttp} from '../mcp/http.mjs';
for(const family of ['martlet','krigsvold']) for(const mode of ['legacy',{pin:'2026-07-28'}]) {
  test(`${family}: HTTP ${typeof mode==='string'?mode:mode.pin} retrieves the same isolated canonical knowledge`, async()=>{
    const catalog=JSON.parse(await readFile(`mcp/catalogs/${family}.json`,'utf8'));
    const handler=createLanguageHttp(catalog);
    const client=new Client({name:'independent-http-consumer',version:'1.0.0'},{mode});
    const transport=new StreamableHTTPClientTransport(new URL('https://language.test/mcp'),{fetch:async(input,init)=>handler.fetch(new Request(input,init))});
    try {
      await client.connect(transport);
      const tools=(await client.listTools()).tools;
      assert.equal(tools.length,3);assert.ok(tools.every(t=>t.annotations.readOnlyHint));
      const call=async(name,args={})=>{const raw=await client.callTool({name,arguments:args});return {raw,value:JSON.parse(raw.content[0].text)};};
      const manifest=(await call('get_manifest')).value;
      assert.equal(manifest.family,family);assert.equal(manifest.references.length,61);
      const found=(await call('search_guidance',{query:'validation form retained work'})).value;
      assert.ok(found.results.some(r=>r.id==='pattern:validated-form'));
      const astro=await call('search_guidance',{query:'Astro slots',kind:'platform'});assert.ok(!astro.raw.isError);assert.equal(astro.value.results[0].id,'platform:Astro');
      const reference=(await call('get_reference',{id:'pattern:validated-form'})).value;
      assert.equal(reference.family,family);
      assert.equal(createHash('sha256').update(reference.content).digest('hex'),reference.contentSha256);
      assert.equal((await call('get_reference',{id:'grammar',version:'nonexistent'})).raw.isError,true);
      assert.equal((await call('get_reference',{id:'../registry.sqlite'})).raw.isError,true);
      assert.equal((await client.callTool({name:'search_guidance',arguments:{query:'x',limit:99}})).isError,true);
      const resources=await client.listResources();assert.equal(resources.resources.length,61);
      assert.ok(resources.resources.every(r=>r.uri.startsWith(family+'://')));
    } finally {await client.close();await handler.close();}
  });
}
test('HTTP rejects unrelated browser origins and oversized bodies before tool execution',async()=>{
  const catalog=JSON.parse(await readFile('mcp/catalogs/martlet.json','utf8'));
  const handler=createLanguageHttp(catalog);
  try {
    assert.equal((await handler.fetch(new Request('https://language.test/mcp',{method:'POST',headers:{Origin:'https://unrelated.test'},body:'{}'}))).status,403);
    assert.equal((await handler.fetch(new Request('https://language.test/mcp',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json, text/event-stream'},body:'x'.repeat(32769)}))).status,413);
    for(const origin of ['https://claude.ai','https://martletdesign.dev','https://martlettheme.dev']) assert.equal((await handler.fetch(new Request('https://language.test/mcp',{method:'OPTIONS',headers:{Origin:origin}}))).status,204);
  } finally {await handler.close();}
});
for(const family of ['martlet','krigsvold']) test(`${family}: initialization rejects pathological icon validation while preserving bounded valid requests`,async()=>{
  const catalog=JSON.parse(await readFile(`mcp/catalogs/${family}.json`,'utf8'));
  const handler=createLanguageHttp(catalog);
  const headers={'Content-Type':'application/json',Accept:'application/json, text/event-stream',Origin:'https://chatgpt.com'};
  const initialize=(clientInfo)=>({jsonrpc:'2.0',id:42,method:'initialize',params:{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'bounded-test',version:'1',...clientInfo}}});
  const send=body=>handler.fetch(new Request('https://language.test/mcp',{method:'POST',headers,body:JSON.stringify(body)}));
  try {
    for(const clientInfo of [{icons:Array(10000).fill(0)},{icons:[{src:'https://example.test/icon.png',sizes:Array(10000).fill(0)}]}]) {
      const payload=initialize(clientInfo);assert.ok(Buffer.byteLength(JSON.stringify(payload))<32768);
      const response=await send(payload),text=await response.text();
      assert.equal(response.status,400);assert.ok(Buffer.byteLength(text)<1024,'invalid initialization response must remain bounded');
      assert.equal(response.headers.get('access-control-allow-origin'),'https://chatgpt.com');
      const json=JSON.parse(text);assert.equal(json.jsonrpc,'2.0');assert.equal(json.id,42);assert.equal(json.error.code,-32600);
    }
    const batch=Array.from({length:65},()=>initialize({icons:[0,0]}));
    const batchResponse=await send(batch),batchText=await batchResponse.text();assert.equal(batchResponse.status,400);assert.ok(batchText.length<1024);const batchError=JSON.parse(batchText);assert.equal(batchError.length,1);assert.equal(batchError[0].id,null);assert.equal(batchError[0].error.code,-32600);
    const valid=initialize({description:'x'.repeat(18000),icons:Array.from({length:120},()=>({src:'https://example.test/icon.png',sizes:['32x32','64x64']}))});
    assert.ok(Buffer.byteLength(JSON.stringify(valid))<32768);
    const response=await send(valid);assert.equal(response.status,200);const text=await response.text();assert.match(text,/protocolVersion/);
    const malformed=await send(initialize({icons:[0]}));assert.match(await malformed.text(),/"error"/,'an invalid short input must still be rejected');
    const stream=new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode('x'.repeat(32769)));controller.close();}});
    const oversized=await handler.fetch(new Request('https://language.test/mcp',{method:'POST',headers,body:stream,duplex:'half'}));assert.equal(oversized.status,413);
  } finally {await handler.close();}
});
