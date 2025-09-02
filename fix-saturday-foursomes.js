require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixSaturdayFoursomes() {
  console.log('🔧 FIXING SATURDAY PM FOURSOMES (Games 82-86)');
  console.log('==============================================\n');

  try {
    // Fix Games 82-86: Change back to Foursomes (Saturday PM)
    console.log('Fixing Games 82-86: Changing back to Foursomes (Saturday PM)...');
    
    const updateResult = await supabase
      .from('matches')
      .update({ 
        match_type: 'Foursomes',
        is_three_way: true,
        session: 'PM'
      })
      .in('game_number', [82, 83, 84, 85, 86])
      .eq('division', 'Trophy');

    if (updateResult.error) {
      console.error('Error updating matches:', updateResult.error);
      throw updateResult.error;
    }

    console.log(`✅ Updated ${updateResult.count} matches back to Foursomes`);

    // Verify the fix
    console.log('\n📊 VERIFYING THE FIX:');
    console.log('======================\n');
    
    const updatedMatches = await supabase
      .from('matches')
      .select('*')
      .eq('division', 'Trophy')
      .order('game_number');

    if (updatedMatches.error) throw updatedMatches.error;

    console.log('Corrected Trophy matches:');
    updatedMatches.data.forEach(match => {
      const date = new Date(match.match_date);
      const day = date.getDay();
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];
      console.log(`Game ${match.game_number}: ${match.match_type} - ${match.session} - ${dayName} (${match.match_date})`);
    });

    console.log('\n🎯 CORRECT SCHEDULE NOW:');
    console.log('=========================');
    console.log('Friday AM: 4BBB (Games 1-6)');
    console.log('Friday PM: Foursomes (Games 42-46)');
    console.log('Saturday AM: 4BBB (Games 67-72)');
    console.log('Saturday PM: Foursomes (Games 82-86) ← FIXED');
    console.log('Sunday AM: Singles (Games 103-158)');
    console.log('Sunday PM: Singles (Games 135-146)');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixSaturdayFoursomes();
