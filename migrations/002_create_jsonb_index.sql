-- Add GIN index to speed up JSONB queries
CREATE INDEX IF NOT EXISTS idx_characters_data_gin ON public.characters USING gin (data);

-- Example: expression index for specific fields (optional)
-- CREATE INDEX IF NOT EXISTS idx_characters_data_forca ON public.characters ((data->>'forca'));
