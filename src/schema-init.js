const schema = `
CREATE TABLE IF NOT EXISTS root_domains (id INTEGER PRIMARY KEY AUTOINCREMENT, domain_name TEXT NOT NULL UNIQUE, zone_id TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS subdomains (id INTEGER PRIMARY KEY AUTOINCREMENT, root_domain_id INTEGER NOT NULL, prefix TEXT NOT NULL, full_domain TEXT NOT NULL UNIQUE, owner_user_id TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS dns_records (id INTEGER PRIMARY KEY AUTOINCREMENT, subdomain_id INTEGER NOT NULL, type TEXT NOT NULL, name TEXT NOT NULL, content TEXT NOT NULL, ttl INTEGER NOT NULL DEFAULT 300, proxied INTEGER NOT NULL DEFAULT 0, cloudflare_record_id TEXT, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, role TEXT NOT NULL, action TEXT NOT NULL, target TEXT NOT NULL, detail TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, role TEXT NOT NULL, expires_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS subdomain_access (id INTEGER PRIMARY KEY AUTOINCREMENT, subdomain_id INTEGER NOT NULL, user_id TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
`;

let initPromise = null;
export async function ensureSchema(env) {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const probe = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='root_domains'").first();
    if (probe) return true;
    await env.DB.exec(schema);
    return true;
  })();
  return initPromise;
}
