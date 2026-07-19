export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const { ensureSchema } = await import('../../src/schema-init.js');
  const { ensureSession } = await import('../../src/auth.js');
  const { logAudit } = await import('../../src/audit.js');
  await ensureSchema(env);
  const session = await ensureSession(request, env);
  if (session instanceof Response) return session;
  if (url.pathname === '/api/auth/login') return (await import('../../src/api-auth.js')).onRequestPost({ request, env });
  if (url.pathname === '/api/auth/logout') return (await import('../../src/api-auth-logout.js')).onRequestPost({ request, env, session });
  if (url.pathname === '/api/bind-access') return (await import('../../src/api-bind-access.js')).onRequestPost({ request, env, session });
  if (url.pathname === '/api/revoke-access') return (await import('../../src/api-revoke-access.js')).onRequestPost({ request, env, session });
  if (url.pathname === '/api/audit') return (await import('../../src/api-audit.js')).onRequestGet({ request, env, session });
  if (url.pathname === '/api/my-subdomains') return (await import('../../src/api-my-subdomains.js')).onRequestGet({ request, env, session });
  if (url.pathname === '/api/me') return (await import('../../src/api-me.js')).onRequestGet({ request, env, session });
  if (url.pathname === '/api/password') return (await import('../../src/api-password.js')).onRequestPost({ request, env, session });
  if (url.pathname === '/api/root-domains') {
    const mod = await import('../../src/api-root-domains.js');
    return request.method === 'GET' ? mod.onRequestGet({ request, env, session }) : mod.onRequestPost({ request, env, session });
  }
  if (url.pathname.startsWith('/api/root-domains/')) return (await import('../../src/api-root-domains.js')).onRequestDelete({ request, env, session });
  if (url.pathname === '/api/subdomains') {
    const mod = await import('../../src/api-subdomains.js');
    return request.method === 'GET' ? mod.onRequestGet({ request, env, session }) : mod.onRequestPost({ request, env, session });
  }
  if (url.pathname.startsWith('/api/subdomains/')) return (await import('../../src/api-subdomains.js')).onRequestDelete({ request, env, session });
  if (url.pathname === '/api/dns-records') {
    const mod = await import('../../src/api-dns-records.js');
    return request.method === 'GET' ? mod.onRequestGet({ request, env, session }) : mod.onRequestPost({ request, env, session });
  }
  if (url.pathname.startsWith('/api/dns-records/')) {
    const mod = await import('../../src/api-dns-records.js');
    if (request.method === 'PUT') return mod.onRequestPut({ request, env, session });
    if (request.method === 'DELETE') return mod.onRequestDelete({ request, env, session });
  }
  if (url.pathname === '/api/dns-records/search') return (await import('../../src/api-dns-records-search.js')).onRequestGet({ request, env, session });
  if (url.pathname === '/api/bulk-records') return (await import('../../src/api-bulk-records.js')).onRequestPost({ request, env, session });
  return new Response(await (await fetch(new URL('./index.html', request.url))).text(), { headers: { 'content-type': 'text/html;charset=UTF-8' } });
}
