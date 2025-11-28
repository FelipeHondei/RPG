-- Migration: create characters table with JSONB storage for Supabase
-- Run this SQL in the Supabase SQL Editor (or psql)
CREATE TABLE IF NOT EXISTS public.characters (
  id BIGSERIAL PRIMARY KEY,
  char_number INTEGER UNIQUE NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS) for Supabase
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

-- Create a public policy to allow anonymous access (you can restrict later)
CREATE POLICY "Allow anonymous access" ON public.characters
  FOR ALL USING (true) WITH CHECK (true);

-- Create timestamp trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_update_timestamp ON public.characters;
CREATE TRIGGER on_update_timestamp
BEFORE UPDATE ON public.characters
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Upsert example (use in functions):
-- INSERT INTO public.characters (char_number, data)
-- VALUES ($1, $2::jsonb)
-- ON CONFLICT (char_number) DO UPDATE
-- SET data = EXCLUDED.data, updated_at = now()
-- RETURNING *;
