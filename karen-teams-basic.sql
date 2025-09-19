-- Karen Country Club Stableford - Basic Teams Migration
-- Run this in Supabase SQL Editor AFTER running karen-stableford-migration.sql

-- Insert KAREN teams (1-18)
INSERT INTO teams (name, division, color, logo, description, seed, total_players, max_points_available, tournament_id) VALUES
('KAREN 1', 'KAREN', '#10B981', '', 'Karen Country Club Team 1', 1, 4, 0, 2),
('KAREN 2', 'KAREN', '#10B981', '', 'Karen Country Club Team 2', 2, 4, 0, 2),
('KAREN 3', 'KAREN', '#10B981', '', 'Karen Country Club Team 3', 3, 4, 0, 2),
('KAREN 4', 'KAREN', '#10B981', '', 'Karen Country Club Team 4', 4, 4, 0, 2),
('KAREN 5', 'KAREN', '#10B981', '', 'Karen Country Club Team 5', 5, 4, 0, 2),
('KAREN 6', 'KAREN', '#10B981', '', 'Karen Country Club Team 6', 6, 4, 0, 2),
('KAREN 7', 'KAREN', '#10B981', '', 'Karen Country Club Team 7', 7, 4, 0, 2),
('KAREN 8', 'KAREN', '#10B981', '', 'Karen Country Club Team 8', 8, 4, 0, 2),
('KAREN 9', 'KAREN', '#10B981', '', 'Karen Country Club Team 9', 9, 4, 0, 2),
('KAREN 10', 'KAREN', '#10B981', '', 'Karen Country Club Team 10', 10, 4, 0, 2),
('KAREN 11', 'KAREN', '#10B981', '', 'Karen Country Club Team 11', 11, 4, 0, 2),
('KAREN 12', 'KAREN', '#10B981', '', 'Karen Country Club Team 12', 12, 4, 0, 2),
('KAREN 13', 'KAREN', '#10B981', '', 'Karen Country Club Team 13', 13, 4, 0, 2),
('KAREN 14', 'KAREN', '#10B981', '', 'Karen Country Club Team 14', 14, 4, 0, 2),
('KAREN 15', 'KAREN', '#10B981', '', 'Karen Country Club Team 15', 15, 4, 0, 2),
('KAREN 16', 'KAREN', '#10B981', '', 'Karen Country Club Team 16', 16, 4, 0, 2),
('KAREN 17', 'KAREN', '#10B981', '', 'Karen Country Club Team 17', 17, 4, 0, 2),
('KAREN 18', 'KAREN', '#10B981', '', 'Karen Country Club Team 18', 18, 4, 0, 2);

-- Insert VISITOR teams (1-18)
INSERT INTO teams (name, division, color, logo, description, seed, total_players, max_points_available, tournament_id) VALUES
('VISITOR 1', 'VISITOR', '#3B82F6', '', 'Visitor Team 1', 19, 4, 0, 2),
('VISITOR 2', 'VISITOR', '#3B82F6', '', 'Visitor Team 2', 20, 4, 0, 2),
('VISITOR 3', 'VISITOR', '#3B82F6', '', 'Visitor Team 3', 21, 4, 0, 2),
('VISITOR 4', 'VISITOR', '#3B82F6', '', 'Visitor Team 4', 22, 4, 0, 2),
('VISITOR 5', 'VISITOR', '#3B82F6', '', 'Visitor Team 5', 23, 4, 0, 2),
('VISITOR 6', 'VISITOR', '#3B82F6', '', 'Visitor Team 6', 24, 4, 0, 2),
('VISITOR 7', 'VISITOR', '#3B82F6', '', 'Visitor Team 7', 25, 4, 0, 2),
('VISITOR 8', 'VISITOR', '#3B82F6', '', 'Visitor Team 8', 26, 4, 0, 2),
('VISITOR 9', 'VISITOR', '#3B82F6', '', 'Visitor Team 9', 27, 4, 0, 2),
('VISITOR 10', 'VISITOR', '#3B82F6', '', 'Visitor Team 10', 28, 4, 0, 2),
('VISITOR 11', 'VISITOR', '#3B82F6', '', 'Visitor Team 11', 29, 4, 0, 2),
('VISITOR 12', 'VISITOR', '#3B82F6', '', 'Visitor Team 12', 30, 4, 0, 2),
('VISITOR 13', 'VISITOR', '#3B82F6', '', 'Visitor Team 13', 31, 4, 0, 2),
('VISITOR 14', 'VISITOR', '#3B82F6', '', 'Visitor Team 14', 32, 4, 0, 2),
('VISITOR 15', 'VISITOR', '#3B82F6', '', 'Visitor Team 15', 33, 4, 0, 2),
('VISITOR 16', 'VISITOR', '#3B82F6', '', 'Visitor Team 16', 34, 4, 0, 2),
('VISITOR 17', 'VISITOR', '#3B82F6', '', 'Visitor Team 17', 35, 4, 0, 2),
('VISITOR 18', 'VISITOR', '#3B82F6', '', 'Visitor Team 18', 36, 4, 0, 2);

-- Verify the data
SELECT 
  'Teams created' as status,
  COUNT(*) as count
FROM teams 
WHERE tournament_id = 2;

-- Show team summary
SELECT 
  division,
  COUNT(*) as team_count
FROM teams 
WHERE tournament_id = 2
GROUP BY division
ORDER BY division;
