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

async function restoreMGCMatches() {
  console.log('🔄 Restoring MGC matches back to completed status...\n');
  
  try {
    // Find MGC team
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .ilike('name', '%MGC%');
    
    if (teamsError) throw teamsError;
    
    const mgcTeam = teams[0];
    console.log(`🏌️  Found MGC team: ${mgcTeam.name} (ID: ${mgcTeam.id})\n`);
    
    // The specific match IDs that were reset (from the previous output)
    const matchIds = [83, 84, 85, 72, 3, 6, 86, 67, 1, 5, 82, 69, 71];
    
    console.log(`🔄 Restoring ${matchIds.length} matches back to completed status...`);
    
    // Restore matches to completed status
    const { error: matchesError } = await supabase
      .from('matches')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .in('id', matchIds);
    
    if (matchesError) {
      console.error('❌ Failed to restore match statuses:', matchesError);
      return;
    }
    
    console.log('✅ Match statuses restored to completed');
    
    // Restore hole statuses to completed for these matches
    const { error: holesError } = await supabase
      .from('holes')
      .update({ 
        status: 'completed',
        last_updated: new Date().toISOString()
      })
      .in('match_id', matchIds);
    
    if (holesError) {
      console.error('❌ Failed to restore hole statuses:', holesError);
      return;
    }
    
    console.log('✅ Hole statuses restored to completed');
    
    console.log(`\n📈 Successfully restored ${matchIds.length} MGC matches to completed status`);
    
  } catch (error) {
    console.error('❌ Error restoring MGC matches:', error);
  }
}

// Run the restoration
restoreMGCMatches();

