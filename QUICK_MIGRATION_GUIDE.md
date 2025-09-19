# 🚀 Quick Migration Guide - Fix Tournament Loading Error

## **❌ Current Error**
```
Error: Error loading tournaments: {}
```

## **🔍 Root Cause**
The database migration hasn't been applied yet, so:
- `tournaments` table doesn't exist
- `tournament_id` columns don't exist
- Context is trying to load from non-existent tables

## **✅ Quick Fix (2 minutes)**

### **Step 1: Open Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **"New Query"**

### **Step 2: Apply Migration**
Copy and paste this **entire script** into the SQL Editor:

```sql
-- Multi-Tournament Migration - Apply This in Supabase SQL Editor
-- Copy and paste this entire script into your Supabase SQL Editor and run it

-- 1. Create tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'archived')),
  format VARCHAR(50) DEFAULT 'patrons_cup' CHECK (format IN ('patrons_cup', 'stableford', 'stroke_play', 'custom')),
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
    "maxPlayersPerTeam": 12,
    "allowThreeWayMatches": true,
    "enableProMatches": true
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

-- 11. Insert sample tournaments for testing
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

-- 12. Verify migration
SELECT 
  'Migration completed successfully' as status,
  COUNT(*) as tournament_count
FROM tournaments;

-- Show tournament summary
SELECT * FROM tournament_summary ORDER BY start_date DESC;
```

### **Step 3: Execute Migration**
1. Click **"Run"** button in the SQL Editor
2. Wait for the script to complete (should take 10-30 seconds)
3. You should see "Migration completed successfully" message

### **Step 4: Test Application**
1. **Restart your development server**: `npm run dev`
2. **Refresh your browser**
3. **Check the navigation bar** - you should now see the tournament selector
4. **Verify no more errors** in the browser console

## **🎯 Expected Results**

After applying the migration:
- ✅ **Tournament selector appears** in navigation bar
- ✅ **"Patrons Cup 2025" shows as active** tournament
- ✅ **All existing data loads** normally
- ✅ **No more "Loading tournament data..."** message
- ✅ **No more console errors**

## **🔧 If Migration Fails**

If you encounter any errors during migration:
1. **Check database permissions** - ensure you have admin access
2. **Run migration in smaller chunks** - execute sections separately
3. **Check for existing data conflicts** - some constraints might fail

## **📞 Need Help?**

If you still encounter issues:
1. **Check the browser console** for error messages
2. **Verify the migration ran successfully** in Supabase
3. **Restart your development server** after migration
4. **Test with a fresh browser session** to clear any cached state

The migration is designed to be safe and non-destructive - your existing data will be preserved and accessible as the default "Patrons Cup 2025" tournament.

## **🎉 After Successful Migration**

You'll have:
- ✅ **Multi-tournament support** fully functional
- ✅ **Tournament selector** in navigation
- ✅ **Data isolation** between tournaments
- ✅ **Historical data access** for past tournaments
- ✅ **Scalable system** for future tournaments

**This should fix the tournament loading error completely!** 🚀
