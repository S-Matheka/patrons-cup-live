-- Multi-Tournament Database Migration Script
-- This script adds tournament support to the existing database

-- 1. Create tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'archived')),
  format VARCHAR(50) DEFAULT 'patrons_cup' CHECK (format IN ('patrons_cup', 'custom', 'stroke_play')),
  divisions JSONB DEFAULT '["Trophy", "Shield", "Plaque", "Bowl", "Mug"]',
  point_system JSONB DEFAULT '{
    "friAM4BBB": {"win": 5, "tie": 2.5},
    "friPMFoursomes": {"trophy": {"win": 3, "tie": 1.5}, "bowl": {"win": 4, "tie": 2}},
    "satAM4BBB": {"win": 5, "tie": 2.5},
    "satPMFoursomes": {"trophy": {"win": 3, "tie": 1.5}, "bowl": {"win": 4, "tie": 2}},
    "sunSingles": {"win": 3, "tie": 1.5}
  }',
  settings JSONB DEFAULT '{
    "course": "Muthaiga Golf Club",
    "max_players_per_team": 12,
    "allow_three_way_matches": true,
    "enable_pro_matches": true
  }',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insert current tournament (Patrons Cup 2025)
INSERT INTO tournaments (name, slug, description, start_date, end_date, status, format) 
VALUES (
  'Patrons Cup 2025', 
  'patrons-cup-2025', 
  'Annual Patrons Cup Tournament at Muthaiga Golf Club', 
  '2025-08-22', 
  '2025-08-24', 
  'active',
  'patrons_cup'
) ON CONFLICT (slug) DO NOTHING;

-- 3. Add tournament_id columns to existing tables
ALTER TABLE teams ADD COLUMN IF NOT EXISTS tournament_id INTEGER;
ALTER TABLE players ADD COLUMN IF NOT EXISTS tournament_id INTEGER;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS tournament_id INTEGER;
ALTER TABLE scores ADD COLUMN IF NOT EXISTS tournament_id INTEGER;

-- 4. Set default tournament_id for existing data (assuming Patrons Cup 2025 has id=1)
UPDATE teams SET tournament_id = 1 WHERE tournament_id IS NULL;
UPDATE players SET tournament_id = 1 WHERE tournament_id IS NULL;
UPDATE matches SET tournament_id = 1 WHERE tournament_id IS NULL;
UPDATE scores SET tournament_id = 1 WHERE tournament_id IS NULL;

-- 5. Make tournament_id NOT NULL after setting defaults
ALTER TABLE teams ALTER COLUMN tournament_id SET NOT NULL;
ALTER TABLE players ALTER COLUMN tournament_id SET NOT NULL;
ALTER TABLE matches ALTER COLUMN tournament_id SET NOT NULL;
ALTER TABLE scores ALTER COLUMN tournament_id SET NOT NULL;

-- 6. Add foreign key constraints
ALTER TABLE teams ADD CONSTRAINT IF NOT EXISTS fk_teams_tournament 
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;
ALTER TABLE players ADD CONSTRAINT IF NOT EXISTS fk_players_tournament 
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;
ALTER TABLE matches ADD CONSTRAINT IF NOT EXISTS fk_matches_tournament 
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;
ALTER TABLE scores ADD CONSTRAINT IF NOT EXISTS fk_scores_tournament 
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_teams_tournament_id ON teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_players_tournament_id ON players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament_id ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_scores_tournament_id ON scores(tournament_id);

-- 8. Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_teams_tournament_division ON teams(tournament_id, division);
CREATE INDEX IF NOT EXISTS idx_players_tournament_team ON players(tournament_id, team_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament_date ON matches(tournament_id, match_date);
CREATE INDEX IF NOT EXISTS idx_matches_tournament_status ON matches(tournament_id, status);

-- 9. Add tournament_id to unique constraints where needed
-- Note: game_number should be unique per tournament, not globally
DROP INDEX IF EXISTS matches_game_number_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_matches_tournament_game_number 
  ON matches(tournament_id, game_number);

-- 10. Create view for easy tournament data access
CREATE OR REPLACE VIEW tournament_summary AS
SELECT 
  t.id,
  t.name,
  t.slug,
  t.status,
  t.start_date,
  t.end_date,
  COUNT(DISTINCT teams.id) as team_count,
  COUNT(DISTINCT players.id) as player_count,
  COUNT(DISTINCT matches.id) as match_count,
  COUNT(DISTINCT CASE WHEN matches.status = 'completed' THEN matches.id END) as completed_matches
FROM tournaments t
LEFT JOIN teams ON teams.tournament_id = t.id
LEFT JOIN players ON players.tournament_id = t.id
LEFT JOIN matches ON matches.tournament_id = t.id
GROUP BY t.id, t.name, t.slug, t.status, t.start_date, t.end_date;

-- 11. Create function to get tournament data
CREATE OR REPLACE FUNCTION get_tournament_data(tournament_slug TEXT)
RETURNS TABLE (
  tournament_id INTEGER,
  tournament_name TEXT,
  tournament_slug TEXT,
  team_count BIGINT,
  player_count BIGINT,
  match_count BIGINT,
  completed_matches BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ts.id,
    ts.name,
    ts.slug,
    ts.team_count,
    ts.player_count,
    ts.match_count,
    ts.completed_matches
  FROM tournament_summary ts
  WHERE ts.slug = tournament_slug;
END;
$$ LANGUAGE plpgsql;

-- 12. Add RLS (Row Level Security) policies for multi-tenant data
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your authentication setup)
CREATE POLICY "Allow all operations on tournaments" ON tournaments FOR ALL USING (true);
CREATE POLICY "Allow all operations on teams" ON teams FOR ALL USING (true);
CREATE POLICY "Allow all operations on players" ON players FOR ALL USING (true);
CREATE POLICY "Allow all operations on matches" ON matches FOR ALL USING (true);
CREATE POLICY "Allow all operations on scores" ON scores FOR ALL USING (true);

-- 13. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tournaments_updated_at 
  BEFORE UPDATE ON tournaments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 14. Insert sample tournaments for testing
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

-- 15. Verify migration
SELECT 
  'Migration completed successfully' as status,
  COUNT(*) as tournament_count
FROM tournaments;

-- Show tournament summary
SELECT * FROM tournament_summary ORDER BY start_date DESC;
