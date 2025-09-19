-- Karen Country Club Stableford Tournament Migration
-- Run this in Supabase SQL Editor

-- 1. Insert The Nancy Millar Trophy tournament
INSERT INTO tournaments (
  name, 
  slug, 
  description, 
  start_date, 
  end_date, 
  status, 
  format,
  divisions,
  point_system,
  settings
) VALUES (
  'The Nancy Millar Trophy 2025',
  'nancy-millar-trophy-2025',
  'The Nancy Millar Trophy - Foursomes Stableford Team Competition over 54 holes at Karen Country Club',
  '2025-09-20',
  '2025-09-21',
  'upcoming',
  'foursomes_stableford',
  '["TEAM"]',
  '{
    "stableford": {
      "netAlbatross": 5,
      "netEagle": 4,
      "netBirdie": 3,
      "netPar": 2,
      "netBogey": 1,
      "netDoubleBogeyOrWorse": 0
    }
  }',
  '{
    "course": "Karen Country Club",
    "maxPlayersPerTeam": 4,
    "maxTeams": 32,
    "allowThreeWayMatches": false,
    "enableProMatches": false,
    "rounds": 3,
    "handicapBased": true,
    "combinedHandicapLimit": 115.9,
    "foursomesFormat": true,
    "handicapPercentage": 50,
    "entryFee": 2500,
    "ballPoolFee": 200,
    "strokeIndex": {
      "1": {"par": 4, "si": 15},
      "2": {"par": 5, "si": 7},
      "3": {"par": 5, "si": 9},
      "4": {"par": 4, "si": 3},
      "5": {"par": 3, "si": 13},
      "6": {"par": 4, "si": 1},
      "7": {"par": 3, "si": 17},
      "8": {"par": 4, "si": 11},
      "9": {"par": 4, "si": 5},
      "10": {"par": 4, "si": 14},
      "11": {"par": 4, "si": 6},
      "12": {"par": 4, "si": 18},
      "13": {"par": 4, "si": 2},
      "14": {"par": 3, "si": 16},
      "15": {"par": 5, "si": 8},
      "16": {"par": 3, "si": 12},
      "17": {"par": 4, "si": 4},
      "18": {"par": 5, "si": 10}
    },
    "rounds": [
      {
        "roundNumber": 1,
        "name": "Round 1 - Saturday AM",
        "date": "2025-09-20",
        "time": "AM",
        "course": "Course 4",
        "pairings": "A plays with C, B plays with D"
      },
      {
        "roundNumber": 2,
        "name": "Round 2 - Saturday PM", 
        "date": "2025-09-20",
        "time": "PM",
        "course": "Course 4",
        "pairings": "A plays with D, B plays with C"
      },
      {
        "roundNumber": 3,
        "name": "Round 3 - Sunday AM",
        "date": "2025-09-21", 
        "time": "AM",
        "course": "Course 3",
        "pairings": "A plays with B, C plays with D"
      }
    ]
  }'
) ON CONFLICT (slug) DO NOTHING;

-- 2. Get the tournament ID for reference
SELECT id, name, slug FROM tournaments WHERE slug = 'karen-stableford-2025';