-- Adds entries_awarded column to checkpoints (only touches checkpoints table).
ALTER TABLE checkpoints ADD COLUMN IF NOT EXISTS entries_awarded int NOT NULL DEFAULT 1;
