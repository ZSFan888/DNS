export async function onRequestPost({ request, env }) {
  const sid = (request.headers.get('Cookie') || '').match(/(?:^|; )dns_session=([^;]+)/)?.[1];
  if (sid) await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sid).run();
  return Response.json({ ok: true });
}
