export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  const subdomainId = Number(body?.subdomain_id);
  const userId = String(body?.user_id || '').trim();
  if (!subdomainId || !userId) return Response.json({ ok: false, error: 'invalid_payload' }, { status: 400 });
  await env.DB.prepare('INSERT INTO subdomain_access(subdomain_id, user_id) VALUES(?, ?)').bind(subdomainId, userId).run();
  return Response.json({ ok: true });
}
