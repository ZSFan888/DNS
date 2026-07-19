export async function onRequestPost({ request, env, session }) {
  if (session?.role !== 'admin') return Response.json({ ok: false, error: 'forbidden' }, { status: 403 });
  const body = await request.json().catch(() => null);
  const subdomainId = Number(body?.subdomain_id);
  const userId = String(body?.user_id || '').trim();
  if (!subdomainId || !userId) return Response.json({ ok: false, error: 'invalid_payload' }, { status: 400 });
  await env.DB.prepare('DELETE FROM subdomain_access WHERE subdomain_id = ? AND user_id = ?').bind(subdomainId, userId).run();
  return Response.json({ ok: true });
}
