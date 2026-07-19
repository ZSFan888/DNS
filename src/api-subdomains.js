const reserved = new Set(['www','api','mail','admin','ftp','ns1','ns2','root','support']);

export async function onRequestGet({ env }) {
  const rows = await env.DB.prepare('SELECT id, root_domain_id, prefix, full_domain, owner_user_id, status, created_at FROM subdomains ORDER BY id DESC').all();
  return Response.json({ ok: true, data: rows.results });
}

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  const rootDomainId = Number(body?.root_domain_id);
  const prefix = String(body?.prefix || '').trim().toLowerCase();
  const ownerUserId = String(body?.owner_user_id || '').trim();
  if (!rootDomainId || !prefix || !ownerUserId) return Response.json({ ok: false, error: 'invalid_payload' }, { status: 400 });
  if (!/^[a-z0-9-]{1,63}$/.test(prefix) || prefix.startsWith('-') || prefix.endsWith('-')) return Response.json({ ok: false, error: 'invalid_prefix' }, { status: 400 });
  if (reserved.has(prefix)) return Response.json({ ok: false, error: 'reserved_prefix' }, { status: 400 });

  const root = await env.DB.prepare("SELECT domain_name FROM root_domains WHERE id = ? AND status = 'active'").bind(rootDomainId).first();
  if (!root) return Response.json({ ok: false, error: 'root_domain_not_found' }, { status: 404 });

  const fullDomain = `${prefix}.${root.domain_name}`;
  const exists = await env.DB.prepare('SELECT id FROM subdomains WHERE full_domain = ?').bind(fullDomain).first();
  if (exists) return Response.json({ ok: false, error: 'subdomain_taken' }, { status: 409 });

  await env.DB.prepare('INSERT INTO subdomains(root_domain_id, prefix, full_domain, owner_user_id) VALUES(?, ?, ?, ?)')
    .bind(rootDomainId, prefix, fullDomain, ownerUserId)
    .run();

  return Response.json({ ok: true, full_domain: fullDomain });
}


export async function onRequestDelete({ request, env }) {
  const url = new URL(request.url);
  const id = Number(url.pathname.split('/').pop());
  const rec = await env.DB.prepare('SELECT id FROM subdomains WHERE id = ?').bind(id).first();
  if (!rec) return Response.json({ ok: false, error: 'not_found' }, { status: 404 });
  await env.DB.prepare('DELETE FROM subdomains WHERE id = ?').bind(id).run();
  return Response.json({ ok: true });
}
