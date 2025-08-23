const fs = require('fs');
const matches = JSON.parse(fs.readFileSync('src/data/matches.json', 'utf8'));

// Group by date and session to see what we have
const sessions = {};
matches.forEach(match => {
  const key = `${match.date}-${match.session}-${match.type}`;
  if (!sessions[key]) sessions[key] = { total: 0, completed: 0, inProgress: 0 };
  sessions[key].total++;
  if (match.status === 'completed') sessions[key].completed++;
  if (match.status === 'in-progress') sessions[key].inProgress++;
});

console.log('Tournament Sessions:');
Object.entries(sessions).forEach(([key, data]) => {
  console.log(`${key}: ${data.completed} completed, ${data.inProgress} live, ${data.total} total`);
});

// Check MGC specifically in Trophy division
const mgcMatches = matches.filter(m => 
  m.division === 'Trophy' && 
  (m.teamAId === 1 || m.teamBId === 1) // Assuming MGC is team ID 1
);

console.log('\nMGC Trophy matches:');
mgcMatches.forEach(match => {
  console.log(`${match.date}-${match.session}-${match.type}: ${match.status}`);
});

// Check what teams exist
const teams = JSON.parse(fs.readFileSync('src/data/teams.json', 'utf8'));
const mgc = teams.find(t => t.name === 'MGC');
console.log('\nMGC team:', mgc);
