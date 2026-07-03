// Dynamic Tournament Data Sync with FIFA Live Scores
// Automatically updates match status, scores, and winners based on live FIFA data

import { R32_MATCHES } from './tournament-data';
import { FIFAMatch } from './fifa-api';
import { TEAMS } from './tournament-data';

export interface TournamentMatch {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  date: string;
  venue: string;
  homeScore?: number;
  awayScore?: number;
  winner?: string;
  status: "completed" | "live" | "upcoming";
  pens?: string;
}

// Sync any tournament match with FIFA live data
export function syncMatchWithFIFA(match: TournamentMatch, fifaMatches: FIFAMatch[]): TournamentMatch {
  const homeTeam = TEAMS.find(t => t.id === match.homeTeamId);
  const awayTeam = TEAMS.find(t => t.id === match.awayTeamId);
  
  if (!homeTeam || !awayTeam) return match;

  // Find matching FIFA match (team names can be in either order)
  const fifaMatch = fifaMatches.find(fifa => 
    (fifa.homeTeam.name === homeTeam.name && fifa.awayTeam.name === awayTeam.name) ||
    (fifa.homeTeam.name === awayTeam.name && fifa.awayTeam.name === homeTeam.name)
  );

  if (!fifaMatch) return match;

  // Determine if teams are flipped in FIFA data
  const teamsFlipped = fifaMatch.homeTeam.name === awayTeam.name;
  
  // Get scores based on team order
  const homeScore = teamsFlipped ? fifaMatch.awayTeam.score : fifaMatch.homeTeam.score;
  const awayScore = teamsFlipped ? fifaMatch.homeTeam.score : fifaMatch.awayTeam.score;

  // Determine match status
  const isCompleted = fifaMatch.status === 'FULL_TIME';
  const isLive = fifaMatch.status === 'LIVE';

  // Calculate winner for completed matches
  let winner: string | undefined;
  if (isCompleted && homeScore !== undefined && awayScore !== undefined) {
    if (homeScore > awayScore) {
      winner = match.homeTeamId;
    } else if (awayScore > homeScore) {
      winner = match.awayTeamId;
    }
    // Note: We don't handle penalties here as FIFA API doesn't provide that detail
  }

  return {
    ...match,
    homeScore: homeScore ?? match.homeScore,
    awayScore: awayScore ?? match.awayScore,
    winner: winner ?? match.winner,
    status: isCompleted ? 'completed' : isLive ? 'live' : 'upcoming'
  };
}

// Sync all tournament rounds with FIFA data
export function syncTournamentWithFIFA(fifaMatches: FIFAMatch[]) {
  return {
    r32: R32_MATCHES.map(match => syncMatchWithFIFA(match, fifaMatches)),
    // R16 matches don't have team IDs yet (depend on R32 winners)
    // Future rounds will be added when data is available
  };
}

// Get live matches from tournament data
export function getLiveTournamentMatches(fifaMatches: FIFAMatch[]) {
  const synced = syncTournamentWithFIFA(fifaMatches);
  return synced.r32.filter(match => match.status === 'live');
}

// Get completed matches from tournament data
export function getCompletedTournamentMatches(fifaMatches: FIFAMatch[]) {
  const synced = syncTournamentWithFIFA(fifaMatches);
  return synced.r32.filter(match => match.status === 'completed');
}

// Get upcoming matches from tournament data
export function getUpcomingTournamentMatches(fifaMatches: FIFAMatch[]) {
  const synced = syncTournamentWithFIFA(fifaMatches);
  return synced.r32.filter(match => match.status === 'upcoming');
}
