export async function ensureSession(request, env) {
  const url = new URL(request.url);
  if (url.pathname === '/api/auth/login') return null;
  if (!env || !env.DB) return new Response(JSON.stringify({ ok: false, error: 'db_not_configured' }), { status: 500, headers: { 'content-type': 'application/json' } });
  const sid = (request.headers.get('Cookie') || '').match(/(?:^|; )dns_session=([^;]+)/)?.[1];
  if (!sid) return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });
  let session = null;
  try {
    session = await env.DB.prepare('SELECT user_id, role, expires_at FROM sessions WHERE id = ?').bind(sid).first();
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: 'db_error' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
  if (!session) return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });
  if (new Date(session.expires_at).getTime() < Date.now()) return new Response(JSON.stringify({ ok: false, error: 'expired' }), { status: 401, headers: { 'content-type': 'application/json' } });
  return session;
}

export async function canAccessSubdomain(env, session, subdomainId) {
  if (session?.role === 'admin') return true;
  if (!env || !env.DB) return false;
  const row = await env.DB.prepare('SELECT 1 FROM subdomain_access WHERE subdomain_id = ? AND user_id = ?').bind(subdomainId, session?.user_id).first();
  return !!row;
}
