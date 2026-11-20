# Herrería Pesce

Catálogo + reservas con cierre por WhatsApp. Cloudflare Workers + D1. Sin build ni frameworks.

## Local
```
npm i
cp .dev.vars.example .dev.vars   # editá la contraseña
npm run db:local
npm run dev
```

## Producción (Cloudflare)
1. `npx wrangler d1 create herreriapesce` → copiá el `database_id` en `wrangler.jsonc`.
2. `npm run db:remote` (crea las tablas y los 5 productos de ejemplo).
3. Secretos: `npx wrangler secret put ADMIN_PASSWORD` y `npx wrangler secret put SESSION_SECRET`.
4. `npm run deploy`, o conectá este repo en Workers & Pages → Workers Builds (build: vacío, deploy: `npx wrangler deploy`).

## Contenido
- Fotos: subí `public/img/<slug>.jpg` (slugs en `schema.sql`: ganchos, parrilla-tambor, soporte-bici, soporte-bolsa, barra-rack).
- Precios, medidas y % de seña: tabla `products` (`npx wrangler d1 execute herreriapesce --remote --command "UPDATE products SET price=20000 WHERE id=1"`).
- Admin: `/admin`.
