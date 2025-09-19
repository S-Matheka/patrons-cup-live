-- Add individual player scoring columns to holes table
-- This fixes the "Error fetching matches" issue

ALTER TABLE holes ADD COLUMN IF NOT EXISTS player1_score INTEGER;
ALTER TABLE holes ADD COLUMN IF NOT EXISTS player2_score INTEGER;
ALTER TABLE holes ADD COLUMN IF NOT EXISTS player3_score INTEGER;
ALTER TABLE holes ADD COLUMN IF NOT EXISTS player4_score INTEGER;

ALTER TABLE holes ADD COLUMN IF NOT EXISTS player1_handicap INTEGER;
ALTER TABLE holes ADD COLUMN IF NOT EXISTS player2_handicap INTEGER;
ALTER TABLE holes ADD COLUMN IF NOT EXISTS player3_handicap INTEGER;
ALTER TABLE holes ADD COLUMN IF NOT EXISTS player4_handicap INTEGER;

ALTER TABLE holes ADD COLUMN IF NOT EXISTS player1_points INTEGER;
ALTER TABLE holes ADD COLUMN IF NOT EXISTS player2_points INTEGER;
ALTER TABLE holes ADD COLUMN IF NOT EXISTS player3_points INTEGER;
ALTER TABLE holes ADD COLUMN IF NOT EXISTS player4_points INTEGER;

ALTER TABLE holes ADD COLUMN IF NOT EXISTS player1_id INTEGER;
ALTER TABLE holes ADD COLUMN IF NOT EXISTS player2_id INTEGER;
ALTER TABLE holes ADD COLUMN IF NOT EXISTS player3_id INTEGER;
ALTER TABLE holes ADD COLUMN IF NOT EXISTS player4_id INTEGER;

-- Add comments to explain the columns
COMMENT ON COLUMN holes.player1_score IS 'Individual score for player 1 (Team A, Player 1)';
COMMENT ON COLUMN holes.player2_score IS 'Individual score for player 2 (Team A, Player 2)';
COMMENT ON COLUMN holes.player3_score IS 'Individual score for player 3 (Team B, Player 1)';
COMMENT ON COLUMN holes.player4_score IS 'Individual score for player 4 (Team B, Player 2)';

COMMENT ON COLUMN holes.player1_handicap IS 'Playing handicap for player 1';
COMMENT ON COLUMN holes.player2_handicap IS 'Playing handicap for player 2';
COMMENT ON COLUMN holes.player3_handicap IS 'Playing handicap for player 3';
COMMENT ON COLUMN holes.player4_handicap IS 'Playing handicap for player 4';

COMMENT ON COLUMN holes.player1_points IS 'Stableford points for player 1';
COMMENT ON COLUMN holes.player2_points IS 'Stableford points for player 2';
COMMENT ON COLUMN holes.player3_points IS 'Stableford points for player 3';
COMMENT ON COLUMN holes.player4_points IS 'Stableford points for player 4';

COMMENT ON COLUMN holes.player1_id IS 'Player ID for player 1';
COMMENT ON COLUMN holes.player2_id IS 'Player ID for player 2';
COMMENT ON COLUMN holes.player3_id IS 'Player ID for player 3';
COMMENT ON COLUMN holes.player4_id IS 'Player ID for player 4';
