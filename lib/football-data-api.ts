// Football Data.org API Service
// Professional football data API for live scores, match data, and tournament information

export interface FootballDataMatch {
  id: number;
  utcDate: string;
  status: 'SCHEDULED' | 'LIVE' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'POSTPONED' | 'SUSPENDED' | 'CANCELED';
  matchday: number;
  stage: string;
  group?: string;
  homeTeam: {
    id: number;
    name: string;
    shortName: string;
    tla: string;
    crest: string;
  };
  awayTeam: {
    id: number;
    name: string;
    shortName: string;
    tla: string;
    crest: string;
  };
  score: {
    winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;
    duration: 'REGULAR' | 'EXTRA_TIME' | 'PENALTY_SHOOTOUTS';
    fullTime: {
      home: number | null;
      away: number | null;
    };
    halfTime: {
      home: number | null;
      away: number | null;
    };
    extraTime?: {
      home: number | null;
      away: number | null;
    };
    penalties?: {
      home: number | null;
      away: number | null;
    };
  };
  competition: {
    id: number;
    name: string;
    code: string;
    type: string;
    emblem: string;
  };
}

export interface FootballDataCompetition {
  id: number;
  name: string;
  code: string;
  type: string;
  emblem: string;
  currentSeason: {
    id: number;
    startDate: string;
    endDate: string;
    currentMatchday: number;
    winner?: any;
  };
}

export interface FootballDataTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
  address: string;
  website: string;
  founded: number;
  clubColors: string;
  venue: string;
  runningCompetitions: Array<{
    id: number;
    name: string;
    code: string;
    type: string;
    emblem: string;
  }>;
}

export class FootballDataApiService {
  private readonly baseUrl = 'https://api.football-data.org/v4';
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.FOOTBALL_DATA_API_KEY || '';
    if (!this.apiKey) {
      console.warn('FOOTBALL_DATA_API_KEY not found in environment variables');
    }
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'X-Auth-Token': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Football Data API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Football Data API request failed:', error);
      throw error;
    }
  }

  // Get competitions (tournaments)
  async getCompetitions(): Promise<{ competitions: FootballDataCompetition[] }> {
    return this.makeRequest('/competitions');
  }

  // Get specific competition details
  async getCompetition(competitionId: number): Promise<FootballDataCompetition> {
    return this.makeRequest(`/competitions/${competitionId}`);
  }

  // Get matches for a specific competition
  async getCompetitionMatches(
    competitionId: number,
    filters?: {
      matchday?: number;
      dateFrom?: string;
      dateTo?: string;
      stage?: string;
      status?: string;
    }
  ): Promise<{ matches: FootballDataMatch[] }> {
    const params = new URLSearchParams();
    
    if (filters?.matchday) params.append('matchday', filters.matchday.toString());
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.stage) params.append('stage', filters.stage);
    if (filters?.status) params.append('status', filters.status);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.makeRequest(`/competitions/${competitionId}/matches${query}`);
  }

  // Get World Cup matches (WC = 2000)
  async getWorldCupMatches(filters?: {
    matchday?: number;
    dateFrom?: string;
    dateTo?: string;
    stage?: string;
    status?: string;
  }): Promise<{ matches: FootballDataMatch[] }> {
    return this.getCompetitionMatches(2000, filters);
  }

  // Get live matches for World Cup
  async getLiveWorldCupMatches(): Promise<{ matches: FootballDataMatch[] }> {
    return this.getWorldCupMatches({ status: 'LIVE' });
  }

  // Get today's World Cup matches
  async getTodayWorldCupMatches(): Promise<{ matches: FootballDataMatch[] }> {
    const today = new Date().toISOString().split('T')[0];
    return this.getWorldCupMatches({ dateFrom: today, dateTo: today });
  }

  // Get specific match details
  async getMatch(matchId: number): Promise<FootballDataMatch> {
    return this.makeRequest(`/matches/${matchId}`);
  }

  // Get team information
  async getTeam(teamId: number): Promise<FootballDataTeam> {
    return this.makeRequest(`/teams/${teamId}`);
  }

  // Get team matches for a specific competition
  async getTeamMatches(
    teamId: number,
    competitionId?: number,
    filters?: {
      dateFrom?: string;
      dateTo?: string;
      status?: string;
      limit?: number;
    }
  ): Promise<{ matches: FootballDataMatch[] }> {
    const params = new URLSearchParams();
    
    if (competitionId) params.append('competitions', competitionId.toString());
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.makeRequest(`/teams/${teamId}/matches${query}`);
  }

  // Convert Football Data match to our app's match format
  convertToAppMatch(match: FootballDataMatch): any {
    return {
      id: match.id.toString(),
      homeTeam: {
        name: match.homeTeam.name,
        code: match.homeTeam.tla,
        score: match.score.fullTime.home ?? undefined,
      },
      awayTeam: {
        name: match.awayTeam.name,
        code: match.awayTeam.tla,
        score: match.score.fullTime.away ?? undefined,
      },
      competition: match.competition.name,
      matchDate: match.utcDate,
      status: this.mapStatus(match.status),
      venue: '', // Football Data API doesn't provide venue in basic match data
      city: '',  // Would need additional API call to get venue info
      group: match.group || '',
      stage: match.stage,
      winner: this.mapWinner(match.score.winner),
      homeScore: match.score.fullTime.home ?? undefined,
      awayScore: match.score.fullTime.away ?? undefined,
      penalties: match.score.penalties ? 
        `${match.score.penalties.home}-${match.score.penalties.away}` : undefined,
    };
  }

  // Map Football Data status to our app's status
  private mapStatus(status: string): string {
    switch (status) {
      case 'SCHEDULED':
        return 'UPCOMING';
      case 'LIVE':
      case 'IN_PLAY':
      case 'PAUSED':
        return 'LIVE';
      case 'FINISHED':
        return 'FULL_TIME';
      case 'POSTPONED':
        return 'POSTPONED';
      case 'SUSPENDED':
        return 'SUSPENDED';
      case 'CANCELED':
        return 'CANCELED';
      default:
        return 'UPCOMING';
    }
  }

  // Map Football Data winner to our app's format
  private mapWinner(winner: string | null): string | null {
    switch (winner) {
      case 'HOME_TEAM':
        return 'HOME_TEAM';
      case 'AWAY_TEAM':
        return 'AWAY_TEAM';
      case 'DRAW':
        return 'DRAW';
      default:
        return null;
    }
  }

  // Check if a match is currently live
  isMatchLive(match: FootballDataMatch): boolean {
    return match.status === 'LIVE' || match.status === 'IN_PLAY' || match.status === 'PAUSED';
  }

  // Check if a match is finished
  isMatchFinished(match: FootballDataMatch): boolean {
    return match.status === 'FINISHED';
  }

  // Get match score as string
  getMatchScore(match: FootballDataMatch): string {
    const homeScore = match.score.fullTime.home ?? 0;
    const awayScore = match.score.fullTime.away ?? 0;
    return `${homeScore}-${awayScore}`;
  }

  // Get formatted match time
  getMatchTime(match: FootballDataMatch): string {
    if (this.isMatchLive(match)) {
      return 'LIVE';
    }
    if (this.isMatchFinished(match)) {
      return 'FT';
    }
    const date = new Date(match.utcDate);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  }
}

// Export singleton instance
export const footballDataApi = new FootballDataApiService();
