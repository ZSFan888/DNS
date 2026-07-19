export async function onRequestGet({ env, session }) {
  if (!session) return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  const [subdomains, access] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) as n FROM subdomains WHERE owner_user_id = ?').bind(session.user_id).first(),
    env.DB.prepare('SELECT COUNT(*) as n FROM subdomain_access WHERE user_id = ?').bind(session.user_id).first(),
  ]);
  return Response.json({ ok: true, data: { user_id: session.user_id, role: session.role, subdomains: subdomains?.n || 0, access: access?.n || 0, expires_at: session.expires_at } });
}
