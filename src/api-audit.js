export async function onRequestGet({ request, env, session }) {
  if (session?.role !== 'admin') return Response.json({ ok: false, error: 'forbidden' }, { status: 403 });
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page') || 1));
  const size = Math.min(50, Math.max(10, Number(url.searchParams.get('size') || 20)));
  const offset = (page - 1) * size;
  const rows = await env.DB.prepare('SELECT id, user_id, role, action, target, detail, created_at FROM audit_logs ORDER BY id DESC LIMIT ? OFFSET ?').bind(size + 1, offset).all();
  const list = rows.results.slice(0, size);
  const hasNext = rows.results.length > size;
  return Response.json({ ok: true, data: list, page, size, hasNext });
}
