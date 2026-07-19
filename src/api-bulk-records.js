export async function onRequestPost({ request, env, session }) {
  const body = await request.json().catch(() => null);
  const ids = Array.isArray(body?.ids) ? body.ids.map(Number).filter(Boolean) : [];
  const op = String(body?.op || 'delete');
  if (!ids.length) return Response.json({ ok: false, error: 'empty_ids' }, { status: 400 });
  if (session?.role !== 'admin') return Response.json({ ok: false, error: 'forbidden' }, { status: 403 });
  if (op === 'delete') {
    const stmts = ids.map(id => env.DB.prepare('DELETE FROM dns_records WHERE id = ?').bind(id));
    await env.DB.batch(stmts);
    return Response.json({ ok: true, deleted: ids.length });
  }
  if (op === 'ttl') {
    const ttl = Number(body?.ttl || 300);
    const stmts = ids.map(id => env.DB.prepare('UPDATE dns_records SET ttl = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(ttl, id));
    await env.DB.batch(stmts);
    return Response.json({ ok: true, updated: ids.length });
  }
  return Response.json({ ok: false, error: 'unsupported_op' }, { status: 400 });
}
