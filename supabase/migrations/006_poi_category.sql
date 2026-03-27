-- Add category column to POIs for tab-based filtering
ALTER TABLE pois ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'race';

-- Update existing POIs
UPDATE pois SET category = 'both' WHERE type IN ('parking', 'restroom');
UPDATE pois SET category = 'race' WHERE type IN ('registration', 'start', 'finish', 'aid');
UPDATE pois SET category = 'visitor' WHERE type IN ('business', 'historic', 'stand');
