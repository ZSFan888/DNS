async function syncToCloudflare(env, record) {
  const root = await env.DB.prepare('SELECT r.zone_id FROM subdomains s JOIN root_domains r ON s.root_domain_id = r.id WHERE s.id = ?').bind(record.subdomainId).first();
  if (!root?.zone_id || !env.CF_API_TOKEN) return { ok: true, skipped: true };
  const body = {
    type: record.type,
    name: record.name,
    content: record.content,
    ttl: record.ttl ?? 300,
    proxied: !!record.proxied,
  };
  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${root.zone_id}/dns_records`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.CF_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const json = await res.json();
  if (!json?.success) throw new Error(json?.errors?.[0]?.message || 'cloudflare_sync_failed');
  await env.DB.prepare('UPDATE dns_records SET cloudflare_record_id = ? WHERE id = ?').bind(json.result.id, record.id).run();
  return { ok: true, id: json.result.id };
}

function normalizeName(name, fullDomain) {
  const n = String(name || '').trim();
  if (!n || n === '@') return fullDomain;
  return n.endsWith(fullDomain) ? n : `${n}.${fullDomain}`;
}

const { logAudit } = await import('./audit.js');

async function getSubdomain(env, subdomainId) {
  return env.DB.prepare('SELECT s.id, s.full_domain, s.owner_user_id, s.status, r.domain_name FROM subdomains s JOIN root_domains r ON s.root_domain_id = r.id WHERE s.id = ?').bind(subdomainId).first();
}

async function canAccessSubdomain(env, session, subdomainId) {
  if (session?.role === 'admin') return true;
  const row = await env.DB.prepare('SELECT 1 FROM subdomain_access WHERE subdomain_id = ? AND user_id = ?').bind(subdomainId, session?.user_id).first();
  return !!row;
}

export async function onRequestGet({ request, env, session }) {
  const url = new URL(request.url);
  const subdomainId = Number(url.searchParams.get('subdomain_id'));
  if (!subdomainId) return Response.json({ ok: false, error: 'missing_subdomain_id' }, { status: 400 });
  if (!(await canAccessSubdomain(env, session, subdomainId))) return Response.json({ ok: false, error: 'forbidden' }, { status: 403 });
  const rows = await env.DB.prepare('SELECT id, type, name, content, ttl, proxied, updated_at FROM dns_records WHERE subdomain_id = ? ORDER BY id DESC').bind(subdomainId).all();
  return Response.json({ ok: true, data: rows.results });
}

export async function onRequestPost({ request, env, session }) {
  const body = await request.json().catch(() => null);
  const subdomainId = Number(body?.subdomain_id);
  const type = String(body?.type || '').trim().toUpperCase();
  const rawName = String(body?.name || '').trim();
  const content = String(body?.content || '').trim();
  const ttl = Number(body?.ttl || 300);
  const proxied = body?.proxied ? 1 : 0;
  if (!subdomainId || !type || !rawName || !content) return Response.json({ ok: false, error: 'invalid_payload' }, { status: 400 });
  if (!['A','AAAA','CNAME','TXT','MX','SRV'].includes(type)) return Response.json({ ok: false, error: 'unsupported_type' }, { status: 400 });
  if (!Number.isInteger(ttl) || ttl < 60) return Response.json({ ok: false, error: 'invalid_ttl' }, { status: 400 });

  const sub = await getSubdomain(env, subdomainId);
  if (!sub || sub.status !== 'active') return Response.json({ ok: false, error: 'subdomain_not_found' }, { status: 404 });
  if (!(await canAccessSubdomain(env, session, subdomainId))) return Response.json({ ok: false, error: 'forbidden' }, { status: 403 });

  const name = normalizeName(rawName, sub.full_domain);
  const duplicate = await env.DB.prepare('SELECT id FROM dns_records WHERE subdomain_id = ? AND type = ? AND name = ?').bind(subdomainId, type, name).first();
  if (duplicate) return Response.json({ ok: false, error: 'record_exists' }, { status: 409 });

  const res = await env.DB.prepare('INSERT INTO dns_records(subdomain_id, type, name, content, ttl, proxied) VALUES(?, ?, ?, ?, ?, ?) RETURNING id')
    .bind(subdomainId, type, name, content, ttl, proxied)
    .first();
  await syncToCloudflare(env, { id: res.id, subdomainId, type, name, content, ttl, proxied });
  await logAudit(env, session, 'create_record', name, { subdomainId, type, content, ttl, proxied });
  return Response.json({ ok: true, name, id: res.id });
}

export async function onRequestPut({ request, env, session }) {
  const url = new URL(request.url);
  const id = Number(url.pathname.split('/').pop());
  const body = await request.json().catch(() => null);
  const record = await env.DB.prepare('SELECT * FROM dns_records WHERE id = ?').bind(id).first();
  if (!record) return Response.json({ ok: false, error: 'record_not_found' }, { status: 404 });
  if (!(await canAccessSubdomain(env, session, record.subdomain_id))) return Response.json({ ok: false, error: 'forbidden' }, { status: 403 });
  if (!(await canAccessSubdomain(env, session, record.subdomain_id))) return Response.json({ ok: false, error: 'forbidden' }, { status: 403 });
  const updates = [];
  const binds = [];
  const before = { type: record.type, name: record.name, content: record.content, ttl: record.ttl, proxied: record.proxied };
  if (body?.type) { updates.push('type = ?'); binds.push(String(body.type).trim().toUpperCase()); }
  if (body?.name) { updates.push('name = ?'); binds.push(String(body.name).trim()); }
  if (body?.content) { updates.push('content = ?'); binds.push(String(body.content).trim()); }
  if (body?.ttl) { updates.push('ttl = ?'); binds.push(Number(body.ttl)); }
  if (body?.proxied !== undefined) { updates.push('proxied = ?'); binds.push(body.proxied ? 1 : 0); }
  if (!updates.length) return Response.json({ ok: false, error: 'no_updates' }, { status: 400 });
  binds.push(id);
  await env.DB.prepare(`UPDATE dns_records SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(...binds).run();
  const next = { ...before, ...body };
  await syncToCloudflare(env, { id, subdomainId: record.subdomain_id, ...next });
  await logAudit(env, session, 'update_record', String(record.name), { before, after: next });
  return Response.json({ ok: true });
}

export async function onRequestDelete({ request, env, session }) {
  const url = new URL(request.url);
  const id = Number(url.pathname.split('/').pop());
  const record = await env.DB.prepare('SELECT id FROM dns_records WHERE id = ?').bind(id).first();
  if (!record) return Response.json({ ok: false, error: 'record_not_found' }, { status: 404 });
  if (!(await canAccessSubdomain(env, session, record.subdomain_id))) return Response.json({ ok: false, error: 'forbidden' }, { status: 403 });
  const rec = await env.DB.prepare('SELECT cloudflare_record_id, subdomain_id FROM dns_records WHERE id = ?').bind(id).first();
  if (rec?.cloudflare_record_id && env.CF_API_TOKEN) {
    const root = await env.DB.prepare('SELECT r.zone_id FROM subdomains s JOIN root_domains r ON s.root_domain_id = r.id WHERE s.id = ?').bind(rec.subdomain_id).first();
    if (root?.zone_id) {
      await fetch(`https://api.cloudflare.com/client/v4/zones/${root.zone_id}/dns_records/${rec.cloudflare_record_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${env.CF_API_TOKEN}` }
      });
    }
  }
  await logAudit(env, session, 'delete_record', String(id), { cloudflare_record_id: rec.cloudflare_record_id });
  await env.DB.prepare('DELETE FROM dns_records WHERE id = ?').bind(id).run();
  return Response.json({ ok: true });
}
