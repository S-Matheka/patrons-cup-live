require('dotenv').config({ path: '.env.local' });

console.log('🔍 TESTING ENVIRONMENT VARIABLES\n');

console.log('Server-side environment variables:');
console.log(`NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET'}`);
console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'}`);

// Simulate browser environment
console.log('\nBrowser-side environment variables (simulated):');
console.log(`NEXT_PUBLIC_SUPABASE_URL: ${typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET') : 'NOT AVAILABLE'}`);
console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET') : 'NOT AVAILABLE'}`);

// Test the isSupabaseConfigured function
const { isSupabaseConfigured } = require('./src/lib/supabase');

console.log('\nTesting isSupabaseConfigured():');
console.log(`Result: ${isSupabaseConfigured()}`);

// Test with explicit values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('\nManual check:');
console.log(`supabaseUrl: ${supabaseUrl ? 'SET' : 'NOT SET'}`);
console.log(`supabaseKey: ${supabaseKey ? 'SET' : 'NOT SET'}`);
console.log(`supabaseUrl !== 'your_supabase_url_here': ${supabaseUrl !== 'your_supabase_url_here'}`);
console.log(`supabaseKey !== 'your_supabase_anon_key_here': ${supabaseKey !== 'your_supabase_anon_key_here'}`);
