export async function onRequestGet({ env, session }) {
  const rows = await env.DB.prepare('SELECT s.id, s.root_domain_id, s.prefix, s.full_domain, s.owner_user_id, s.status, s.created_at FROM subdomains s LEFT JOIN subdomain_access a ON a.subdomain_id = s.id WHERE a.user_id = ? OR s.owner_user_id = ? ORDER BY s.id DESC').bind(session.user_id, session.user_id).all();
  return Response.json({ ok: true, data: rows.results });
}
