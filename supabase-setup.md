# Supabase Setup Instructions

## 1. Environment Variables

Create a `.env.local` file in your project root with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

Replace with your actual Supabase credentials from your dashboard.

## 2. Database Schema

Run the following SQL in your Supabase SQL editor:

```sql
-- 1. TEAMS table
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  division VARCHAR(20) NOT NULL CHECK (division IN ('Trophy', 'Shield', 'Plaque', 'Bowl', 'Mug')),
  color VARCHAR(7) NOT NULL,
  logo VARCHAR(255),
  description TEXT,
  seed INTEGER NOT NULL,
  total_players INTEGER NOT NULL,
  max_points_available INTEGER NOT NULL,
  session_points JSONB NOT NULL,
  players_per_session JSONB NOT NULL,
  resting_per_session JSONB NOT NULL,
  points_per_match JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. PLAYERS table
CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  team_id INTEGER REFERENCES teams(id),
  handicap INTEGER DEFAULT 0,
  email VARCHAR(255),
  phone VARCHAR(20),
  is_pro BOOLEAN DEFAULT FALSE,
  is_ex_officio BOOLEAN DEFAULT FALSE,
  is_junior BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. MATCHES table
CREATE TABLE matches (
  id SERIAL PRIMARY KEY,
  team_a_id INTEGER REFERENCES teams(id),
  team_b_id INTEGER REFERENCES teams(id),
  team_c_id INTEGER REFERENCES teams(id),
  division VARCHAR(20) NOT NULL CHECK (division IN ('Trophy', 'Shield', 'Plaque', 'Bowl', 'Mug')),
  match_date DATE NOT NULL,
  tee_time TIME NOT NULL,
  tee VARCHAR(10) NOT NULL,
  course VARCHAR(100) DEFAULT 'Muthaiga Golf Club',
  match_type VARCHAR(20) NOT NULL CHECK (match_type IN ('4BBB', 'Foursomes', 'Singles')),
  session VARCHAR(2) NOT NULL CHECK (session IN ('AM', 'PM')),
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in-progress', 'completed')),
  players JSONB NOT NULL,
  game_number INTEGER UNIQUE NOT NULL,
  is_three_way BOOLEAN DEFAULT FALSE,
  is_pro BOOLEAN DEFAULT FALSE,
  is_bye BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. HOLES table
CREATE TABLE holes (
  id SERIAL PRIMARY KEY,
  match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
  hole_number INTEGER NOT NULL CHECK (hole_number BETWEEN 1 AND 18),
  par INTEGER NOT NULL CHECK (par BETWEEN 3 AND 5),
  team_a_score INTEGER,
  team_b_score INTEGER,
  team_a_strokes INTEGER,
  team_b_strokes INTEGER,
  status VARCHAR(20) DEFAULT 'not-started' CHECK (status IN ('not-started', 'in-progress', 'completed')),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, hole_number)
);

-- 5. SCORES table
CREATE TABLE scores (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id) UNIQUE,
  division VARCHAR(20) NOT NULL CHECK (division IN ('Trophy', 'Shield', 'Plaque', 'Bowl', 'Mug')),
  points DECIMAL(5,1) DEFAULT 0,
  matches_played INTEGER DEFAULT 0,
  matches_won INTEGER DEFAULT 0,
  matches_lost INTEGER DEFAULT 0,
  matches_halved INTEGER DEFAULT 0,
  holes_won INTEGER DEFAULT 0,
  holes_lost INTEGER DEFAULT 0,
  total_strokes INTEGER DEFAULT 0,
  strokes_differential INTEGER DEFAULT 0,
  current_round INTEGER DEFAULT 1,
  position INTEGER,
  position_change VARCHAR(10) DEFAULT 'same' CHECK (position_change IN ('up', 'down', 'same')),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_matches_date ON matches(match_date);
CREATE INDEX idx_matches_division ON matches(division);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_holes_match_id ON holes(match_id);
CREATE INDEX idx_scores_division ON scores(division);

-- Enable Row Level Security (RLS)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE holes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access on teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Allow public read access on players" ON players FOR SELECT USING (true);
CREATE POLICY "Allow public read access on matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Allow public read access on holes" ON holes FOR SELECT USING (true);
CREATE POLICY "Allow public read access on scores" ON scores FOR SELECT USING (true);

-- Create policies for authenticated updates (officials only)
CREATE POLICY "Allow authenticated updates on matches" ON matches FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated updates on holes" ON holes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated updates on scores" ON scores FOR UPDATE USING (auth.role() = 'authenticated');
```

## 3. Data Migration

After creating the tables, run the data migration script to populate initial data from JSON files.
