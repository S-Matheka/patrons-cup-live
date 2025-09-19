-- Fix Existing Tables Migration
-- Run these commands ONE BY ONE in Supabase SQL Editor

-- STEP 1: Add updated_at to existing tables to satisfy triggers
ALTER TABLE teams ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE players ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE matches ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE scores ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- STEP 2: Add tournament_id columns to existing tables
ALTER TABLE teams ADD COLUMN IF NOT EXISTS tournament_id INTEGER;
ALTER TABLE players ADD COLUMN IF NOT EXISTS tournament_id INTEGER;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS tournament_id INTEGER;
ALTER TABLE scores ADD COLUMN IF NOT EXISTS tournament_id INTEGER;

-- STEP 3: Set default tournament_id for existing data
UPDATE teams SET tournament_id = 1 WHERE tournament_id IS NULL;
UPDATE players SET tournament_id = 1 WHERE tournament_id IS NULL;
UPDATE matches SET tournament_id = 1 WHERE tournament_id IS NULL;
UPDATE scores SET tournament_id = 1 WHERE tournament_id IS NULL;

-- STEP 4: Make tournament_id NOT NULL after setting defaults
ALTER TABLE teams ALTER COLUMN tournament_id SET NOT NULL;
ALTER TABLE players ALTER COLUMN tournament_id SET NOT NULL;
ALTER TABLE matches ALTER COLUMN tournament_id SET NOT NULL;
ALTER TABLE scores ALTER COLUMN tournament_id SET NOT NULL;

-- STEP 5: Add foreign key constraints
DO $$ 
BEGIN
    -- Add foreign key for teams
    BEGIN
        ALTER TABLE teams ADD CONSTRAINT fk_teams_tournament 
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    -- Add foreign key for players
    BEGIN
        ALTER TABLE players ADD CONSTRAINT fk_players_tournament 
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    -- Add foreign key for matches
    BEGIN
        ALTER TABLE matches ADD CONSTRAINT fk_matches_tournament 
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    -- Add foreign key for scores
    BEGIN
        ALTER TABLE scores ADD CONSTRAINT fk_scores_tournament 
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- STEP 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_teams_tournament_id ON teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_players_tournament_id ON players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament_id ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_scores_tournament_id ON scores(tournament_id);

-- STEP 7: Handle unique constraints
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'matches_game_number_key' 
               AND table_name = 'matches') THEN
        ALTER TABLE matches DROP CONSTRAINT matches_game_number_key;
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_matches_tournament_game_number 
  ON matches(tournament_id, game_number);

-- STEP 8: Insert sample tournaments
INSERT INTO tournaments (name, slug, description, start_date, end_date, status, format) 
VALUES 
  (
    'Patrons Cup 2024', 
    'patrons-cup-2024', 
    'Previous year Patrons Cup Tournament', 
    '2024-08-22', 
    '2024-08-24', 
    'completed',
    'patrons_cup'
  ),
  (
    'Spring Championship 2025', 
    'spring-championship-2025', 
    'Spring season championship tournament', 
    '2025-03-15', 
    '2025-03-17', 
    'upcoming',
    'patrons_cup'
  )
ON CONFLICT (slug) DO NOTHING;

-- STEP 9: Verify migration
SELECT 
  'Migration completed successfully' as status,
  COUNT(*) as tournament_count
FROM tournaments;

-- Show tournament summary
SELECT 
  t.id,
  t.name,
  t.slug,
  t.status,
  t.start_date,
  t.end_date,
  COUNT(DISTINCT teams.id) as team_count,
  COUNT(DISTINCT players.id) as player_count,
  COUNT(DISTINCT matches.id) as match_count
FROM tournaments t
LEFT JOIN teams ON teams.tournament_id = t.id
LEFT JOIN players ON players.tournament_id = t.id
LEFT JOIN matches ON matches.tournament_id = t.id
GROUP BY t.id, t.name, t.slug, t.status, t.start_date, t.end_date
ORDER BY t.start_date DESC;
