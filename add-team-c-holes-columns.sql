-- Add team C score columns to holes table for 3-way matches support
-- Run this in your Supabase SQL Editor

ALTER TABLE holes 
ADD COLUMN IF NOT EXISTS team_c_score INTEGER CHECK (team_c_score IS NULL OR team_c_score > 0);

ALTER TABLE holes 
ADD COLUMN IF NOT EXISTS team_c_strokes INTEGER CHECK (team_c_strokes IS NULL OR team_c_strokes > 0);

-- Update any existing holes to have null team_c values (which they should already have)
-- This is just to ensure consistency
UPDATE holes SET team_c_score = NULL WHERE team_c_score IS NOT NULL AND team_c_score = 0;
UPDATE holes SET team_c_strokes = NULL WHERE team_c_strokes IS NOT NULL AND team_c_strokes = 0;
