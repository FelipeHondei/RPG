-- Migration: create characters table with JSONB storage
CREATE TABLE IF NOT EXISTS characters (
  id SERIAL PRIMARY KEY,
  char_number INTEGER UNIQUE NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp ON characters;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON characters
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Upsert example (use in functions):
-- INSERT INTO characters (char_number, data)
-- VALUES ($1, $2::jsonb)
-- ON CONFLICT (char_number) DO UPDATE
-- SET data = EXCLUDED.data, updated_at = now()
-- RETURNING *;
