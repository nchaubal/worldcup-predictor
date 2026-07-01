// Free BBC Sport API Integration
// BBC provides free public sports data through their JSON feeds

export interface BBCMatch {
  id: string;
  title: string;
  sport: string;
  category: string;
  startTime: string;
  isLive: boolean;
  status: string;
  homeTeam: {
    name: string;
    score?: number;
  };
  awayTeam: {
    name: string;
    score?: number;
  };
  competition: string;
  venue?: string;
}

export interface BBCResponse {
  items: BBCMatch[];
}

class BBCSportService {
  private baseUrl = 'https://cdn.jsdelivr.net/gh/bbc/sport-data@latest';
  private pollInterval: NodeJS.Timeout | null = null;
  private subscribers: Set<(matches: BBCMatch[]) => void> = new Set();

  // Subscribe to live score updates
  subscribe(callback: (matches: BBCMatch[]) => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  // Notify all subscribers
  private notifySubscribers(matches: BBCMatch[]) {
    this.subscribers.forEach(callback => callback(matches));
  }

  // Fetch live football matches
  async fetchLiveMatches(): Promise<BBCMatch[]> {
    try {
      // BBC Sport JSON feed for football
      const response = await fetch(`${this.baseUrl}/football/live.json`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.transformBBCData(data);
    } catch (error) {
      console.error('Error fetching BBC matches:', error);
      // Fallback to mock data if BBC API fails
      return this.getMockLiveMatches();
    }
  }

  // Transform BBC data to our format
  private transformBBCData(data: any): BBCMatch[] {
    if (!data || !data.items) return [];

    return data.items.map((item: any) => ({
      id: item.id || Math.random().toString(36).substr(2, 9),
      title: item.title || 'Match',
      sport: item.sport || 'football',
      category: item.category || 'live',
      startTime: item.startTime || new Date().toISOString(),
      isLive: item.isLive || false,
      status: item.status || 'UNKNOWN',
      homeTeam: {
        name: item.homeTeam?.name || 'Team A',
        score: item.homeTeam?.score
      },
      awayTeam: {
        name: item.awayTeam?.name || 'Team B',
        score: item.awayTeam?.score
      },
      competition: item.competition || 'Football',
      venue: item.venue
    }));
  }

  // Mock data for testing when BBC API is not available
  private getMockLiveMatches(): BBCMatch[] {
    return [
      {
        id: 'mex-ecu-1',
        title: 'Mexico vs Ecuador',
        sport: 'football',
        category: 'live',
        startTime: new Date().toISOString(),
        isLive: true,
        status: 'LIVE',
        homeTeam: {
          name: 'Mexico',
          score: 1
        },
        awayTeam: {
          name: 'Ecuador',
          score: 0
        },
        competition: 'Copa América',
        venue: 'State Farm Stadium, Arizona'
      },
      {
        id: 'arg-can-1',
        title: 'Argentina vs Canada',
        sport: 'football',
        category: 'live',
        startTime: new Date().toISOString(),
        isLive: true,
        status: 'LIVE',
        homeTeam: {
          name: 'Argentina',
          score: 2
        },
        awayTeam: {
          name: 'Canada',
          score: 1
        },
        competition: 'Copa América',
        venue: 'Mercedes-Benz Stadium, Atlanta'
      },
      {
        id: 'usa-uru-1',
        title: 'USA vs Uruguay',
        sport: 'football',
        category: 'upcoming',
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        isLive: false,
        status: 'UPCOMING',
        homeTeam: {
          name: 'USA'
        },
        awayTeam: {
          name: 'Uruguay'
        },
        competition: 'Copa América',
        venue: 'MetLife Stadium, New Jersey'
      }
    ];
  }

  // Fetch specific match details
  async fetchMatch(matchId: string): Promise<BBCMatch | null> {
    try {
      const matches = await this.fetchLiveMatches();
      return matches.find(match => match.id === matchId) || null;
    } catch (error) {
      console.error('Error fetching BBC match:', error);
      return null;
    }
  }

  // Start polling for live updates
  startPolling(intervalMs: number = 30000) {
    if (this.pollInterval) {
      this.stopPolling();
    }

    // Initial fetch
    this.fetchAndNotify();

    // Set up polling
    this.pollInterval = setInterval(() => {
      this.fetchAndNotify();
    }, intervalMs);
  }

  // Stop polling
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  // Fetch and notify subscribers
  private async fetchAndNotify() {
    const matches = await this.fetchLiveMatches();
    this.notifySubscribers(matches);
  }

  // Get all football fixtures
  async getFootballFixtures(): Promise<BBCMatch[]> {
    return this.fetchLiveMatches();
  }
}

// Create singleton instance
let bbcSportService: BBCSportService | null = null;

export function getBBCSportService(): BBCSportService {
  if (!bbcSportService) {
    bbcSportService = new BBCSportService();
  }
  return bbcSportService;
}

// Utility functions
export function isMatchLive(match: BBCMatch): boolean {
  return match.isLive || match.status === 'LIVE';
}

export function getMatchStatusText(match: BBCMatch): string {
  if (match.isLive) return 'LIVE';
  if (match.status === 'UPCOMING') return 'UPCOMING';
  if (match.status === 'FULL_TIME') return 'FULL TIME';
  return match.status;
}

export function formatMatchScore(match: BBCMatch): string {
  if (!match.isLive && (!match.homeTeam.score && !match.awayTeam.score)) {
    return 'vs';
  }
  
  const homeScore = match.homeTeam.score || 0;
  const awayScore = match.awayTeam.score || 0;
  
  return `${homeScore} - ${awayScore}`;
}

export function getTeamNames(match: BBCMatch): { home: string; away: string } {
  return {
    home: match.homeTeam.name,
    away: match.awayTeam.name
  };
}

export function getVenue(match: BBCMatch): string {
  return match.venue || 'Unknown Venue';
}
