export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  if (String(body?.password || '') !== String(env.ADMIN_PASSWORD || '')) return Response.json({ ok: false, error: 'invalid_credentials' }, { status: 401 });
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(env.AUTH_SECRET || '') + ':admin'));
  const token = btoa(String.fromCharCode(...new Uint8Array(digest)));
  return Response.json({ ok: true, token });
}
