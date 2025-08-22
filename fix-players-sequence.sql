-- =====================================================
-- FIX PLAYERS TABLE SEQUENCE ISSUE
-- =====================================================
-- This script diagnoses and fixes the duplicate key constraint issue
-- for the players table in Supabase

-- 1. Check current sequence value
SELECT currval('players_id_seq') as current_sequence_value;

-- 2. Check highest existing ID in players table
SELECT MAX(id) as highest_player_id FROM players;

-- 3. Check if there are any gaps or issues
SELECT 
  COUNT(*) as total_players,
  MIN(id) as min_id,
  MAX(id) as max_id,
  MAX(id) - MIN(id) + 1 - COUNT(*) as gaps
FROM players;

-- 4. Show the sequence info
SELECT 
  schemaname,
  sequencename,
  last_value,
  start_value,
  increment_by,
  max_value,
  min_value,
  cache_value,
  log_cnt,
  is_cycled,
  is_called
FROM pg_sequences 
WHERE sequencename = 'players_id_seq';

-- 5. Fix the sequence by setting it to the correct value
-- This sets the sequence to be higher than the highest existing ID
SELECT setval('players_id_seq', COALESCE((SELECT MAX(id) FROM players), 1), true);

-- 6. Verify the fix worked
SELECT currval('players_id_seq') as fixed_sequence_value;

-- 7. Test insertion with a dummy record (will be deleted immediately)
INSERT INTO players (name, team_id, is_pro, is_ex_officio, is_junior, position) 
VALUES ('TEST_SEQUENCE_FIX', 1, false, false, false, 'Test Player') 
RETURNING id, name;

-- 8. Delete the test record
DELETE FROM players WHERE name = 'TEST_SEQUENCE_FIX';

-- 9. Final verification
SELECT 
  'Sequence fixed successfully' as status,
  currval('players_id_seq') as current_sequence,
  (SELECT MAX(id) FROM players) as max_existing_id
;
