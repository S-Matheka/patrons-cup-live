-- =====================================================
-- FIXED DIAGNOSIS FOR PLAYERS TABLE
-- =====================================================
-- This fixes the type mismatch issue

-- 1. Check the sequence and highest ID (fixed version)
SELECT 
  'Current sequence:' as info, 
  last_value::text as value
FROM pg_sequences 
WHERE sequencename = 'players_id_seq'
UNION ALL
SELECT 
  'Highest player ID:' as info, 
  COALESCE(MAX(id), 0)::text as value  
FROM players;

-- 2. More detailed diagnosis
SELECT 
  (SELECT last_value FROM pg_sequences WHERE sequencename = 'players_id_seq') as sequence_value,
  (SELECT MAX(id) FROM players) as highest_id,
  (SELECT COUNT(*) FROM players) as total_players;

-- 3. Show the gap (if any)
SELECT 
  CASE 
    WHEN (SELECT last_value FROM pg_sequences WHERE sequencename = 'players_id_seq') <= (SELECT COALESCE(MAX(id), 0) FROM players)
    THEN 'SEQUENCE IS BEHIND - This causes duplicate key errors!'
    ELSE 'Sequence is OK'
  END as diagnosis;
