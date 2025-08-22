-- =====================================================
-- DIAGNOSE PLAYERS TABLE ISSUES
-- =====================================================
-- Run this first to understand what's happening

-- 1. Show all players with their IDs (to see the pattern)
SELECT id, name, team_id, position, created_at 
FROM players 
ORDER BY id;

-- 2. Check for duplicate IDs (shouldn't be any, but let's verify)
SELECT id, COUNT(*) as count
FROM players 
GROUP BY id 
HAVING COUNT(*) > 1;

-- 3. Check sequence status
SELECT 
  last_value as sequence_current_value,
  (SELECT MAX(id) FROM players) as highest_existing_id,
  last_value - (SELECT MAX(id) FROM players) as sequence_gap
FROM pg_sequences 
WHERE sequencename = 'players_id_seq';

-- 4. Show recent players (last 10)
SELECT id, name, team_id, position, created_at 
FROM players 
ORDER BY created_at DESC 
LIMIT 10;
