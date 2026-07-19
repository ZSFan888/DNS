export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  if (url.pathname === '/api/root-domains') {
    const mod = await import('./api-root-domains.js');
    return request.method === 'GET' ? mod.onRequestGet({ request, env }) : mod.onRequestPost({ request, env });
  }
  if (url.pathname === '/api/subdomains') {
    const mod = await import('./api-subdomains.js');
    return request.method === 'GET' ? mod.onRequestGet({ request, env }) : mod.onRequestPost({ request, env });
  }
  if (url.pathname === '/api/dns-records') {
    const mod = await import('./api-dns-records.js');
    return request.method === 'GET' ? mod.onRequestGet({ request, env }) : mod.onRequestPost({ request, env });
  }
  if (url.pathname.startsWith('/api/dns-records/')) {
    const mod = await import('./api-dns-records.js');
    if (request.method === 'PUT') return mod.onRequestPut({ request, env });
    if (request.method === 'DELETE') return mod.onRequestDelete({ request, env });
  }
  return new Response('Not Found', { status: 404 });
}
