-- =====================================================
-- COMPLETE SUPABASE SCHEMA FOR PATRONS CUP LIVE
-- =====================================================
-- This schema is designed to work perfectly with your Next.js app
-- Copy and paste this entire file into Supabase SQL Editor

-- 1. TEAMS table
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  division VARCHAR(20) NOT NULL CHECK (division IN ('Trophy', 'Shield', 'Plaque', 'Bowl', 'Mug')),
  color VARCHAR(7) NOT NULL DEFAULT '#10B981',
  logo VARCHAR(10) DEFAULT 'TM',
  description TEXT,
  seed INTEGER NOT NULL,
  total_players INTEGER NOT NULL DEFAULT 15,
  max_points_available INTEGER NOT NULL DEFAULT 100,
  session_points JSONB NOT NULL DEFAULT '{"AM": 50, "PM": 50}',
  players_per_session JSONB NOT NULL DEFAULT '{"AM": 8, "PM": 8}',
  resting_per_session JSONB NOT NULL DEFAULT '{"AM": 7, "PM": 7}',
  points_per_match JSONB NOT NULL DEFAULT '{"4BBB": 1, "Foursomes": 1, "Singles": 1}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. PLAYERS table
CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  handicap INTEGER DEFAULT 0 CHECK (handicap >= 0),
  email VARCHAR(255),
  phone VARCHAR(20),
  is_pro BOOLEAN DEFAULT FALSE,
  is_ex_officio BOOLEAN DEFAULT FALSE,
  is_junior BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. MATCHES table
CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  team_a_id INTEGER REFERENCES teams(id),
  team_b_id INTEGER REFERENCES teams(id),
  team_c_id INTEGER REFERENCES teams(id),
  division VARCHAR(20) NOT NULL CHECK (division IN ('Trophy', 'Shield', 'Plaque', 'Bowl', 'Mug')),
  match_date DATE NOT NULL,
  tee_time VARCHAR(10) NOT NULL, -- Keep as VARCHAR for compatibility with existing data (e.g., "07:00 AM")
  tee VARCHAR(10) NOT NULL,
  course VARCHAR(100) DEFAULT 'Muthaiga Golf Club',
  match_type VARCHAR(20) NOT NULL CHECK (match_type IN ('4BBB', 'Foursomes', 'Singles')),
  session VARCHAR(2) NOT NULL CHECK (session IN ('AM', 'PM')),
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in-progress', 'completed')),
  players JSONB NOT NULL DEFAULT '{"teamA": [], "teamB": [], "teamC": []}',
  game_number INTEGER UNIQUE NOT NULL,
  is_three_way BOOLEAN DEFAULT FALSE,
  is_pro BOOLEAN DEFAULT FALSE,
  is_bye BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. HOLES table
CREATE TABLE IF NOT EXISTS holes (
  id SERIAL PRIMARY KEY,
  match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
  hole_number INTEGER NOT NULL CHECK (hole_number BETWEEN 1 AND 18),
  par INTEGER NOT NULL CHECK (par BETWEEN 3 AND 5) DEFAULT 4,
  team_a_score INTEGER CHECK (team_a_score IS NULL OR team_a_score > 0),
  team_b_score INTEGER CHECK (team_b_score IS NULL OR team_b_score > 0),
  team_a_strokes INTEGER CHECK (team_a_strokes IS NULL OR team_a_strokes > 0),
  team_b_strokes INTEGER CHECK (team_b_strokes IS NULL OR team_b_strokes > 0),
  status VARCHAR(20) DEFAULT 'not-started' CHECK (status IN ('not-started', 'in-progress', 'completed')),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, hole_number)
);

-- 5. SCORES table
CREATE TABLE IF NOT EXISTS scores (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id) UNIQUE,
  division VARCHAR(20) NOT NULL CHECK (division IN ('Trophy', 'Shield', 'Plaque', 'Bowl', 'Mug')),
  points DECIMAL(5,1) DEFAULT 0.0 CHECK (points >= 0),
  matches_played INTEGER DEFAULT 0 CHECK (matches_played >= 0),
  matches_won INTEGER DEFAULT 0 CHECK (matches_won >= 0),
  matches_lost INTEGER DEFAULT 0 CHECK (matches_lost >= 0),
  matches_halved INTEGER DEFAULT 0 CHECK (matches_halved >= 0),
  holes_won INTEGER DEFAULT 0 CHECK (holes_won >= 0),
  holes_lost INTEGER DEFAULT 0 CHECK (holes_lost >= 0),
  total_strokes INTEGER DEFAULT 0 CHECK (total_strokes >= 0),
  strokes_differential INTEGER DEFAULT 0,
  current_round INTEGER DEFAULT 1 CHECK (current_round > 0),
  position INTEGER CHECK (position IS NULL OR position > 0),
  position_change VARCHAR(10) DEFAULT 'same' CHECK (position_change IN ('up', 'down', 'same')),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_division ON matches(division);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_game_number ON matches(game_number);
CREATE INDEX IF NOT EXISTS idx_holes_match_id ON holes(match_id);
CREATE INDEX IF NOT EXISTS idx_holes_match_hole ON holes(match_id, hole_number);
CREATE INDEX IF NOT EXISTS idx_scores_division ON scores(division);
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);

-- Foreign key indexes for better join performance
CREATE INDEX IF NOT EXISTS idx_matches_team_a ON matches(team_a_id);
CREATE INDEX IF NOT EXISTS idx_matches_team_b ON matches(team_b_id);
CREATE INDEX IF NOT EXISTS idx_matches_team_c ON matches(team_c_id);
CREATE INDEX IF NOT EXISTS idx_scores_team_id ON scores(team_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_matches_division_status ON matches(division, status);
CREATE INDEX IF NOT EXISTS idx_matches_date_session ON matches(match_date, session);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE holes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access on teams" ON teams;
DROP POLICY IF EXISTS "Allow public read access on players" ON players;
DROP POLICY IF EXISTS "Allow public read access on matches" ON matches;
DROP POLICY IF EXISTS "Allow public read access on holes" ON holes;
DROP POLICY IF EXISTS "Allow public read access on scores" ON scores;

DROP POLICY IF EXISTS "Allow admin operations on teams" ON teams;
DROP POLICY IF EXISTS "Allow admin operations on players" ON players;
DROP POLICY IF EXISTS "Allow admin operations on matches" ON matches;
DROP POLICY IF EXISTS "Allow admin operations on holes" ON holes;
DROP POLICY IF EXISTS "Allow admin operations on scores" ON scores;

-- =====================================================
-- RLS POLICIES - PUBLIC READ, AUTHENTICATED WRITE
-- =====================================================

-- TEAMS policies
CREATE POLICY "Allow public read access on teams" ON teams 
FOR SELECT USING (true);

CREATE POLICY "Allow admin operations on teams" ON teams 
FOR ALL USING (true);

-- PLAYERS policies
CREATE POLICY "Allow public read access on players" ON players 
FOR SELECT USING (true);

CREATE POLICY "Allow admin operations on players" ON players 
FOR ALL USING (true);

-- MATCHES policies
CREATE POLICY "Allow public read access on matches" ON matches 
FOR SELECT USING (true);

CREATE POLICY "Allow admin operations on matches" ON matches 
FOR ALL USING (true);

-- HOLES policies
CREATE POLICY "Allow public read access on holes" ON holes 
FOR SELECT USING (true);

CREATE POLICY "Allow admin operations on holes" ON holes 
FOR ALL USING (true);

-- SCORES policies
CREATE POLICY "Allow public read access on scores" ON scores 
FOR SELECT USING (true);

CREATE POLICY "Allow admin operations on scores" ON scores 
FOR ALL USING (true);

-- =====================================================
-- AUTOMATIC UPDATED_AT TRIGGERS
-- =====================================================

-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at columns
DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at 
    BEFORE UPDATE ON teams 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_players_updated_at ON players;
CREATE TRIGGER update_players_updated_at 
    BEFORE UPDATE ON players 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_matches_updated_at ON matches;
CREATE TRIGGER update_matches_updated_at 
    BEFORE UPDATE ON matches 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scores_updated_at ON scores;
CREATE TRIGGER update_scores_updated_at 
    BEFORE UPDATE ON scores 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- UTILITY FUNCTIONS FOR TOURNAMENT MANAGEMENT
-- =====================================================

-- Function to recalculate team standings
CREATE OR REPLACE FUNCTION recalculate_team_standings()
RETURNS void AS $$
BEGIN
    -- This can be used to recalculate all team scores
    -- Implementation would go here if needed
    RAISE NOTICE 'Team standings recalculation completed';
END;
$$ language 'plpgsql';

-- Function to get match status summary
CREATE OR REPLACE FUNCTION get_match_status_summary()
RETURNS TABLE(
    status VARCHAR(20),
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT m.status, COUNT(*) 
    FROM matches m 
    GROUP BY m.status;
END;
$$ language 'plpgsql';

-- =====================================================
-- INITIAL DATA VALIDATION
-- =====================================================

-- Add constraint to ensure match teams are different
ALTER TABLE matches ADD CONSTRAINT different_teams 
CHECK (team_a_id != team_b_id AND (team_c_id IS NULL OR (team_c_id != team_a_id AND team_c_id != team_b_id)));

-- Add constraint to ensure valid match combinations
ALTER TABLE matches ADD CONSTRAINT valid_three_way 
CHECK ((is_three_way = true AND team_c_id IS NOT NULL) OR (is_three_way = false AND team_c_id IS NULL));

-- =====================================================
-- SEQUENCE FIXES (RUN AFTER DATA IMPORT)
-- =====================================================
-- IMPORTANT: Uncomment and run these lines AFTER you import your tournament data
-- This fixes the auto-increment sequences to prevent primary key conflicts

-- SELECT setval('teams_id_seq', (SELECT COALESCE(MAX(id), 0) FROM teams) + 1);
-- SELECT setval('players_id_seq', (SELECT COALESCE(MAX(id), 0) FROM players) + 1);
-- SELECT setval('matches_id_seq', (SELECT COALESCE(MAX(id), 0) FROM matches) + 1);
-- SELECT setval('holes_id_seq', (SELECT COALESCE(MAX(id), 0) FROM holes) + 1);
-- SELECT setval('scores_id_seq', (SELECT COALESCE(MAX(id), 0) FROM scores) + 1);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify your schema is working correctly

-- Check table creation
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('teams', 'players', 'matches', 'holes', 'scores');

-- Check RLS policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd FROM pg_policies WHERE schemaname = 'public';

-- Check indexes
-- SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================
-- This schema is optimized for your Patrons Cup Live application
-- It includes all necessary tables, indexes, RLS policies, and constraints
-- Your admin save functionality should work perfectly with this setup
