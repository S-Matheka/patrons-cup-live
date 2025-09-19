-- Fix database schema to add missing team_c_score and team_c_strokes columns
-- This script adds the missing columns for 3-way match support

-- Add team_c_score column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'holes' AND column_name = 'team_c_score'
    ) THEN
        ALTER TABLE holes ADD COLUMN team_c_score INTEGER;
        RAISE NOTICE 'Added team_c_score column to holes table';
    ELSE
        RAISE NOTICE 'team_c_score column already exists in holes table';
    END IF;
END $$;

-- Add team_c_strokes column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'holes' AND column_name = 'team_c_strokes'
    ) THEN
        ALTER TABLE holes ADD COLUMN team_c_strokes INTEGER;
        RAISE NOTICE 'Added team_c_strokes column to holes table';
    ELSE
        RAISE NOTICE 'team_c_strokes column already exists in holes table';
    END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'holes' 
AND column_name IN ('team_c_score', 'team_c_strokes')
ORDER BY column_name;
