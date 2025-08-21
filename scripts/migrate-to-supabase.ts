import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import * as fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Import JSON data
const teamsData = JSON.parse(fs.readFileSync('./src/data/teams.json', 'utf8'));
const playersData = JSON.parse(fs.readFileSync('./src/data/players.json', 'utf8'));
const matchesData = JSON.parse(fs.readFileSync('./src/data/matches.json', 'utf8'));
const scoresData = JSON.parse(fs.readFileSync('./src/data/scores.json', 'utf8'));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use service role key for migration

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function migrateData() {
  console.log('🚀 Starting data migration to Supabase...\n');

  try {
    // 1. Migrate Teams
    console.log('📊 Migrating teams...');
    const teamsToInsert = teamsData.map((team: any) => ({
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
    }));

    const { error: teamsError } = await supabase
      .from('teams')
      .upsert(teamsToInsert, { onConflict: 'id' });

    if (teamsError) {
      console.error('❌ Error migrating teams:', teamsError);
      return;
    }
    console.log(`✅ Successfully migrated ${teamsData.length} teams\n`);

    // 2. Migrate Players
    console.log('👥 Migrating players...');
    const playersToInsert = playersData.map((player: any) => ({
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

    const { error: playersError } = await supabase
      .from('players')
      .upsert(playersToInsert, { onConflict: 'id' });

    if (playersError) {
      console.error('❌ Error migrating players:', playersError);
      return;
    }
    console.log(`✅ Successfully migrated ${playersData.length} players\n`);

    // 3. Migrate Matches
    console.log('🏌️ Migrating matches...');
    const matchesToInsert = matchesData.map((match: any) => ({
      id: match.id,
      team_a_id: match.teamAId,
      team_b_id: match.teamBId,
      team_c_id: match.teamCId,
      division: match.division,
      match_date: match.date,
      tee_time: match.teeTime,
      tee: match.tee,
      course: match.course,
      match_type: match.type,
      session: match.session,
      status: match.status,
      players: match.players,
      game_number: match.gameNumber,
      is_three_way: match.isThreeWay || false,
      is_pro: match.isPro || false,
      is_bye: match.isBye || false
    }));

    // Insert matches in batches to avoid timeout
    const batchSize = 50;
    for (let i = 0; i < matchesToInsert.length; i += batchSize) {
      const batch = matchesToInsert.slice(i, i + batchSize);
      const { error: matchesError } = await supabase
        .from('matches')
        .upsert(batch, { onConflict: 'id' });

      if (matchesError) {
        console.error(`❌ Error migrating matches batch ${i + 1}-${Math.min(i + batchSize, matchesToInsert.length)}:`, matchesError);
        return;
      }
      console.log(`✅ Migrated matches ${i + 1}-${Math.min(i + batchSize, matchesToInsert.length)}`);
    }
    console.log(`✅ Successfully migrated all ${matchesData.length} matches\n`);

    // 4. Migrate Holes (from matches data)
    console.log('⛳ Migrating holes...');
    const holesToInsert: any[] = [];
    
    matchesData.forEach((match: any) => {
      match.holes.forEach((hole: any) => {
        holesToInsert.push({
          match_id: match.id,
          hole_number: hole.number,
          par: hole.par,
          team_a_score: hole.teamAScore,
          team_b_score: hole.teamBScore,
          team_a_strokes: hole.teamAStrokes,
          team_b_strokes: hole.teamBStrokes,
          status: hole.status
        });
      });
    });

    // Insert holes in batches
    for (let i = 0; i < holesToInsert.length; i += batchSize) {
      const batch = holesToInsert.slice(i, i + batchSize);
      const { error: holesError } = await supabase
        .from('holes')
        .upsert(batch, { onConflict: 'match_id,hole_number' });

      if (holesError) {
        console.error(`❌ Error migrating holes batch ${i + 1}-${Math.min(i + batchSize, holesToInsert.length)}:`, holesError);
        return;
      }
      console.log(`✅ Migrated holes ${i + 1}-${Math.min(i + batchSize, holesToInsert.length)}`);
    }
    console.log(`✅ Successfully migrated all ${holesToInsert.length} holes\n`);

    // 5. Migrate Scores
    console.log('🏆 Migrating scores...');
    const scoresToInsert = scoresData.map((score: any) => ({
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
    }));

    const { error: scoresError } = await supabase
      .from('scores')
      .upsert(scoresToInsert, { onConflict: 'team_id' });

    if (scoresError) {
      console.error('❌ Error migrating scores:', scoresError);
      return;
    }
    console.log(`✅ Successfully migrated ${scoresData.length} scores\n`);

    console.log('🎉 Data migration completed successfully!');
    console.log('\n📈 Migration Summary:');
    console.log(`- Teams: ${teamsData.length}`);
    console.log(`- Players: ${playersData.length}`);
    console.log(`- Matches: ${matchesData.length}`);
    console.log(`- Holes: ${holesToInsert.length}`);
    console.log(`- Scores: ${scoresData.length}`);

  } catch (error) {
    console.error('💥 Migration failed:', error);
  }
}

// Run migration
migrateData();
