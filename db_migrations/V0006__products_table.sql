CREATE TABLE IF NOT EXISTS t_p47212135_furniture_configurat.products (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    price INTEGER NOT NULL DEFAULT 0,
    old_price INTEGER,
    category TEXT NOT NULL DEFAULT 'tables',
    style TEXT NOT NULL DEFAULT '',
    material TEXT NOT NULL DEFAULT '',
    img TEXT NOT NULL DEFAULT '',
    badge TEXT,
    eco BOOLEAN NOT NULL DEFAULT false,
    description TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_active ON t_p47212135_furniture_configurat.products (is_active, sort_order);