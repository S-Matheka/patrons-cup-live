const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function applyIndividualScoringMigration() {
  console.log('🔧 Applying individual player scoring migration...');
  
  try {
    // Read the SQL migration file
    const sqlContent = fs.readFileSync('individual-player-scoring-migration.sql', 'utf8');
    
    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n⏳ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement
        });
        
        if (error) {
          console.log(`❌ Error in statement ${i + 1}: ${error.message}`);
          console.log(`   Statement: ${statement.substring(0, 100)}...`);
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.log(`❌ Exception in statement ${i + 1}: ${err.message}`);
        console.log(`   Statement: ${statement.substring(0, 100)}...`);
      }
    }
    
    // Test the new columns
    console.log('\n🔍 Testing new columns...');
    const { data: testData, error: testError } = await supabase
      .from('holes')
      .select('player1_score, player2_score, player3_score, player4_score')
      .limit(1);
    
    if (testError) {
      console.log('❌ Columns not accessible:', testError.message);
    } else {
      console.log('✅ Individual player scoring columns are now available');
      console.log('📊 Sample data:', testData);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

applyIndividualScoringMigration();
