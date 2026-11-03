// Static delivery only. Archive writes require a separate, disabled service.
// React compatibility is a literal build-time option, never a runtime binding.
export function createReferenceWorker({legacyQueryReference=false}={}) {
  if(typeof legacyQueryReference!=='boolean')throw new Error('legacyQueryReference must be a build-time boolean');
  return {
    async fetch(request, env) {
      const url = new URL(request.url);
      if (url.pathname === '/_archive' || url.pathname.startsWith('/_archive/')) {
        return new Response('Advanced archive service is disabled.\n', {status: 404, headers: {'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store'}});
      }
      if (!['GET', 'HEAD'].includes(request.method)) {
        return new Response('Method not allowed.\n', {status: 405, headers: {allow: 'GET, HEAD'}});
      }
      // Preserve React's former component-directory root with or without selectors.
      // Query-bearing examples and other frameworks retain normal asset routing.
      const root = ['/', '/index.html'].includes(url.pathname) ? '/' : ['/preview', '/preview/', '/preview/index.html'].includes(url.pathname) ? '/preview/' : null;
      if (legacyQueryReference && root) {
        const target = new URL(url);
        target.pathname = root + 'reference/';
        return Response.redirect(target.href, 308);
      }
      const response = await env.ASSETS.fetch(request);
      const headers = new Headers(response.headers);
      headers.set('x-content-type-options', 'nosniff');
      headers.set('referrer-policy', 'strict-origin-when-cross-origin');
      return new Response(response.body, {status: response.status, statusText: response.statusText, headers});
    }
  };
}

export default createReferenceWorker();
