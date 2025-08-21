require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Load JSON data
const teamsData = JSON.parse(fs.readFileSync('./src/data/teams.json', 'utf8'));
const playersData = JSON.parse(fs.readFileSync('./src/data/players.json', 'utf8'));
const matchesData = JSON.parse(fs.readFileSync('./src/data/matches.json', 'utf8'));
const scoresData = JSON.parse(fs.readFileSync('./src/data/scores.json', 'utf8'));

async function migrateData() {
  console.log('🚀 Starting simple data migration to Supabase...\n');

  try {
    // Test connection first
    console.log('🔗 Testing connection...');
    const { data: testData, error: testError } = await supabase
      .from('teams')
      .select('*', { count: 'exact', head: true });
    
    if (testError) {
      console.error('❌ Connection test failed:', testError.message);
      return;
    }
    console.log('✅ Connection successful\n');

    // 1. Insert teams one by one to avoid batch issues
    console.log('📊 Migrating teams...');
    for (let i = 0; i < teamsData.length; i++) {
      const team = teamsData[i];
      const { error } = await supabase.from('teams').insert({
        id: team.id,
        name: team.name,
        division: team.division,
        color: team.color,
        logo: team.logo,
        description: team.description,
        seed: team.seed,
        total_players: team.totalPlayers,
        max_points_available: team.maxPointsAvailable,
        session_points: team.sessionPoints,
        players_per_session: team.playersPerSession,
        resting_per_session: team.restingPerSession,
        points_per_match: team.pointsPerMatch
      });

      if (error) {
        console.error(`❌ Error inserting team ${team.name}:`, error.message);
      } else {
        console.log(`✅ Inserted team: ${team.name}`);
      }
    }

    // 2. Insert scores
    console.log('\n🏆 Migrating scores...');
    for (let i = 0; i < scoresData.length; i++) {
      const score = scoresData[i];
      const { error } = await supabase.from('scores').insert({
        team_id: score.teamId,
        division: score.division,
        points: score.points,
        matches_played: score.matchesPlayed,
        matches_won: score.matchesWon,
        matches_lost: score.matchesLost,
        matches_halved: score.matchesHalved,
        holes_won: score.holesWon,
        holes_lost: score.holesLost,
        total_strokes: score.totalStrokes || 0,
        strokes_differential: score.strokesDifferential || 0,
        current_round: score.currentRound || 1,
        position: score.position,
        position_change: score.positionChange || 'same'
      });

      if (error) {
        console.error(`❌ Error inserting score for team ${score.teamId}:`, error.message);
      } else {
        console.log(`✅ Inserted score for team: ${score.teamId}`);
      }
    }

    // 3. Insert players in batches
    console.log('\n👥 Migrating players...');
    const batchSize = 10;
    for (let i = 0; i < playersData.length; i += batchSize) {
      const batch = playersData.slice(i, i + batchSize).map(player => ({
        id: player.id,
        name: player.name,
        team_id: player.teamId,
        handicap: player.handicap,
        email: player.email,
        phone: player.phone,
        is_pro: player.isPro || false,
        is_ex_officio: player.isExOfficio || false,
        is_junior: player.isJunior || false
      }));

      const { error } = await supabase.from('players').insert(batch);
      if (error) {
        console.error(`❌ Error inserting player batch ${i + 1}-${Math.min(i + batchSize, playersData.length)}:`, error.message);
      } else {
        console.log(`✅ Inserted players ${i + 1}-${Math.min(i + batchSize, playersData.length)}`);
      }
    }

    console.log('\n🎉 Basic migration completed!');
    console.log(`✅ Teams: ${teamsData.length}`);
    console.log(`✅ Players: ${playersData.length}`);
    console.log(`✅ Scores: ${scoresData.length}`);
    console.log('\n📝 Note: Matches and holes will be migrated separately due to size.');

  } catch (error) {
    console.error('💥 Migration failed:', error);
  }
}

migrateData();
