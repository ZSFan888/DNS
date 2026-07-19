export async function onRequestGet({ env }) {
  const rows = await env.DB.prepare('SELECT id, domain_name, status, created_at FROM root_domains ORDER BY id DESC').all();
  return Response.json({ ok: true, data: rows.results });
}

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  if (!body?.domain_name || !body?.zone_id) return Response.json({ ok: false, error: 'invalid_payload' }, { status: 400 });
  const domain = String(body.domain_name).trim().toLowerCase();
  const zoneId = String(body.zone_id).trim();
  if (!domain || !zoneId) return Response.json({ ok: false, error: 'invalid_payload' }, { status: 400 });
  await env.DB.prepare('INSERT INTO root_domains(domain_name, zone_id) VALUES(?, ?)').bind(domain, zoneId).run();
  return Response.json({ ok: true });
}


export async function onRequestDelete({ request, env }) {
  const url = new URL(request.url);
  const id = Number(url.pathname.split('/').pop());
  const rec = await env.DB.prepare('SELECT id FROM root_domains WHERE id = ?').bind(id).first();
  if (!rec) return Response.json({ ok: false, error: 'not_found' }, { status: 404 });
  await env.DB.prepare('DELETE FROM root_domains WHERE id = ?').bind(id).run();
  return Response.json({ ok: true });
}
