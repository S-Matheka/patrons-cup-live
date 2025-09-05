const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with real credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMGCMatches() {
  console.log('🔧 Fixing MGC matches with null scores...\n');
  
  try {
    // Find MGC team
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .ilike('name', '%MGC%');
    
    if (teamsError) throw teamsError;
    
    if (!teams || teams.length === 0) {
      console.log('❌ No team found with MGC in the name');
      return;
    }
    
    const mgcTeam = teams[0];
    console.log(`🏌️  Found MGC team: ${mgcTeam.name} (ID: ${mgcTeam.id}, Division: ${mgcTeam.division})\n`);
    
    // Get all completed matches for MGC that have null scores
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select(`
        *,
        holes (
          hole_number,
          par,
          team_a_score,
          team_b_score,
          team_c_score,
          team_a_strokes,
          team_b_strokes,
          team_c_strokes,
          status,
          last_updated
        )
      `)
      .or(`team_a_id.eq.${mgcTeam.id},team_b_id.eq.${mgcTeam.id},team_c_id.eq.${mgcTeam.id}`)
      .eq('status', 'completed');
    
    if (matchesError) throw matchesError;
    
    console.log(`📊 Found ${matches.length} completed matches for MGC\n`);
    
    let matchesToFix = 0;
    let holesToFix = 0;
    
    for (const match of matches) {
      if (!match.holes || match.holes.length === 0) continue;
      
      // Check if this match has null scores
      const hasNullScores = match.holes.some(hole => 
        hole.team_a_strokes === null || hole.team_b_strokes === null ||
        (match.is_three_way && hole.team_c_strokes === null)
      );
      
      if (hasNullScores) {
        matchesToFix++;
        console.log(`🔧 Match ${match.game_number}: ${match.session} ${match.match_type} - has null scores`);
        
        // Count holes with null scores
        const nullHoles = match.holes.filter(hole => 
          hole.team_a_strokes === null || hole.team_b_strokes === null ||
          (match.is_three_way && hole.team_c_strokes === null)
        );
        
        holesToFix += nullHoles.length;
        console.log(`   📊 ${nullHoles.length} holes have null scores`);
        
        // Option 1: Reset match status to in-progress
        console.log(`   🔄 Resetting match status to 'in-progress'...`);
        
        const { error: statusError } = await supabase
          .from('matches')
          .update({ 
            status: 'in-progress',
            updated_at: new Date().toISOString()
          })
          .eq('id', match.id);
        
        if (statusError) {
          console.error(`   ❌ Failed to reset match status:`, statusError);
        } else {
          console.log(`   ✅ Match status reset to 'in-progress'`);
        }
        
        // Option 2: Reset hole statuses to not-started
        console.log(`   🔄 Resetting hole statuses to 'not-started'...`);
        
        const { error: holesError } = await supabase
          .from('holes')
          .update({ 
            status: 'not-started',
            last_updated: new Date().toISOString()
          })
          .eq('match_id', match.id);
        
        if (holesError) {
          console.error(`   ❌ Failed to reset hole statuses:`, holesError);
        } else {
          console.log(`   ✅ Hole statuses reset to 'not-started'`);
        }
      }
    }
    
    console.log(`\n📈 Summary:`);
    console.log(`   Matches fixed: ${matchesToFix}`);
    console.log(`   Holes affected: ${holesToFix}`);
    
    if (matchesToFix > 0) {
      console.log(`\n✅ MGC matches have been reset to 'in-progress' status.`);
      console.log(`   Now when you enter actual scores, the matches will properly complete with real data.`);
    } else {
      console.log(`\n✅ No MGC matches need fixing.`);
    }
    
  } catch (error) {
    console.error('❌ Error fixing MGC matches:', error);
  }
}

// Run the fix
fixMGCMatches();

