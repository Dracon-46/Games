// Servidor de teste: entrega os arquivos de JavaScript/ e, com { supabase: true },
// imita as rotas do Supabase usadas pelo site (Auth e RPC) em cima do Postgres de teste.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const SITE = path.join(__dirname, '..', '..', 'JavaScript');
const MIME = { html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8', svg: 'image/svg+xml', json: 'application/json' };

function supabase() {
  const pg = require('./pg');
  const fns = {};
  const rows = pg.admin("select string_agg(proname || '|' || proretset || '|' || pg_get_function_identity_arguments(oid), E'\\n') from pg_proc where pronamespace = 'public'::regnamespace");
  for (const l of rows.split('\n')) {
    const [name, set, args] = l.split('|');
    fns[name] = { set: set === 't' || set === 'true', args: Object.fromEntries(args ? args.split(', ').map((a) => { const [k, ...t] = a.split(' '); return [k, t.join(' ')]; }) : []) };
  }
  const session = (u) => ({ access_token: 'tok-' + u.id, refresh_token: 'ref-' + u.id, expires_in: 3600, token_type: 'bearer', user: { id: u.id, email: u.email, user_metadata: u.raw_user_meta_data } });
  return function handle(req, url, body, send) {
    const b = body ? JSON.parse(body) : {};
    if (url.pathname === '/auth/v1/signup') {
      try {
        pg.admin(`insert into auth.users(email, pass, raw_user_meta_data) values(${pg.lit(b.email)}, ${pg.lit(b.password)}, ${pg.lit(JSON.stringify(b.data || {}))}::jsonb)`);
      } catch (e) {
        const dup = /users_email/.test(e.stderr || '');
        return send(dup ? 422 : 500, { msg: dup ? 'User already registered' : 'Database error saving new user' });
      }
      return send(200, session(JSON.parse(pg.admin(`select row_to_json(t) from auth.users t where email = ${pg.lit(b.email)}`))));
    }
    if (url.pathname === '/auth/v1/token') {
      const r = url.searchParams.get('grant_type') === 'password'
        ? pg.admin(`select row_to_json(t) from auth.users t where email = ${pg.lit(b.email)} and pass = ${pg.lit(b.password)}`)
        : pg.admin(`select row_to_json(t) from auth.users t where id::text = ${pg.lit(String(b.refresh_token || '').slice(4))}`);
      return r ? send(200, session(JSON.parse(r))) : send(400, { error_description: 'Invalid login credentials' });
    }
    if (url.pathname.startsWith('/auth/v1/')) return send(204, {});
    const fn = url.pathname.split('/').pop(), f = fns[fn];
    if (!f) return send(404, { message: 'função inexistente' });
    const tok = (req.headers.authorization || '').replace('Bearer ', ''), uid = tok.startsWith('tok-') ? tok.slice(4) : null;
    const args = Object.entries(b).map(([k, v]) => `${k} => ${v === null ? 'null' : pg.lit(typeof v === 'object' ? JSON.stringify(v) : v)}::${f.args[k]}`).join(', ');
    try {
      const out = pg.as(uid, `select ${f.set ? `coalesce(jsonb_agg(to_jsonb(t)), '[]')::text from ${fn}(${args}) t` : `to_jsonb(${fn}(${args}))::text`}`);
      return send(200, out === '' ? null : JSON.parse(out));
    } catch (e) {
      const m = (e.stderr || '').match(/ERROR:\s+(.*)/);
      return send(/permission denied/.test(e.stderr || '') ? 401 : 400, { message: m ? m[1] : 'erro' });
    }
  };
}

/** Sobe o servidor numa porta livre. Devolve { url, close }. */
function start({ supabase: withDb = false, port = 0 } = {}) {
  const api = withDb ? supabase() : null;
  const srv = http.createServer((req, res) => {
    let body = '';
    req.on('data', (d) => (body += d));
    req.on('end', () => {
      const url = new URL(req.url, 'http://x');
      const send = (code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
      try {
        if (api && (url.pathname.startsWith('/auth/v1/') || url.pathname.startsWith('/rest/v1/rpc/'))) return api(req, url, body, send);
        const file = path.join(SITE, decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
        if (!file.startsWith(SITE) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
        res.writeHead(200, { 'Content-Type': MIME[file.split('.').pop()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        res.end(fs.readFileSync(file));
      } catch (e) { send(500, { message: String(e.message).slice(0, 200) }); }
    });
  });
  return new Promise((ok) => srv.listen(port, '127.0.0.1', () => ok({ url: 'http://127.0.0.1:' + srv.address().port + '/', close: () => new Promise((r) => srv.close(r)) })));
}
module.exports = { start, SITE };
if (require.main === module) start({ port: +process.env.PORT || 8000, supabase: !!process.env.FK_SUPABASE }).then((s) => console.log('Falkyria Games em ' + s.url));
