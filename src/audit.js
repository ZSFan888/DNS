export async function logAudit(env, session, action, target, detail = {}) {
  await env.DB.prepare('INSERT INTO audit_logs(user_id, role, action, target, detail) VALUES(?,?,?,?,?)').bind(
    session?.user_id || 'unknown',
    session?.role || 'unknown',
    action,
    target,
    JSON.stringify(detail)
  ).run();
}
