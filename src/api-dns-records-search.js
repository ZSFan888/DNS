export async function onRequestGet({ request, env, session }) {
  const url = new URL(request.url);
  const subdomainId = Number(url.searchParams.get('subdomain_id'));
  const q = String(url.searchParams.get('q') || '').trim();
  const type = String(url.searchParams.get('type') || '').trim().toUpperCase();
  const page = Math.max(1, Number(url.searchParams.get('page') || 1));
  const size = Math.min(50, Math.max(10, Number(url.searchParams.get('size') || 20)));
  const offset = (page - 1) * size;
  if (!subdomainId) return Response.json({ ok: false, error: 'missing_subdomain_id' }, { status: 400 });
  const allowed = session?.role === 'admin' ? true : !!(await env.DB.prepare('SELECT 1 FROM subdomain_access WHERE subdomain_id = ? AND user_id = ?').bind(subdomainId, session?.user_id).first());
  if (!allowed) return Response.json({ ok: false, error: 'forbidden' }, { status: 403 });
  let sql = 'SELECT id, type, name, content, ttl, proxied, updated_at FROM dns_records WHERE subdomain_id = ?';
  const binds = [subdomainId];
  if (q) { sql += ' AND (name LIKE ? OR content LIKE ?)'; binds.push(`%${q}%`, `%${q}%`); }
  if (type) { sql += ' AND type = ?'; binds.push(type); }
  sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  binds.push(size + 1, offset);
  const rows = await env.DB.prepare(sql).bind(...binds).all();
  const data = rows.results.slice(0, size);
  return Response.json({ ok: true, data, hasNext: rows.results.length > size, page, size });
}
