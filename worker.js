const J = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });
const enc = new TextEncoder();
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
async function sign(secret, msg) {
  const k = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', k, enc.encode(msg)));
}
async function authed(req, env) {
  const [exp, sig] = (req.headers.get('authorization') || '').replace('Bearer ', '').split('.');
  return !!(exp && sig && +exp > Date.now() && sig === await sign(env.SESSION_SECRET, exp));
}
const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '');

export default {
  async fetch(req, env) {
    const { pathname: p, searchParams: q } = new URL(req.url), m = req.method, db = env.DB;
    try {
      if (p === '/api/products')
        return J((await db.prepare('SELECT * FROM products WHERE active=1 ORDER BY id').all()).results);

      if (p === '/api/blocks')
        return J((await db.prepare('SELECT start_date,end_date FROM blocks WHERE product_id=?1 OR product_id IS NULL')
          .bind(+q.get('product_id')).all()).results);

      if (p === '/api/reservations' && m === 'POST') {
        const b = await req.json();
        const pr = await db.prepare('SELECT * FROM products WHERE id=?1 AND active=1').bind(+b.product_id).first();
        if (!pr || !isDate(b.date) || !['retiro', 'envio'].includes(b.delivery)) return J({ error: 'Datos inválidos' }, 400);
        const bl = await db.prepare('SELECT 1 FROM blocks WHERE (product_id=?1 OR product_id IS NULL) AND ?2 BETWEEN start_date AND end_date')
          .bind(pr.id, b.date).first();
        if (bl) return J({ error: 'Esa fecha ya no está disponible' }, 409);
        const deposit = Math.round(pr.price * pr.deposit_pct / 100);
        const r = await db.prepare('INSERT INTO reservations (product_id,date,delivery,deposit) VALUES (?1,?2,?3,?4)')
          .bind(pr.id, b.date, b.delivery, deposit).run();
        return J({ id: r.meta.last_row_id, deposit });
      }

      if (p === '/api/admin/login' && m === 'POST') {
        const { password } = await req.json();
        if (!env.ADMIN_PASSWORD || password !== env.ADMIN_PASSWORD) return J({ error: 'Contraseña incorrecta' }, 401);
        const exp = String(Date.now() + 12 * 3600e3);
        return J({ token: exp + '.' + await sign(env.SESSION_SECRET, exp) });
      }

      if (p.startsWith('/api/admin/')) {
        if (!await authed(req, env)) return J({ error: 'No autorizado' }, 401);
        if (p === '/api/admin/data')
          return J({
            blocks: (await db.prepare('SELECT b.*, p.name product FROM blocks b LEFT JOIN products p ON p.id=b.product_id ORDER BY start_date DESC').all()).results,
            reservations: (await db.prepare('SELECT r.*, p.name product FROM reservations r JOIN products p ON p.id=r.product_id ORDER BY r.id DESC LIMIT 50').all()).results
          });
        if (p === '/api/admin/blocks' && m === 'POST') {
          const b = await req.json();
          if (!isDate(b.start) || !isDate(b.end) || b.end < b.start) return J({ error: 'Rango de fechas inválido' }, 400);
          await db.prepare('INSERT INTO blocks (product_id,start_date,end_date,note) VALUES (?1,?2,?3,?4)')
            .bind(b.product_id || null, b.start, b.end, b.note || null).run();
          return J({ ok: true });
        }
        const del = p.match(/^\/api\/admin\/blocks\/(\d+)$/);
        if (del && m === 'DELETE') {
          await db.prepare('DELETE FROM blocks WHERE id=?1').bind(+del[1]).run();
          return J({ ok: true });
        }
      }
      return J({ error: 'No encontrado' }, 404);
    } catch (e) {
      return J({ error: 'Error del servidor' }, 500);
    }
  }
};
