-- Migration to add individual player scoring columns for Nancy Millar Trophy
-- This supports Foursomes Stableford format with individual player scores

-- Add individual player score columns to holes table
ALTER TABLE holes ADD COLUMN IF NOT EXISTS player1_score INTEGER;
ALTER TABLE holes ADD COLUMN IF NOT EXISTS player2_score INTEGER;
ALTER TABLE holes ADD COLUMN IF NOT EXISTS player3_score INTEGER;
ALTER TABLE holes ADD COLUMN IF NOT EXISTS player4_score INTEGER;

-- Add individual player handicap columns
ALTER TABLE holes ADD COLUMN IF NOT EXISTS player1_handicap INTEGER;
ALTER TABLE holes ADD COLUMN IF NOT EXISTS player2_handicap INTEGER;
ALTER TABLE holes ADD COLUMN IF NOT EXISTS player3_handicap INTEGER;
ALTER TABLE holes ADD COLUMN IF NOT EXISTS player4_handicap INTEGER;

-- Add individual player points columns
ALTER TABLE holes ADD COLUMN IF NOT EXISTS player1_points INTEGER;
ALTER TABLE holes ADD COLUMN IF NOT EXISTS player2_points INTEGER;
ALTER TABLE holes ADD COLUMN IF NOT EXISTS player3_points INTEGER;
ALTER TABLE holes ADD COLUMN IF NOT EXISTS player4_points INTEGER;

-- Add player identification columns
ALTER TABLE holes ADD COLUMN IF NOT EXISTS player1_id INTEGER;
ALTER TABLE holes ADD COLUMN IF NOT EXISTS player2_id INTEGER;
ALTER TABLE holes ADD COLUMN IF NOT EXISTS player3_id INTEGER;
ALTER TABLE holes ADD COLUMN IF NOT EXISTS player4_id INTEGER;

-- Add foreign key constraints for player IDs
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE holes ADD CONSTRAINT fk_holes_player1 
            FOREIGN KEY (player1_id) REFERENCES players(id);
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE holes ADD CONSTRAINT fk_holes_player2 
            FOREIGN KEY (player2_id) REFERENCES players(id);
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE holes ADD CONSTRAINT fk_holes_player3 
            FOREIGN KEY (player3_id) REFERENCES players(id);
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE holes ADD CONSTRAINT fk_holes_player4 
            FOREIGN KEY (player4_id) REFERENCES players(id);
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Add comments to explain the new columns
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
