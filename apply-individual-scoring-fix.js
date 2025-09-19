const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function applyIndividualScoringFix() {
  console.log('🔧 Applying individual player scoring columns fix...');
  
  const columns = [
    'player1_score INTEGER',
    'player2_score INTEGER', 
    'player3_score INTEGER',
    'player4_score INTEGER',
    'player1_handicap INTEGER',
    'player2_handicap INTEGER',
    'player3_handicap INTEGER', 
    'player4_handicap INTEGER',
    'player1_points INTEGER',
    'player2_points INTEGER',
    'player3_points INTEGER',
    'player4_points INTEGER',
    'player1_id INTEGER',
    'player2_id INTEGER',
    'player3_id INTEGER',
    'player4_id INTEGER'
  ];
  
  console.log('📋 SQL Commands to run in Supabase Dashboard:');
  console.log('-- Copy and paste these commands one by one in the SQL Editor:');
  console.log('');
  
  columns.forEach(col => {
    console.log(`ALTER TABLE holes ADD COLUMN IF NOT EXISTS ${col};`);
  });
  
  console.log('');
  console.log('🎯 After running these commands:');
  console.log('1. The "Error fetching matches" should be resolved');
  console.log('2. Individual player scoring will be available');
  console.log('3. Nancy Millar Trophy scoring interface will work');
  
  // Test if we can access the columns after they're added
  console.log('\\n🔍 Testing current column access...');
  try {
    const { data, error } = await supabase
      .from('holes')
      .select('player1_score, player1_handicap')
      .limit(1);
    
    if (error) {
      console.log('❌ Columns not accessible yet:', error.message);
      console.log('   Please run the SQL commands above in Supabase Dashboard');
    } else {
      console.log('✅ Columns are accessible');
    }
  } catch (err) {
    console.log('❌ Error testing columns:', err.message);
  }
}

applyIndividualScoringFix();
