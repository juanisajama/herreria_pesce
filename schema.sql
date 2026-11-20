CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY, slug TEXT UNIQUE, name TEXT NOT NULL, specs TEXT,
  price INTEGER NOT NULL, deposit_pct INTEGER NOT NULL, active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER REFERENCES products(id),
  start_date TEXT NOT NULL, end_date TEXT NOT NULL, note TEXT
);
CREATE TABLE IF NOT EXISTS reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER NOT NULL REFERENCES products(id),
  date TEXT NOT NULL, delivery TEXT NOT NULL, deposit INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
-- DATOS DE EJEMPLO: editá precios y medidas
INSERT OR IGNORE INTO products (id,slug,name,specs,price,deposit_pct) VALUES
 (1,'ganchos','Set x3 ganchos colgables','Acero macizo · 3 piezas · hasta 15 kg c/u',18000,10),
 (2,'parrilla-tambor','Parrilla tambor chulengo','Tambor 200 L · parrilla regulable · chapa 3 mm',145000,30),
 (3,'soporte-bici','Soporte Bici pared','Caño 40x40 · hasta 25 kg',22000,10),
 (4,'soporte-bolsa','Soporte Bolsa Box pared','Estructura reforzada · bolsas hasta 50 kg',38000,10),
 (5,'barra-rack','Barra Ejercicio rack pared','Caño estructural · hasta 120 kg',85000,20);
