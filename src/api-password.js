import { hashPassword } from './crypto.js';

export async function onRequestPost({ request, env, session }) {
  if (!session) return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => null);
  const oldPassword = String(body?.old_password || '');
  const newPassword = String(body?.new_password || '');
  if (!oldPassword || !newPassword) return Response.json({ ok: false, error: 'invalid_payload' }, { status: 400 });
  const user = await env.DB.prepare('SELECT id, password_hash FROM users WHERE id = ?').bind(session.user_id).first();
  if (!user) return Response.json({ ok: false, error: 'user_not_found' }, { status: 404 });
  const oldHash = await hashPassword(oldPassword);
  if (oldHash !== user.password_hash) return Response.json({ ok: false, error: 'wrong_password' }, { status: 400 });
  const newHash = await hashPassword(newPassword);
  await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(newHash, session.user_id).run();
  return Response.json({ ok: true });
}
