-- Fix RLS policies to allow hole scoring updates
-- This allows anonymous users to update hole scores for live scoring

-- Drop existing policies that are too restrictive
DROP POLICY IF EXISTS "Allow authenticated updates on holes" ON holes;
DROP POLICY IF EXISTS "Allow authenticated updates on matches" ON matches;

-- Create new policies that allow anonymous updates for scoring
CREATE POLICY "Allow anonymous hole updates for scoring" ON holes 
FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous match updates for scoring" ON matches 
FOR UPDATE USING (true);

-- Also allow inserts for holes (in case new holes need to be created)
CREATE POLICY "Allow anonymous hole inserts" ON holes 
FOR INSERT WITH CHECK (true);

-- Keep the existing read policies
-- (These should already exist and allow public read access)

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('holes', 'matches') 
ORDER BY tablename, policyname;
