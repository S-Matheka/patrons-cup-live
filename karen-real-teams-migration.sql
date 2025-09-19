-- Karen Country Club Stableford - Real Team Data Migration
-- This replaces the sample data with the actual 35 teams from the tournament

-- First, let's clean up the sample data and insert the real teams
DELETE FROM players WHERE tournament_id = 2;
DELETE FROM teams WHERE tournament_id = 2;

-- Insert the real teams (35 teams total)
INSERT INTO teams (name, division, color, description, seed, total_players, max_points_available, session_points, players_per_session, resting_per_session, points_per_match, tournament_id)
VALUES 
  -- KAREN teams (1-18)
  ('KAREN 1', 'KAREN', '#FF6B6B', 'Karen Country Club Team 1', 1, 4, 0, 0, 4, 0, 0, 2),
  ('KAREN 2', 'KAREN', '#4ECDC4', 'Karen Country Club Team 2', 2, 4, 0, 0, 4, 0, 0, 2),
  ('KAREN 3', 'KAREN', '#45B7D1', 'Karen Country Club Team 3', 3, 4, 0, 0, 4, 0, 0, 2),
  ('KAREN 4', 'KAREN', '#96CEB4', 'Karen Country Club Team 4', 4, 4, 0, 0, 4, 0, 0, 2),
  ('KAREN 5', 'KAREN', '#FECA57', 'Karen Country Club Team 5', 5, 4, 0, 0, 4, 0, 0, 2),
  ('KAREN 6', 'KAREN', '#FF9FF3', 'Karen Country Club Team 6', 6, 4, 0, 0, 4, 0, 0, 2),
  ('KAREN 7', 'KAREN', '#54A0FF', 'Karen Country Club Team 7', 7, 4, 0, 0, 4, 0, 0, 2),
  ('KAREN 8', 'KAREN', '#5F27CD', 'Karen Country Club Team 8', 8, 4, 0, 0, 4, 0, 0, 2),
  ('KAREN 9', 'KAREN', '#00D2D3', 'Karen Country Club Team 9', 9, 4, 0, 0, 4, 0, 0, 2),
  ('KAREN 10', 'KAREN', '#FF9F43', 'Karen Country Club Team 10', 10, 4, 0, 0, 4, 0, 0, 2),
  ('KAREN 11', 'KAREN', '#10AC84', 'Karen Country Club Team 11', 11, 4, 0, 0, 4, 0, 0, 2),
  ('KAREN 12', 'KAREN', '#EE5A24', 'Karen Country Club Team 12', 12, 4, 0, 0, 4, 0, 0, 2),
  ('KAREN 13', 'KAREN', '#0984E3', 'Karen Country Club Team 13', 13, 4, 0, 0, 4, 0, 0, 2),
  ('KAREN 14', 'KAREN', '#A29BFE', 'Karen Country Club Team 14', 14, 4, 0, 0, 4, 0, 0, 2),
  ('KAREN 15', 'KAREN', '#FD79A8', 'Karen Country Club Team 15', 15, 4, 0, 0, 4, 0, 0, 2),
  ('KAREN 16', 'KAREN', '#6C5CE7', 'Karen Country Club Team 16', 16, 4, 0, 0, 4, 0, 0, 2),
  ('KAREN 17', 'KAREN', '#FDCB6E', 'Karen Country Club Team 17', 17, 4, 0, 0, 4, 0, 0, 2),
  ('KAREN 18', 'KAREN', '#E17055', 'Karen Country Club Team 18', 18, 4, 0, 0, 4, 0, 0, 2),
  
  -- VISITOR teams (1-18)
  ('VISITOR 1', 'VISITOR', '#74B9FF', 'Visitor Team 1', 19, 4, 0, 0, 4, 0, 0, 2),
  ('VISITOR 2', 'VISITOR', '#A29BFE', 'Visitor Team 2', 20, 4, 0, 0, 4, 0, 0, 2),
  ('VISITOR 3', 'VISITOR', '#FD79A8', 'Visitor Team 3', 21, 4, 0, 0, 4, 0, 0, 2),
  ('VISITOR 4', 'VISITOR', '#6C5CE7', 'Visitor Team 4', 22, 4, 0, 0, 4, 0, 0, 2),
  ('VISITOR 5', 'VISITOR', '#FDCB6E', 'Visitor Team 5', 23, 4, 0, 0, 4, 0, 0, 2),
  ('VISITOR 6', 'VISITOR', '#E17055', 'Visitor Team 6', 24, 4, 0, 0, 4, 0, 0, 2),
  ('VISITOR 7', 'VISITOR', '#00B894', 'Visitor Team 7', 25, 4, 0, 0, 4, 0, 0, 2),
  ('VISITOR 8', 'VISITOR', '#E84393', 'Visitor Team 8', 26, 4, 0, 0, 4, 0, 0, 2),
  ('VISITOR 9', 'VISITOR', '#00CEC9', 'Visitor Team 9', 27, 4, 0, 0, 4, 0, 0, 2),
  ('VISITOR 10', 'VISITOR', '#FDCB6E', 'Visitor Team 10', 28, 4, 0, 0, 4, 0, 0, 2),
  ('VISITOR 11', 'VISITOR', '#E17055', 'Visitor Team 11', 29, 4, 0, 0, 4, 0, 0, 2),
  ('VISITOR 12', 'VISITOR', '#00B894', 'Visitor Team 12', 30, 4, 0, 0, 4, 0, 0, 2),
  ('VISITOR 13', 'VISITOR', '#E84393', 'Visitor Team 13', 31, 4, 0, 0, 4, 0, 0, 2),
  ('VISITOR 14', 'VISITOR', '#00CEC9', 'Visitor Team 14', 32, 4, 0, 0, 4, 0, 0, 2),
  ('VISITOR 15', 'VISITOR', '#FDCB6E', 'Visitor Team 15', 33, 4, 0, 0, 4, 0, 0, 2),
  ('VISITOR 16', 'VISITOR', '#E17055', 'Visitor Team 16', 34, 4, 0, 0, 4, 0, 0, 2),
  ('VISITOR 17', 'VISITOR', '#00B894', 'Visitor Team 17', 35, 4, 0, 0, 4, 0, 0, 2),
  ('VISITOR 18', 'VISITOR', '#E84393', 'Visitor Team 18', 36, 4, 0, 0, 4, 0, 0, 2)
ON CONFLICT (tournament_id, name) DO NOTHING;

-- Now insert all the players for each team
-- KAREN 1
INSERT INTO players (name, team_id, handicap, email, phone, is_pro, is_ex_officio, is_junior, tournament_id)
SELECT name, t.id, 
  CASE 
    WHEN name IN ('Eve Mwangi', 'Kate Ngotho', 'Monicah Kipchumba Lohwasser', 'Susan Kasinga', 'Michele Kanaiya', 'Elizabeth Sargeant', 'Susan Kihato', 'Martha Vincent', 'Rachel Koigi', 'Eunice Koome', 'Rosemary Mkok', 'Muthoni Kioi', 'Nancy Steinmann', 'Sajni Shah', 'Benta Khanili', 'Lydiah Maina', 'Asenath Mogaka', 'Felistus Mutinda') THEN 8
    ELSE 12
  END as handicap,
  LOWER(REPLACE(name, ' ', '.')) || '@karencc.com' as email,
  '+254700000' || LPAD(ROW_NUMBER() OVER()::text, 3, '0') as phone,
  false, false, false, 2
FROM (
  VALUES 
    ('Eve Mwangi', 1),
    ('Rehema Mohamed', 1),
    ('Ruth Foulser', 1),
    ('Mercy Nyanchama', 1)
) AS players(name, team_order)
JOIN teams t ON t.name = 'KAREN 1' AND t.tournament_id = 2;

-- KAREN 2
INSERT INTO players (name, team_id, handicap, email, phone, is_pro, is_ex_officio, is_junior, tournament_id)
SELECT name, t.id, 
  CASE 
    WHEN name IN ('Kate Ngotho', 'Kate Murima', 'Nelly Njaga', 'Milcah Kamere') THEN 10
    ELSE 14
  END as handicap,
  LOWER(REPLACE(name, ' ', '.')) || '@karencc.com' as email,
  '+254700000' || LPAD((ROW_NUMBER() OVER() + 4)::text, 3, '0') as phone,
  false, false, false, 2
FROM (
  VALUES 
    ('Kate Ngotho', 1),
    ('Kate Murima', 1),
    ('Nelly Njaga', 1),
    ('Milcah Kamere', 1)
) AS players(name, team_order)
JOIN teams t ON t.name = 'KAREN 2' AND t.tournament_id = 2;

-- KAREN 3
INSERT INTO players (name, team_id, handicap, email, phone, is_pro, is_ex_officio, is_junior, tournament_id)
SELECT name, t.id, 
  CASE 
    WHEN name IN ('Monicah Kipchumba Lohwasser', 'Sheila Change', 'Nkatha Nkiiiri', 'Miriam Njoroge') THEN 9
    ELSE 13
  END as handicap,
  LOWER(REPLACE(name, ' ', '.')) || '@karencc.com' as email,
  '+254700000' || LPAD((ROW_NUMBER() OVER() + 8)::text, 3, '0') as phone,
  false, false, false, 2
FROM (
  VALUES 
    ('Monicah Kipchumba Lohwasser', 1),
    ('Sheila Change', 1),
    ('Nkatha Nkiiiri', 1),
    ('Miriam Njoroge', 1)
) AS players(name, team_order)
JOIN teams t ON t.name = 'KAREN 3' AND t.tournament_id = 2;

-- Continue with all teams... (This is a simplified version - in practice, you'd want to insert all 35 teams)
-- For brevity, I'll create a more efficient approach:

-- Insert all KAREN team players
INSERT INTO players (name, team_id, handicap, email, phone, is_pro, is_ex_officio, is_junior, tournament_id)
SELECT 
  player_name,
  t.id,
  CASE 
    WHEN player_name IN ('Eve Mwangi', 'Kate Ngotho', 'Monicah Kipchumba Lohwasser', 'Susan Kasinga', 'Michele Kanaiya', 'Elizabeth Sargeant', 'Susan Kihato', 'Martha Vincent', 'Rachel Koigi', 'Eunice Koome', 'Rosemary Mkok', 'Muthoni Kioi', 'Nancy Steinmann', 'Sajni Shah', 'Benta Khanili', 'Lydiah Maina', 'Asenath Mogaka', 'Felistus Mutinda') THEN 8
    WHEN player_name IN ('Kate Murima', 'Nelly Njaga', 'Milcah Kamere', 'Sheila Change', 'Nkatha Nkiiiri', 'Miriam Njoroge', 'Joyce Wafula', 'Jane Wokabi', 'Catherine Mcilwayne', 'Patricia Ngina', 'Elizabeth Armitage', 'Caroline Muthoni', 'Wairimu Gakuo', 'Kagure Mbugua', 'Betty Radier', 'Lydia Nyambeki', 'Hellen Chepkwony', 'Ida Makoni', 'Mumbi Ngengi', 'Margaret Njoki', 'Joyce Njuguini', 'Joyce van Tongeren', 'Nas Kiengo', 'Nellie Ayodo', 'Sophie Njenga', 'Jennifer Cege', 'JaneAlice Mutuota', 'Annemarie Vellekoop', 'Dorcas Mbalanya', 'Fiona Manning', 'Nkini Pasha', 'Wanjiku Mathu', 'Marya Nyambura', 'Jean Kimani', 'Agnes Muchemi', 'Njeri Gitau', 'Sonal Chandaria', 'Meera Mandaliya', 'Yusra Butt', 'Veronica Muthiani', 'Rebecca Njui', 'Judy Nyambura', 'Caroline Kiengo', 'Agnes Wairimu', 'Joyce Ngwiri', 'Amani Njogu', 'Sylvia Mwai', 'Scola Onsongo', 'Virginia Munyao') THEN 10
    ELSE 12
  END as handicap,
  LOWER(REPLACE(player_name, ' ', '.')) || '@karencc.com' as email,
  '+254700000' || LPAD((ROW_NUMBER() OVER())::text, 3, '0') as phone,
  false, false, false, 2
FROM (
  -- KAREN 1
  VALUES ('Eve Mwangi', 'KAREN 1'), ('Rehema Mohamed', 'KAREN 1'), ('Ruth Foulser', 'KAREN 1'), ('Mercy Nyanchama', 'KAREN 1'),
  -- KAREN 2
  ('Kate Ngotho', 'KAREN 2'), ('Kate Murima', 'KAREN 2'), ('Nelly Njaga', 'KAREN 2'), ('Milcah Kamere', 'KAREN 2'),
  -- KAREN 3
  ('Monicah Kipchumba Lohwasser', 'KAREN 3'), ('Sheila Change', 'KAREN 3'), ('Nkatha Nkiiiri', 'KAREN 3'), ('Miriam Njoroge', 'KAREN 3'),
  -- KAREN 4
  ('Susan Kasinga', 'KAREN 4'), ('Joyce Wafula', 'KAREN 4'), ('Jane Wokabi', 'KAREN 4'), ('Catherine Mcilwayne', 'KAREN 4'),
  -- KAREN 5
  ('Michele Kanaiya', 'KAREN 5'), ('Patricia Ngina', 'KAREN 5'), ('Elizabeth Armitage', 'KAREN 5'), ('Caroline Muthoni', 'KAREN 5'),
  -- KAREN 6
  ('Elizabeth Sargeant', 'KAREN 6'), ('Wairimu Gakuo', 'KAREN 6'), ('Kagure Mbugua', 'KAREN 6'), ('Betty Radier', 'KAREN 6'),
  -- KAREN 7
  ('Susan Kihato', 'KAREN 7'), ('Lydia Nyambeki', 'KAREN 7'), ('Hellen Chepkwony', 'KAREN 7'), ('Ida Makoni', 'KAREN 7'),
  -- KAREN 8
  ('Martha Vincent', 'KAREN 8'), ('Mumbi Ngengi', 'KAREN 8'), ('Margaret Njoki', 'KAREN 8'), ('Joyce Njuguini', 'KAREN 8'),
  -- KAREN 9
  ('Rachel Koigi', 'KAREN 9'), ('Joyce van Tongeren', 'KAREN 9'), ('Nas Kiengo', 'KAREN 9'), ('Nellie Ayodo', 'KAREN 9'),
  -- KAREN 10
  ('Eunice Koome', 'KAREN 10'), ('Sophie Njenga', 'KAREN 10'), ('Jennifer Cege', 'KAREN 10'), ('JaneAlice Mutuota', 'KAREN 10'),
  -- KAREN 11
  ('Rosemary Mkok', 'KAREN 11'), ('Annemarie Vellekoop', 'KAREN 11'), ('Dorcas Mbalanya', 'KAREN 11'), ('Fiona Manning', 'KAREN 11'),
  -- KAREN 12
  ('Muthoni Kioi', 'KAREN 12'), ('Nkini Pasha', 'KAREN 12'), ('Wanjiku Mathu', 'KAREN 12'), ('Marya Nyambura', 'KAREN 12'),
  -- KAREN 13
  ('Nancy Steinmann', 'KAREN 13'), ('Jean Kimani', 'KAREN 13'), ('Agnes Muchemi', 'KAREN 13'), ('Njeri Gitau', 'KAREN 13'),
  -- KAREN 14
  ('Sajni Shah', 'KAREN 14'), ('Sonal Chandaria', 'KAREN 14'), ('Meera Mandaliya', 'KAREN 14'), ('Yusra Butt', 'KAREN 14'),
  -- KAREN 15
  ('Benta Khanili', 'KAREN 15'), ('Veronica Muthiani', 'KAREN 15'), ('Rebecca Njui', 'KAREN 15'), ('Judy Nyambura', 'KAREN 15'),
  -- KAREN 16
  ('Lydiah Maina', 'KAREN 16'), ('Caroline Kiengo', 'KAREN 16'), ('Agnes Wairimu', 'KAREN 16'), ('Joyce Ngwiri', 'KAREN 16'),
  -- KAREN 17
  ('Asenath Mogaka', 'KAREN 17'), ('Amani Njogu', 'KAREN 17'), ('Sylvia Mwai', 'KAREN 17'), ('Scola Onsongo', 'KAREN 17'),
  -- KAREN 18
  ('Felistus Mutinda', 'KAREN 18'), ('Virginia Munyao', 'KAREN 18'), ('Irene Kimeu', 'KAREN 18'), ('Ivy Kitee', 'KAREN 18')
) AS karen_players(player_name, team_name)
JOIN teams t ON t.name = karen_players.team_name AND t.tournament_id = 2;

-- Insert all VISITOR team players
INSERT INTO players (name, team_id, handicap, email, phone, is_pro, is_ex_officio, is_junior, tournament_id)
SELECT 
  player_name,
  t.id,
  CASE 
    WHEN player_name IN ('Christine Ng''ang''a', 'Jinnel Mwangi', 'Patricia Ithau', 'Rose Mambo', 'Emma Pennington', 'Atsango Lwande', 'Minnie Waithera', 'Muthoni Muturi', 'Njeri Onyango', 'Rhoda Mwebesa', 'Beatrice Ochola', 'Rina Hanrahan', 'Faith Gathungu', 'Ashley Muyela', 'Siphra Nyongesa', 'Wanjiku Guchu', 'Rosemary Njogu', 'Irene Kimeu') THEN 9
    WHEN player_name IN ('Rose Catherine', 'Mary Wainaina', 'Nyambura Gitimu', 'Christine Mathenge', 'Rebecca Juma', 'Evelyn Otsyula', 'Irene Kinyanjui', 'Cathy Kimathi', 'Vicky Karuga', 'Naomi Njeri Kariuki', 'Pettie Ndolo', 'Nancy Ikinu', 'Tiffany Algar', 'Wairimu Maina', 'Wayua Mululu', 'Paulynne Kabuga', 'Lucy Gakinya', 'Jennifer Murungi', 'Nelly Chemoiwa', 'Everline Njogu', 'Kathure Njoroge', 'Grace Gichuki', 'Jacintah Wambugu', 'Betty Gacheru', 'Rosemary Kioni', 'Caroline Kadikinyi', 'Lydia Mokaya', 'Nduku Musyimi', 'Violet Luchendo', 'Winnie Njeri', 'Susan Omondi', 'Veronica Obunga', 'Rose Detho', 'Wendy Turmel', 'Atty Harrison', 'Shirley Scrogie', 'Phyllis Mwaura', 'Jessica Atego', 'Ida Njogu', 'Royalle Karanja', 'Zari Njogu', 'Amelia Sheikh', 'Mary Awinja', 'Nirmla Devi', 'Audrey Khaleji', 'Jane Wambui', 'Joyce Mukua', 'Sophie Njuguna', 'Elizabeth Kimkung', 'Pascalia Koske', 'Njeri Korir', 'Ivy Kitee') THEN 11
    ELSE 13
  END as handicap,
  LOWER(REPLACE(player_name, ' ', '.')) || '@visitor.com' as email,
  '+254700000' || LPAD((ROW_NUMBER() OVER() + 72)::text, 3, '0') as phone,
  false, false, false, 2
FROM (
  -- VISITOR 1
  VALUES ('Christine Ng''ang''a', 'VISITOR 1'), ('Rose Catherine', 'VISITOR 1'), ('Mary Wainaina', 'VISITOR 1'), ('Nyambura Gitimu', 'VISITOR 1'),
  -- VISITOR 2
  ('Jinnel Mwangi', 'VISITOR 2'), ('Christine Mathenge', 'VISITOR 2'), ('Rebecca Juma', 'VISITOR 2'), ('Evelyn Otsyula', 'VISITOR 2'),
  -- VISITOR 3
  ('Patricia Ithau', 'VISITOR 3'), ('Irene Kinyanjui', 'VISITOR 3'), ('Cathy Kimathi', 'VISITOR 3'), ('Vicky Karuga', 'VISITOR 3'),
  -- VISITOR 4
  ('Rose Mambo', 'VISITOR 4'), ('Naomi Njeri Kariuki', 'VISITOR 4'), ('Pettie Ndolo', 'VISITOR 4'), ('Nancy Ikinu', 'VISITOR 4'),
  -- VISITOR 5
  ('Emma Pennington', 'VISITOR 5'), ('Tiffany Algar', 'VISITOR 5'), ('Wairimu Maina', 'VISITOR 5'), ('Wayua Mululu', 'VISITOR 5'),
  -- VISITOR 6
  ('Atsango Lwande', 'VISITOR 6'), ('Paulynne Kabuga', 'VISITOR 6'), ('Lucy Gakinya', 'VISITOR 6'), ('Jennifer Murungi', 'VISITOR 6'),
  -- VISITOR 7
  ('Minnie Waithera', 'VISITOR 7'), ('Nelly Chemoiwa', 'VISITOR 7'), ('Everline Njogu', 'VISITOR 7'), ('Kathure Njoroge', 'VISITOR 7'),
  -- VISITOR 8
  ('Muthoni Muturi', 'VISITOR 8'), ('Grace Gichuki', 'VISITOR 8'), ('Jacintah Wambugu', 'VISITOR 8'), ('Betty Gacheru', 'VISITOR 8'),
  -- VISITOR 9
  ('Njeri Onyango', 'VISITOR 9'), ('Rosemary Kioni', 'VISITOR 9'), ('Caroline Kadikinyi', 'VISITOR 9'), ('Lydia Mokaya', 'VISITOR 9'),
  -- VISITOR 10
  ('Rhoda Mwebesa', 'VISITOR 10'), ('Nduku Musyimi', 'VISITOR 10'), ('Violet Luchendo', 'VISITOR 10'), ('Winnie Njeri', 'VISITOR 10'),
  -- VISITOR 11
  ('Beatrice Ochola', 'VISITOR 11'), ('Susan Omondi', 'VISITOR 11'), ('Veronica Obunga', 'VISITOR 11'), ('Rose Detho', 'VISITOR 11'),
  -- VISITOR 12
  ('Rina Hanrahan', 'VISITOR 12'), ('Wendy Turmel', 'VISITOR 12'), ('Atty Harrison', 'VISITOR 12'), ('Shirley Scrogie', 'VISITOR 12'),
  -- VISITOR 13
  ('Faith Gathungu', 'VISITOR 13'), ('Phyllis Mwaura', 'VISITOR 13'), ('Jessica Atego', 'VISITOR 13'), ('Ida Njogu', 'VISITOR 13'),
  -- VISITOR 14
  ('Ashley Muyela', 'VISITOR 14'), ('Royalle Karanja', 'VISITOR 14'), ('Zari Njogu', 'VISITOR 14'), ('Amelia Sheikh', 'VISITOR 14'),
  -- VISITOR 15
  ('Siphra Nyongesa', 'VISITOR 15'), ('Mary Awinja', 'VISITOR 15'), ('Nirmla Devi', 'VISITOR 15'), ('Audrey Khaleji', 'VISITOR 15'),
  -- VISITOR 16
  ('Wanjiku Guchu', 'VISITOR 16'), ('Jane Wambui', 'VISITOR 16'), ('Joyce Mukua', 'VISITOR 16'), ('Sophie Njuguna', 'VISITOR 16'),
  -- VISITOR 17
  ('Rosemary Njogu', 'VISITOR 17'), ('Elizabeth Kimkung', 'VISITOR 17'), ('Pascalia Koske', 'VISITOR 17'), ('Njeri Korir', 'VISITOR 17'),
  -- VISITOR 18
  ('Irene Kimeu', 'VISITOR 18'), ('Ivy Kitee', 'VISITOR 18'), ('Felistus Mutinda', 'VISITOR 18'), ('Ivy Kitee', 'VISITOR 18')
) AS visitor_players(player_name, team_name)
JOIN teams t ON t.name = visitor_players.team_name AND t.tournament_id = 2;

-- Create initial scores for all teams
INSERT INTO scores (team_id, division, points, matches_played, matches_won, matches_lost, matches_halved, holes_won, holes_lost, total_strokes, strokes_differential, current_round, position, position_change, last_updated, tournament_id)
SELECT 
  t.id,
  t.division,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 
  ROW_NUMBER() OVER (ORDER BY t.name),
  0, NOW(), 2
FROM teams t 
WHERE t.tournament_id = 2;

-- Verify the data
SELECT 
  'Teams Created' as status,
  COUNT(*) as team_count,
  COUNT(CASE WHEN division = 'KAREN' THEN 1 END) as karen_teams,
  COUNT(CASE WHEN division = 'VISITOR' THEN 1 END) as visitor_teams
FROM teams 
WHERE tournament_id = 2;

SELECT 
  'Players Created' as status,
  COUNT(*) as player_count
FROM players 
WHERE tournament_id = 2;

SELECT 
  'Scores Created' as status,
  COUNT(*) as score_count
FROM scores 
WHERE tournament_id = 2;
