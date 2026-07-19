export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const { ensureSchema } = await import('../../src/schema-init.js');
  await ensureSchema(env);
  const { ensureSession } = await import('../../src/auth.js');
  const session = await ensureSession(request, env);
  if (session instanceof Response) return session;

  const url = new URL(request.url);
  if (url.pathname === '/api/auth/login') {
    const mod = await import('./api-auth.js');
    return mod.onRequestPost({ request, env });
  }
  if (url.pathname === '/api/auth/logout') {
    const mod = await import('./api-auth-logout.js');
    return mod.onRequestPost({ request, env });
  }
  if (url.pathname === '/api/bind-access') {
    const mod = await import('./api-bind-access.js');
    return mod.onRequestPost({ request, env, session });
  }
  if (url.pathname === '/api/audit') {
    const mod = await import('./api-audit.js');
    return mod.onRequestGet({ request, env, session });
  }
  if (url.pathname === '/api/my-subdomains') {
    const mod = await import('./api-my-subdomains.js');
    return mod.onRequestGet({ request, env, session });
  }
  if (url.pathname === '/api/root-domains') {
    const mod = await import('./api-root-domains.js');
    return request.method === 'GET' ? mod.onRequestGet({ request, env, session }) : mod.onRequestPost({ request, env, session });
  }
  if (url.pathname.startsWith('/api/root-domains/')) {
    const mod = await import('./api-root-domains.js');
    if (request.method === 'DELETE') return mod.onRequestDelete({ request, env });
  }
  if (url.pathname === '/api/subdomains') {
    const mod = await import('./api-subdomains.js');
    return request.method === 'GET' ? mod.onRequestGet({ request, env, session }) : mod.onRequestPost({ request, env, session });
  }
  if (url.pathname.startsWith('/api/subdomains/')) {
    const mod = await import('./api-subdomains.js');
    if (request.method === 'DELETE') return mod.onRequestDelete({ request, env });
  }
  if (url.pathname === '/api/dns-records') {
    const mod = await import('./api-dns-records.js');
    return request.method === 'GET' ? mod.onRequestGet({ request, env, session }) : mod.onRequestPost({ request, env, session });
  }
  if (url.pathname.startsWith('/api/dns-records/')) {
    const mod = await import('./api-dns-records.js');
    if (request.method === 'PUT') return mod.onRequestPut({ request, env, session });
    if (request.method === 'DELETE') return mod.onRequestDelete({ request, env, session });
  }
  return new Response('Not Found', { status: 404 });
}
