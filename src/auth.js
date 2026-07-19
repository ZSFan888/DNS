export async function ensureSession(request, env) {
  const url = new URL(request.url);
  if (url.pathname === '/api/auth/login') return null;
  const sid = (request.headers.get('Cookie') || '').match(/(?:^|; )dns_session=([^;]+)/)?.[1];
  if (!sid) return new Response('Unauthorized', { status: 401 });
  const session = await env.DB.prepare('SELECT user_id, role, expires_at FROM sessions WHERE id = ?').bind(sid).first();
  if (!session) return new Response('Unauthorized', { status: 401 });
  if (new Date(session.expires_at).getTime() < Date.now()) return new Response('Unauthorized', { status: 401 });
  return session;
}

export async function canAccessSubdomain(env, session, subdomainId) {
  if (session.role === 'admin') return true;
  const row = await env.DB.prepare('SELECT 1 FROM subdomain_access WHERE subdomain_id = ? AND user_id = ?').bind(subdomainId, session.user_id).first();
  return !!row;
}
