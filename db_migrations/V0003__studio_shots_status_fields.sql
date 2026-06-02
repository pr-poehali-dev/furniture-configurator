ALTER TABLE t_p47212135_furniture_configurat.studio_shots
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ready',
    ADD COLUMN IF NOT EXISTS detail TEXT;