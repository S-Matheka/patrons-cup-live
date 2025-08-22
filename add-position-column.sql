-- Migration: Add position column to players table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE players 
ADD COLUMN IF NOT EXISTS position VARCHAR(50);

-- Optional: Add a comment to document the column
COMMENT ON COLUMN players.position IS 'Player position/role (Captain, Vice Captain, Lady Player, etc.)';

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'players' AND column_name = 'position';
