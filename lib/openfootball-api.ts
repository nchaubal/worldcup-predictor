// OpenFootball API - Free World Cup data with goal scorers, cards, and match details
// Source: https://github.com/openfootball/worldcup.json

export interface OpenFootballGoal {
  name: string;
  minute: string;
  penalty?: boolean;
  owngoal?: boolean;
}

export interface OpenFootballCard {
  name: string;
  minute: string;
  card: 'yellow' | 'red' | 'yellowred';
}

export interface OpenFootballMatch {
  round: string;
  num?: number;
  date: string;
  time: string;
  team1: string;
  team2: string;
  score?: {
    ft?: [number, number];
    ht?: [number, number];
    et?: [number, number];
    p?: [number, number];
  };
  goals1?: OpenFootballGoal[];
  goals2?: OpenFootballGoal[];
  cards1?: OpenFootballCard[];
  cards2?: OpenFootballCard[];
  group?: string;
  ground: string;
}

export interface OpenFootballData {
  name: string;
  matches: OpenFootballMatch[];
}

// Cache for the API response
let cachedData: OpenFootballData | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

export async function fetchOpenFootballData(): Promise<OpenFootballData> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (cachedData && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedData;
  }

  try {
    const response = await fetch(
      'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json',
      { next: { revalidate: 300 } } // Next.js cache for 5 minutes
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch openfootball data: ${response.status}`);
    }
    
    cachedData = await response.json();
    cacheTimestamp = now;
    return cachedData!;
  } catch (error) {
    console.error('Error fetching openfootball data:', error);
    // Return cached data even if stale, or empty data
    return cachedData || { name: 'World Cup 2026', matches: [] };
  }
}

// Normalize team names for matching between APIs
// Maps various name formats to a canonical form
const TEAM_NAME_MAP: Record<string, string> = {
  'United States': 'USA',
  'Korea Republic': 'South Korea',
  'Türkiye': 'Turkey',
  'Bosnia-Herzegovina': 'Bosnia & Herzegovina',  // football-data.org → OpenFootball
  'Bosnia and Herzegovina': 'Bosnia & Herzegovina',
  'Bosnia & Herz.': 'Bosnia & Herzegovina',  // tournament-data.ts → OpenFootball
  'DR Congo': 'Congo DR',
  'Congo DR': 'DR Congo',  // OpenFootball uses "DR Congo"
  'Côte d\'Ivoire': 'Ivory Coast',
  'Cape Verde': 'Cabo Verde',
  'Cape Verde Islands': 'Cape Verde',  // football-data.org uses this
};

function normalizeTeamName(name: string): string {
  return TEAM_NAME_MAP[name] || name;
}

// Find a match by team names
export function findMatch(
  data: OpenFootballData,
  homeTeam: string,
  awayTeam: string
): OpenFootballMatch | undefined {
  const normalizedHome = normalizeTeamName(homeTeam);
  const normalizedAway = normalizeTeamName(awayTeam);
  
  return data.matches.find(match => {
    const matchHome = normalizeTeamName(match.team1);
    const matchAway = normalizeTeamName(match.team2);
    
    return (
      (matchHome === normalizedHome && matchAway === normalizedAway) ||
      (matchHome === normalizedAway && matchAway === normalizedHome)
    );
  });
}

// Get match details with goal scorers and cards
export interface MatchDetails {
  homeTeam: string;
  awayTeam: string;
  score: {
    home: number;
    away: number;
    halfTime?: { home: number; away: number };
    extraTime?: { home: number; away: number };
    penalties?: { home: number; away: number };
  };
  goals: {
    team: 'home' | 'away';
    scorer: string;
    minute: string;
    penalty?: boolean;
    ownGoal?: boolean;
  }[];
  cards: {
    team: 'home' | 'away';
    player: string;
    minute: string;
    type: 'yellow' | 'red' | 'yellowred';
  }[];
  round: string;
  venue: string;
  date: string;
  time: string;
}

export function getMatchDetails(
  data: OpenFootballData,
  homeTeam: string,
  awayTeam: string
): MatchDetails | null {
  const match = findMatch(data, homeTeam, awayTeam);
  
  if (!match) {
    return null;
  }
  
  // Check if teams are flipped
  const teamsFlipped = normalizeTeamName(match.team1) !== normalizeTeamName(homeTeam);
  
  const goals: MatchDetails['goals'] = [];
  const cards: MatchDetails['cards'] = [];
  
  // Process goals for team1
  if (match.goals1) {
    match.goals1.forEach(goal => {
      goals.push({
        team: teamsFlipped ? 'away' : 'home',
        scorer: goal.name,
        minute: goal.minute,
        penalty: goal.penalty,
        ownGoal: goal.owngoal,
      });
    });
  }
  
  // Process goals for team2
  if (match.goals2) {
    match.goals2.forEach(goal => {
      goals.push({
        team: teamsFlipped ? 'home' : 'away',
        scorer: goal.name,
        minute: goal.minute,
        penalty: goal.penalty,
        ownGoal: goal.owngoal,
      });
    });
  }
  
  // Process cards for team1
  if (match.cards1) {
    match.cards1.forEach(card => {
      cards.push({
        team: teamsFlipped ? 'away' : 'home',
        player: card.name,
        minute: card.minute,
        type: card.card,
      });
    });
  }
  
  // Process cards for team2
  if (match.cards2) {
    match.cards2.forEach(card => {
      cards.push({
        team: teamsFlipped ? 'home' : 'away',
        player: card.name,
        minute: card.minute,
        type: card.card,
      });
    });
  }
  
  // Sort goals and cards by minute
  goals.sort((a, b) => parseInt(a.minute) - parseInt(b.minute));
  cards.sort((a, b) => parseInt(a.minute) - parseInt(b.minute));
  
  // Build score object
  const score: MatchDetails['score'] = {
    home: teamsFlipped ? (match.score?.ft?.[1] ?? 0) : (match.score?.ft?.[0] ?? 0),
    away: teamsFlipped ? (match.score?.ft?.[0] ?? 0) : (match.score?.ft?.[1] ?? 0),
  };
  
  if (match.score?.ht) {
    score.halfTime = {
      home: teamsFlipped ? match.score.ht[1] : match.score.ht[0],
      away: teamsFlipped ? match.score.ht[0] : match.score.ht[1],
    };
  }
  
  if (match.score?.et) {
    score.extraTime = {
      home: teamsFlipped ? match.score.et[1] : match.score.et[0],
      away: teamsFlipped ? match.score.et[0] : match.score.et[1],
    };
  }
  
  if (match.score?.p) {
    score.penalties = {
      home: teamsFlipped ? match.score.p[1] : match.score.p[0],
      away: teamsFlipped ? match.score.p[0] : match.score.p[1],
    };
  }
  
  return {
    homeTeam: teamsFlipped ? match.team2 : match.team1,
    awayTeam: teamsFlipped ? match.team1 : match.team2,
    score,
    goals,
    cards,
    round: match.round,
    venue: match.ground,
    date: match.date,
    time: match.time,
  };
}

// Get all matches with details
export async function getAllMatchDetails(): Promise<MatchDetails[]> {
  const data = await fetchOpenFootballData();
  
  return data.matches
    .filter(match => match.score?.ft) // Only completed matches
    .map(match => getMatchDetails(data, match.team1, match.team2)!)
    .filter(Boolean);
}
