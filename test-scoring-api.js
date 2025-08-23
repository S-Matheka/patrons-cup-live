const fetch = require('node-fetch');

async function testScoringAPI() {
  console.log('🧪 Testing Scoring API...\n');

  try {
    // Test updating a hole score
    const testData = {
      matchId: 1, // Use a real match ID from your database
      holeNumber: 1,
      teamAScore: 4,
      teamBScore: 5,
      teamCScore: null,
      status: 'completed'
    };

    console.log('📤 Sending test data:', testData);

    const response = await fetch('http://localhost:3000/api/scoring/update-hole', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ API test successful!');
      console.log('Response:', result);
    } else {
      console.log('❌ API test failed!');
      console.log('Status:', response.status);
      console.log('Response:', result);
    }

  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
}

testScoringAPI();
