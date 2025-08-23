const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRLSPolicies() {
  console.log('🔍 Checking RLS Policies...\n');

  try {
    // Check if RLS is enabled on tables
    const tables = ['matches', 'holes', 'scores'];
    
    for (const table of tables) {
      console.log(`📋 Table: ${table}`);
      
      // Try to read from the table
      const { data: readData, error: readError } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (readError) {
        console.log(`  ❌ Read error: ${readError.message}`);
      } else {
        console.log(`  ✅ Read access: OK`);
      }
      
      // Try to update a record (this will test RLS policies)
      if (table === 'holes') {
        const { data: holesData } = await supabase
          .from('holes')
          .select('id, match_id, hole_number')
          .limit(1);
        
        if (holesData && holesData.length > 0) {
          const testHole = holesData[0];
          const { error: updateError } = await supabase
            .from('holes')
            .update({ last_updated: new Date().toISOString() })
            .eq('id', testHole.id);
          
          if (updateError) {
            console.log(`  ❌ Update error: ${updateError.message}`);
          } else {
            console.log(`  ✅ Update access: OK`);
          }
        } else {
          console.log(`  ⚠️  No holes found to test update`);
        }
      }
      
      console.log('');
    }
    
    // Check authentication status
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log(`❌ Auth error: ${authError.message}`);
    } else if (user) {
      console.log(`✅ Authenticated as: ${user.email}`);
    } else {
      console.log(`⚠️  Not authenticated - this might be the issue!`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkRLSPolicies();
