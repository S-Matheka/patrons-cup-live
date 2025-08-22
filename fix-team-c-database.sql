-- Fix Team C database schema for 3-way matches
-- Run this in your Supabase SQL Editor

-- 1. Add team C score columns to holes table
DO $$
BEGIN
    -- Add team_c_score column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'holes' AND column_name = 'team_c_score'
    ) THEN
        ALTER TABLE holes ADD COLUMN team_c_score INTEGER;
        ALTER TABLE holes ADD CONSTRAINT holes_team_c_score_check 
            CHECK (team_c_score IS NULL OR team_c_score > 0);
        RAISE NOTICE 'Added team_c_score column to holes table';
    ELSE
        RAISE NOTICE 'team_c_score column already exists';
    END IF;

    -- Add team_c_strokes column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'holes' AND column_name = 'team_c_strokes'
    ) THEN
        ALTER TABLE holes ADD COLUMN team_c_strokes INTEGER;
        ALTER TABLE holes ADD CONSTRAINT holes_team_c_strokes_check 
            CHECK (team_c_strokes IS NULL OR team_c_strokes > 0);
        RAISE NOTICE 'Added team_c_strokes column to holes table';
    ELSE
        RAISE NOTICE 'team_c_strokes column already exists';
    END IF;
END
$$;

-- 2. Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'holes' 
AND column_name IN ('team_c_score', 'team_c_strokes')
ORDER BY column_name;

-- 3. Test that we can insert/update team C data
-- This should work without errors after running the above
INSERT INTO holes (match_id, hole_number, par, team_a_score, team_b_score, team_c_score) 
VALUES (999999, 1, 4, 4, 5, 3) 
ON CONFLICT (match_id, hole_number) DO UPDATE SET
    team_a_score = EXCLUDED.team_a_score,
    team_b_score = EXCLUDED.team_b_score,
    team_c_score = EXCLUDED.team_c_score;

-- Clean up test data
DELETE FROM holes WHERE match_id = 999999;

SELECT 'Team C database schema fix completed successfully!' as status;
