import { createMcpHandler } from '@modelcontextprotocol/server';
import { CfWorkerJsonSchemaValidator } from '@modelcontextprotocol/server/validators/cf-worker';
import { createLanguageServer } from './language.mjs';

const REQUEST_LIMIT = 32768;
// The SDK validates these arrays before dispatch and may emit one issue per
// item. Bound aggregate metadata in a batch, not the size of unrelated data.
const MAX_INITIALIZE_ICONS = 128;
const MAX_INITIALIZE_ICON_SIZES = 256;

async function excessiveInitializationIcons(request) {
  if (request.method !== 'POST' || !request.body) return null;
  const type = request.headers.get('content-type')?.split(';',1)[0].trim().toLowerCase();
  const accept = request.headers.get('accept') || '';
  if (type !== 'application/json' || !accept.includes('application/json') || !accept.includes('text/event-stream')) return null;
  const reader = request.clone().body.getReader(), chunks = [];
  let length = 0;
  try {
    while (true) {
      const {value,done} = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > REQUEST_LIMIT) { void reader.cancel().catch(()=>{}); return null; }
      chunks.push(value);
    }
  } catch { return null; }
  const bytes = new Uint8Array(length);let position = 0;
  for (const chunk of chunks) { bytes.set(chunk,position); position += chunk.byteLength; }
  let body;try { body = JSON.parse(new TextDecoder().decode(bytes)); } catch { return null; }
  const messages = Array.isArray(body) ? body : [body];let icons = 0, sizes = 0;
  for (const message of messages) {
    if (!message || typeof message !== 'object' || message.method !== 'initialize') continue;
    const list = message.params?.clientInfo?.icons;
    if (!Array.isArray(list)) continue;
    icons += list.length;
    if (icons > MAX_INITIALIZE_ICONS) return {message,batch:Array.isArray(body)};
    for (const icon of list) {
      if (icon && typeof icon === 'object' && Array.isArray(icon.sizes)) sizes += icon.sizes.length;
      if (sizes > MAX_INITIALIZE_ICON_SIZES) return {message,batch:Array.isArray(body)};
    }
  }
  return null;
}

// The same registration factory serves stdio and HTTP. No registry or user data.
export function createLanguageHttp(catalog) {
  const handler = createMcpHandler(() => createLanguageServer(catalog, {
    jsonSchemaValidator: new CfWorkerJsonSchemaValidator(),
  }), { legacy: 'stateless', responseMode: 'auto', maxRequestBodySize: REQUEST_LIMIT });
  return {
    async fetch(request) {
      const origin = request.headers.get('origin');
      const languageOrigins=[catalog.distribution.mcp.url,...(catalog.distribution.mcp.aliases??[])].map(value=>new URL(value).origin);
      const allowed = [new URL(request.url).origin,...languageOrigins, 'https://chatgpt.com', 'https://claude.ai'];
      if (origin && !allowed.includes(origin)) return new Response('Origin not allowed', {status:403});
      if (request.method === 'OPTIONS') return new Response(null, {status:204, headers:{
        'Access-Control-Allow-Origin': origin || new URL(request.url).origin,
        'Access-Control-Allow-Methods':'POST, GET, DELETE, OPTIONS',
        'Access-Control-Allow-Headers':'Content-Type, Accept, MCP-Protocol-Version, MCP-Session-Id',
        'Vary':'Origin',
      }});
      const excessive = await excessiveInitializationIcons(request);
      let response;
      if (excessive) {
        const id = !excessive.batch && (typeof excessive.message.id === 'string' || typeof excessive.message.id === 'number') ? excessive.message.id : null;
        const error = {jsonrpc:'2.0',id,error:{code:-32600,message:'Initialization icon metadata exceeds the validation limit.'}};
        response = Response.json(excessive.batch ? [error] : error,{status:400});
        void request.body?.cancel().catch(()=>{});
      } else response = await handler.fetch(request);
      const headers = new Headers(response.headers);
      headers.set('Cache-Control','no-store');
      headers.set('X-Content-Type-Options','nosniff');
      if(origin) headers.set('Access-Control-Allow-Origin',origin);
      headers.set('Vary','Origin');
      return new Response(response.body,{status:response.status,headers});
    },
    close: handler.close,
  };
}
