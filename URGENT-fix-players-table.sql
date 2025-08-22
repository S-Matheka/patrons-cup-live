-- URGENT FIX: Add position column to players table
-- Copy and paste this ENTIRE script into your Supabase SQL Editor and run it

-- First, try to add the position column
ALTER TABLE players ADD COLUMN IF NOT EXISTS position VARCHAR(50);

-- If the above fails, this will show you the current table structure
-- Run this to see what columns exist:
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'players' 
ORDER BY ordinal_position;

-- If you need to completely recreate the players table (ONLY if above doesn't work):
-- UNCOMMENT the lines below by removing the -- at the start of each line

-- DROP TABLE IF EXISTS players CASCADE;
-- CREATE TABLE players (
--   id SERIAL PRIMARY KEY,
--   name VARCHAR(100) NOT NULL,
--   team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
--   handicap INTEGER DEFAULT 0 CHECK (handicap >= 0),
--   email VARCHAR(255),
--   phone VARCHAR(20),
--   position VARCHAR(50),
--   is_pro BOOLEAN DEFAULT FALSE,
--   is_ex_officio BOOLEAN DEFAULT FALSE,
--   is_junior BOOLEAN DEFAULT FALSE,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- Verify the fix worked:
SELECT 'SUCCESS: position column exists' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'players' AND column_name = 'position'
);
