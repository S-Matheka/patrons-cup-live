// Script to check for 3-way matches with tied scores
const fs = require('fs');

// Read the matches data
const matchesData = JSON.parse(fs.readFileSync('./src/data/matches.json', 'utf8'));

// Filter for 3-way Foursomes matches
const threeWayFoursomesMatches = matchesData.filter(match => 
  match.isThreeWay && (match.type === 'Foursomes' || match.match_type === 'Foursomes')
);

// Count by status
const statusCounts = {
  'scheduled': 0,
  'in-progress': 0,
  'completed': 0,
  'other': 0
};

threeWayFoursomesMatches.forEach(match => {
  if (match.status === 'scheduled') statusCounts.scheduled++;
  else if (match.status === 'in-progress') statusCounts['in-progress']++;
  else if (match.status === 'completed') statusCounts.completed++;
  else statusCounts.other++;
});

console.log('Status counts:', statusCounts);

console.log(`Found ${threeWayFoursomesMatches.length} 3-way Foursomes matches`);

// Check for matches with tied scores
threeWayFoursomesMatches.forEach(match => {
  // Count completed holes
  const completedHoles = match.holes.filter(hole => 
    hole.teamAScore !== null && hole.teamBScore !== null && hole.teamCScore !== null
  );
  
  if (completedHoles.length === 0) {
    console.log(`Match ${match.id} has no completed holes`);
    return;
  }
  
  // Calculate total scores
  let teamATotal = 0;
  let teamBTotal = 0;
  let teamCTotal = 0;
  
  completedHoles.forEach(hole => {
    teamATotal += hole.teamAScore;
    teamBTotal += hole.teamBScore;
    teamCTotal += hole.teamCScore;
  });
  
  console.log(`Match ${match.id} (${match.status}): Team A: ${teamATotal}, Team B: ${teamBTotal}, Team C: ${teamCTotal}`);
  
  // Check if all teams are tied
  if (teamATotal === teamBTotal && teamBTotal === teamCTotal) {
    console.log(`  ALL TEAMS TIED in match ${match.id}`);
  }
  // Check if top two teams are tied
  else if (teamATotal === teamBTotal || teamATotal === teamCTotal || teamBTotal === teamCTotal) {
    console.log(`  TWO TEAMS TIED in match ${match.id}`);
  }
});
