// Static reference delivery only. Archive writes require a separate, disabled service.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/_archive' || url.pathname.startsWith('/_archive/')) {
      return new Response('Advanced archive service is disabled.\n', {status: 404, headers: {'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store'}});
    }
    if (!['GET', 'HEAD'].includes(request.method)) {
      return new Response('Method not allowed.\n', {status: 405, headers: {allow: 'GET, HEAD'}});
    }
    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    headers.set('x-content-type-options', 'nosniff');
    headers.set('referrer-policy', 'strict-origin-when-cross-origin');
    return new Response(response.body, {status: response.status, statusText: response.statusText, headers});
  }
};
