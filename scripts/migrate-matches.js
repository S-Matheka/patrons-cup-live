require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Load JSON data
const matchesData = JSON.parse(fs.readFileSync('./src/data/matches.json', 'utf8'));

async function migrateMatches() {
  console.log('🏌️ Starting matches migration to Supabase...\n');
  console.log(`📊 Total matches to migrate: ${matchesData.length}\n`);

  try {
    // Insert matches in small batches
    const batchSize = 25; // Smaller batches for stability
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < matchesData.length; i += batchSize) {
      const batch = matchesData.slice(i, i + batchSize).map(match => ({
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

      const { error } = await supabase.from('matches').insert(batch);
      
      if (error) {
        console.error(`❌ Error inserting matches ${i + 1}-${Math.min(i + batchSize, matchesData.length)}:`, error.message);
        errorCount += batch.length;
      } else {
        console.log(`✅ Inserted matches ${i + 1}-${Math.min(i + batchSize, matchesData.length)}`);
        successCount += batch.length;
      }

      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n📊 Matches Migration Summary:`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📈 Total: ${matchesData.length}`);

    if (successCount > 0) {
      console.log('\n🎯 Now migrating holes...');
      await migrateHoles();
    }

  } catch (error) {
    console.error('💥 Matches migration failed:', error);
  }
}

async function migrateHoles() {
  console.log('\n⛳ Starting holes migration...\n');

  try {
    // Prepare holes data
    const holesToInsert = [];
    
    matchesData.forEach(match => {
      match.holes.forEach(hole => {
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

    console.log(`📊 Total holes to migrate: ${holesToInsert.length}`);

    // Insert holes in batches
    const batchSize = 50;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < holesToInsert.length; i += batchSize) {
      const batch = holesToInsert.slice(i, i + batchSize);
      
      const { error } = await supabase.from('holes').insert(batch);
      
      if (error) {
        console.error(`❌ Error inserting holes ${i + 1}-${Math.min(i + batchSize, holesToInsert.length)}:`, error.message);
        errorCount += batch.length;
      } else {
        console.log(`✅ Inserted holes ${i + 1}-${Math.min(i + batchSize, holesToInsert.length)}`);
        successCount += batch.length;
      }

      // Small delay
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log(`\n📊 Holes Migration Summary:`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📈 Total: ${holesToInsert.length}`);

  } catch (error) {
    console.error('💥 Holes migration failed:', error);
  }
}

migrateMatches();
