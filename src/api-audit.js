export async function onRequestGet({ env, session }) {
  if (session?.role !== 'admin') return Response.json({ ok: false, error: 'forbidden' }, { status: 403 });
  const rows = await env.DB.prepare('SELECT id, user_id, role, action, target, detail, created_at FROM audit_logs ORDER BY id DESC LIMIT 200').all();
  return Response.json({ ok: true, data: rows.results });
}
