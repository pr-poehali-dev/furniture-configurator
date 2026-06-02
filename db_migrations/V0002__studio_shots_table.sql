CREATE TABLE IF NOT EXISTS t_p47212135_furniture_configurat.studio_shots (
    id SERIAL PRIMARY KEY,
    src_url TEXT NOT NULL UNIQUE,
    studio_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);