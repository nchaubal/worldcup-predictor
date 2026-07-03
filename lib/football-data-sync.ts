// Football Data.org Tournament Sync
// Sync tournament data with Football Data.org API for real-time updates

import { FootballDataMatch } from './football-data-api';
import { R32_MATCHES } from './tournament-data';
import { TEAMS, getTeamByName } from './tournament-data';

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

// football-data.org rolls penalty-shootout goals into fullTime. Subtract the
// penalties to recover the real on-field (90'/extra-time) score.
function getOnFieldScore(fullTime?: number | null, penalties?: number | null): number | null {
  if (fullTime == null) return null;
  return fullTime - (penalties ?? 0);
}

export function syncMatchWithFootballData(match: TournamentMatch, footballMatches: FootballDataMatch[]): TournamentMatch {
  // Find matching Football Data match by team names
  const homeTeam = TEAMS.find(t => t.id === match.homeTeamId);
  const awayTeam = TEAMS.find(t => t.id === match.awayTeamId);
  
  if (!homeTeam || !awayTeam) {
    return match;
  }

  const footballMatch = footballMatches.find(fm => {
    const fmHomeId = getTeamByName(fm.homeTeam.name)?.id;
    const fmAwayId = getTeamByName(fm.awayTeam.name)?.id;
    return (
      (fmHomeId === homeTeam.id && fmAwayId === awayTeam.id) ||
      (fmHomeId === awayTeam.id && fmAwayId === homeTeam.id)
    );
  });

  if (!footballMatch) {
    return match;
  }

  // Check if teams are flipped in the API response
  const teamsFlipped = getTeamByName(footballMatch.homeTeam.name)?.id !== homeTeam.id;

  // The API's fullTime includes penalty-shootout goals; subtract penalties to
  // get the actual on-field (90'/ET) score.
  const rawHome = getOnFieldScore(footballMatch.score.fullTime.home, footballMatch.score.penalties?.home);
  const rawAway = getOnFieldScore(footballMatch.score.fullTime.away, footballMatch.score.penalties?.away);
  const homeScore = teamsFlipped ? rawAway : rawHome;
  const awayScore = teamsFlipped ? rawHome : rawAway;

  // Determine match status
  const isCompleted = footballMatch.status === 'FINISHED';
  const isLive = footballMatch.status === 'LIVE' || footballMatch.status === 'IN_PLAY' || footballMatch.status === 'PAUSED';

  // Determine winner from the API winner field (accounts for penalty shootouts)
  let winner: string | undefined;
  if (isCompleted) {
    if (footballMatch.score.winner === 'HOME_TEAM') {
      winner = teamsFlipped ? match.awayTeamId : match.homeTeamId;
    } else if (footballMatch.score.winner === 'AWAY_TEAM') {
      winner = teamsFlipped ? match.homeTeamId : match.awayTeamId;
    }
  }

  // Handle penalties
  let pens: string | undefined;
  if (footballMatch.score.penalties?.home != null && footballMatch.score.penalties?.away != null) {
    const homePenalties = teamsFlipped ? footballMatch.score.penalties.away : footballMatch.score.penalties.home;
    const awayPenalties = teamsFlipped ? footballMatch.score.penalties.home : footballMatch.score.penalties.away;
    pens = `${homePenalties}-${awayPenalties}`;
  }

  return {
    ...match,
    homeScore: homeScore ?? match.homeScore,
    awayScore: awayScore ?? match.awayScore,
    winner: winner ?? match.winner,
    status: isCompleted ? 'completed' : isLive ? 'live' : 'upcoming',
    pens: pens ?? match.pens,
  };
}

// Sync all tournament rounds with Football Data
export function syncTournamentWithFootballData(footballMatches: FootballDataMatch[]) {
  // Get all matches from API and convert them to our format
  const allApiMatches = footballMatches.map(convertFootballDataToTournamentMatch).filter((match): match is TournamentMatch => match !== null);
  
  // Sync R32 matches with our static data
  const syncedR32 = R32_MATCHES.map(match => syncMatchWithFootballData(match, footballMatches));
  
  // Combine all matches
  const allMatches = [...syncedR32, ...allApiMatches.filter(m => !m.id.startsWith('r32_'))];
  
  return {
    r32: syncedR32,
    all: allMatches,
  };
}

// Get live matches from tournament data
export function getLiveTournamentMatches(footballMatches: FootballDataMatch[]) {
  const synced = syncTournamentWithFootballData(footballMatches);
  return synced.all.filter(match => match.status === 'live');
}

// Get completed matches from tournament data
export function getCompletedTournamentMatches(footballMatches: FootballDataMatch[]) {
  const synced = syncTournamentWithFootballData(footballMatches);
  return synced.all.filter(match => match.status === 'completed');
}

// Get upcoming matches from tournament data
export function getUpcomingTournamentMatches(footballMatches: FootballDataMatch[]) {
  const synced = syncTournamentWithFootballData(footballMatches);
  return synced.all.filter(match => match.status === 'upcoming');
}

// Convert Football Data match to our tournament match format
export function convertFootballDataToTournamentMatch(footballMatch: FootballDataMatch): TournamentMatch | null {
  // Knockout matches that aren't set yet have null team names — skip them
  if (!footballMatch.homeTeam?.name || !footballMatch.awayTeam?.name) {
    return null;
  }

  // Find teams by name with alias-aware matching
  const homeTeam = getTeamByName(footballMatch.homeTeam.name);
  const awayTeam = getTeamByName(footballMatch.awayTeam.name);
  
  if (!homeTeam || !awayTeam) {
    return null;
  }

  // Determine match status
  const isCompleted = footballMatch.status === 'FINISHED';
  const isLive = footballMatch.status === 'LIVE' || footballMatch.status === 'IN_PLAY' || footballMatch.status === 'PAUSED';

  // On-field score (penalty-shootout goals removed from fullTime)
  const homeScore = getOnFieldScore(footballMatch.score.fullTime.home, footballMatch.score.penalties?.home);
  const awayScore = getOnFieldScore(footballMatch.score.fullTime.away, footballMatch.score.penalties?.away);

  // Determine winner from the API winner field (accounts for penalty shootouts)
  let winner: string | undefined;
  if (isCompleted) {
    if (footballMatch.score.winner === 'HOME_TEAM') {
      winner = homeTeam.id;
    } else if (footballMatch.score.winner === 'AWAY_TEAM') {
      winner = awayTeam.id;
    }
  }

  // Handle penalties
  let pens: string | undefined;
  if (footballMatch.score.penalties?.home != null && footballMatch.score.penalties?.away != null) {
    pens = `${footballMatch.score.penalties.home}-${footballMatch.score.penalties.away}`;
  }

  // Generate a unique ID for the match
  const matchId = `${homeTeam.id}-${awayTeam.id}-${new Date(footballMatch.utcDate).getTime()}`;

  return {
    id: matchId,
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    date: new Date(footballMatch.utcDate).toLocaleDateString(),
    venue: footballMatch.homeTeam.name, // Using team name as placeholder since venue isn't provided
    homeScore: homeScore ?? undefined,
    awayScore: awayScore ?? undefined,
    winner: winner ?? undefined,
    status: isCompleted ? 'completed' : isLive ? 'live' : 'upcoming',
    pens: pens ?? undefined,
  };
}

// Get matches by stage (Round of 32, Round of 16, etc.)
export function getMatchesByStage(footballMatches: FootballDataMatch[], stage: string): TournamentMatch[] {
  const stageMatches = footballMatches.filter(match => 
    match.stage.toLowerCase().includes(stage.toLowerCase())
  );
  
  return stageMatches
    .map(convertFootballDataToTournamentMatch)
    .filter((match): match is TournamentMatch => match !== null);
}

// Get group standings from API data
export function getGroupStandingsFromAPI(footballMatches: FootballDataMatch[]) {
  const groupMatches = footballMatches.filter(match => match.stage === 'GROUP_STAGE' && match.group);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const standings: Record<string, any[]> = {};
  
  // Initialize all groups
  for (let i = 65; i <= 76; i++) { // A to L
    const groupLetter = String.fromCharCode(i);
    standings[groupLetter] = [];
  }
  
  // Calculate standings based on completed matches
  groupMatches.forEach(match => {
    if (match.status !== 'FINISHED') return;
    
    const group = match.group;
    // Convert "GROUP_A" to "A" for our standings structure
    const groupLetter = group ? group.replace('GROUP_', '') : '';
    if (!groupLetter || !standings[groupLetter]) return;
    
    const homeTeamName = match.homeTeam.name;
    const awayTeamName = match.awayTeam.name;
    const homeScore = match.score.fullTime.home || 0;
    const awayScore = match.score.fullTime.away || 0;
    
    // Find or create team records
    let homeTeam = standings[groupLetter].find(t => t.name === homeTeamName);
    let awayTeam = standings[groupLetter].find(t => t.name === awayTeamName);
    
    if (!homeTeam) {
      homeTeam = { name: homeTeamName, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 };
      standings[groupLetter].push(homeTeam);
    }
    
    if (!awayTeam) {
      awayTeam = { name: awayTeamName, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 };
      standings[groupLetter].push(awayTeam);
    }
    
    // Update stats
    homeTeam.played++;
    awayTeam.played++;
    homeTeam.gf += homeScore;
    homeTeam.ga += awayScore;
    awayTeam.gf += awayScore;
    awayTeam.ga += homeScore;
    
    if (homeScore > awayScore) {
      homeTeam.won++;
      homeTeam.points += 3;
      awayTeam.lost++;
    } else if (awayScore > homeScore) {
      awayTeam.won++;
      awayTeam.points += 3;
      homeTeam.lost++;
    } else {
      homeTeam.drawn++;
      awayTeam.drawn++;
      homeTeam.points += 1;
      awayTeam.points += 1;
    }
    
    homeTeam.gd = homeTeam.gf - homeTeam.ga;
    awayTeam.gd = awayTeam.gf - awayTeam.ga;
  });
  
  // Sort each group by points, then goal difference, then goals scored
  Object.keys(standings).forEach(group => {
    standings[group].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.gd !== a.gd) return b.gd - a.gd;
      return b.gf - a.gf;
    });
  });
  
  return standings;
}
