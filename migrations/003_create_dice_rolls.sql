-- Migration: create dice_rolls table for real-time sharing
CREATE TABLE IF NOT EXISTS public.dice_rolls (
  id BIGSERIAL PRIMARY KEY,
  dice_type INTEGER NOT NULL,
  result INTEGER NOT NULL,
  rolled_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.dice_rolls ENABLE ROW LEVEL SECURITY;

-- Allow all users to read and insert
CREATE POLICY "Allow public read" ON public.dice_rolls
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON public.dice_rolls
  FOR INSERT WITH CHECK (true);

-- Index for recent rolls (limit queries)
CREATE INDEX IF NOT EXISTS idx_dice_rolls_rolled_at ON public.dice_rolls (rolled_at DESC);

-- Auto-cleanup old rolls (keep only last 100)
CREATE OR REPLACE FUNCTION cleanup_old_dice_rolls()
RETURNS TRIGGER AS $
BEGIN
  DELETE FROM public.dice_rolls
  WHERE id NOT IN (
    SELECT id FROM public.dice_rolls
    ORDER BY rolled_at DESC
    LIMIT 100
  );
  RETURN NULL;
END;
$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cleanup_dice_rolls ON public.dice_rolls;
CREATE TRIGGER trigger_cleanup_dice_rolls
AFTER INSERT ON public.dice_rolls
FOR EACH STATEMENT
EXECUTE FUNCTION cleanup_old_dice_rolls();

-- Enable Realtime for this table
-- Note: You must also enable Realtime in Supabase Dashboard > Database > Replication
-- Add the "dice_rolls" table to the publication