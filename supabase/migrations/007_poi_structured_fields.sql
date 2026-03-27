-- Structured POI fields: location (required), hours (optional), description kept as optional
ALTER TABLE pois ADD COLUMN IF NOT EXISTS location text NOT NULL DEFAULT '';
ALTER TABLE pois ADD COLUMN IF NOT EXISTS hours text;

-- Migrate existing description data into location where possible
UPDATE pois SET location = description WHERE location = '' AND description IS NOT NULL AND description != '';
