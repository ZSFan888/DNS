export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  const password = String(body?.password || '');
  const admin = String(env.ADMIN_PASSWORD || '');
  if (password !== admin) return Response.json({ ok: false, error: 'invalid_credentials' }, { status: 401 });
  const sid = crypto.randomUUID();
  const expires = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
  await env.DB.prepare('INSERT INTO sessions(id, user_id, role, expires_at) VALUES(?, ?, ?, ?)').bind(sid, 'admin', 'admin', expires).run();
  return Response.json({ ok: true, sid, expires });
}
