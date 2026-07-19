function getCookie(request, name) {
  const cookie = request.headers.get('Cookie') || '';
  const m = cookie.match(new RegExp('(?:^|; )' + name.replace(/[-\/\^$*+?.()|[\]{}]/g, '\$&') + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

export async function requireAuth(request, env) {
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/auth/')) return null;
  const token = getCookie(request, 'dns_session') || request.headers.get('Authorization')?.replace('Bearer ', '') || '';
  const secret = env.AUTH_SECRET;
  if (!secret) return null;
  if (!token) return new Response('Unauthorized', { status: 401 });
  const expected = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret + ':admin'));
  const expectedB64 = btoa(String.fromCharCode(...new Uint8Array(expected)));
  if (token !== expectedB64) return new Response('Unauthorized', { status: 401 });
  return null;
}
