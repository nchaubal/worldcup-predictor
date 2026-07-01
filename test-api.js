// Test script for football-data.org API
const API_KEY = '2a1c8491bcc248bf922be69de6183527';
const BASE_URL = 'https://api.football-data.org/v4';

async function testAPI() {
  console.log('Testing football-data.org API...');
  console.log('API Key:', API_KEY ? 'Present' : 'Missing');
  
  try {
    // Test 1: Get competitions
    console.log('\n1. Testing competitions endpoint...');
    const competitionsResponse = await fetch(`${BASE_URL}/competitions`, {
      headers: {
        'X-Auth-Token': API_KEY,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Status:', competitionsResponse.status);
    console.log('Status Text:', competitionsResponse.statusText);
    
    if (competitionsResponse.ok) {
      const competitions = await competitionsResponse.json();
      console.log('Competitions count:', competitions.competitions?.length || 0);
      
      // Find World Cup
      const worldCup = competitions.competitions?.find(c => c.name.includes('World Cup'));
      if (worldCup) {
        console.log('World Cup found:', worldCup.name, 'ID:', worldCup.id);
        
        // Test 2: Get World Cup matches
        console.log('\n2. Testing World Cup matches endpoint...');
        const matchesResponse = await fetch(`${BASE_URL}/competitions/${worldCup.id}/matches`, {
          headers: {
            'X-Auth-Token': API_KEY,
            'Content-Type': 'application/json',
          },
        });
        
        console.log('Matches Status:', matchesResponse.status);
        console.log('Matches Status Text:', matchesResponse.statusText);
        
        if (matchesResponse.ok) {
          const matches = await matchesResponse.json();
          console.log('Total matches:', matches.matches?.length || 0);
          
          // Show first few matches
          if (matches.matches && matches.matches.length > 0) {
            console.log('\nFirst 3 matches:');
            matches.matches.slice(0, 3).forEach((match, index) => {
              console.log(`${index + 1}. ${match.homeTeam.name} vs ${match.awayTeam.name}`);
              console.log(`   Status: ${match.status}`);
              console.log(`   Date: ${match.utcDate}`);
              if (match.score.fullTime.home !== null && match.score.fullTime.away !== null) {
                console.log(`   Score: ${match.score.fullTime.home} - ${match.score.fullTime.away}`);
              }
            });
          }
        } else {
          const errorText = await matchesResponse.text();
          console.log('Matches Error:', errorText);
        }
      } else {
        console.log('World Cup not found in competitions');
      }
    } else {
      const errorText = await competitionsResponse.text();
      console.log('Competitions Error:', errorText);
    }
    
  } catch (error) {
    console.error('API Test Error:', error.message);
  }
}

testAPI();
