require('dotenv').config({ path: '.env.local' });

console.log('🔍 Checking Environment Variables...\n');

const envVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
};

Object.entries(envVars).forEach(([key, value]) => {
  if (value) {
    console.log(`✅ ${key}: SET (${value.length} characters)`);
    if (key.includes('URL')) {
      console.log(`   Value: ${value}`);
    } else {
      console.log(`   Value: ${value.substring(0, 20)}...`);
    }
  } else {
    console.log(`❌ ${key}: MISSING`);
  }
});

console.log('\n📋 Summary:');
const missingVars = Object.entries(envVars).filter(([key, value]) => !value);
if (missingVars.length === 0) {
  console.log('✅ All required environment variables are set');
} else {
  console.log(`❌ Missing ${missingVars.length} environment variables:`);
  missingVars.forEach(([key]) => console.log(`   - ${key}`));
}
