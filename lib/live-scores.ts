// Live Scores Integration with API-Football
// Documentation: https://www.api-football.com/documentation

export interface LiveMatch {
  fixture: {
    id: number;
    date: string;
    status: {
      long: string;
      short: string;
      elapsed: number;
    };
    venue: {
      name: string;
      city: string;
    };
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
    };
    away: {
      id: number;
      name: string;
      logo: string;
    };
  };
  goals: {
    home: number;
    away: number;
  };
  score: {
    halftime: {
      home: number;
      away: number;
    };
    fulltime: {
      home: number;
      away: number;
    };
  };
}

export interface LiveScoreResponse {
  results: number;
  paging: {
    current: number;
    total: number;
  };
  response: LiveMatch[];
}

class LiveScoreService {
  private apiKey: string;
  private baseUrl = 'https://v3.football.api-sports.io';
  private pollInterval: NodeJS.Timeout | null = null;
  private subscribers: Set<(matches: LiveMatch[]) => void> = new Set();

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Subscribe to live score updates
  subscribe(callback: (matches: LiveMatch[]) => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  // Notify all subscribers
  private notifySubscribers(matches: LiveMatch[]) {
    this.subscribers.forEach(callback => callback(matches));
  }

  // Fetch live matches for World Cup 2026
  async fetchLiveMatches(): Promise<LiveMatch[]> {
    try {
      const response = await fetch(`${this.baseUrl}/fixtures?live=all&league=2`, {
        headers: {
          'x-apisports-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: LiveScoreResponse = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error fetching live matches:', error);
      return [];
    }
  }

  // Fetch specific match details
  async fetchMatch(fixtureId: number): Promise<LiveMatch | null> {
    try {
      const response = await fetch(`${this.baseUrl}/fixtures?id=${fixtureId}`, {
        headers: {
          'x-apisports-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: LiveScoreResponse = await response.json();
      return data.response[0] || null;
    } catch (error) {
      console.error('Error fetching match:', error);
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

  // Get World Cup 2026 fixtures
  async getWorldCupFixtures(): Promise<LiveMatch[]> {
    try {
      const response = await fetch(`${this.baseUrl}/fixtures?league=2&season=2026`, {
        headers: {
          'x-apisports-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: LiveScoreResponse = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error fetching World Cup fixtures:', error);
      return [];
    }
  }
}

// Create singleton instance
let liveScoreService: LiveScoreService | null = null;

export function getLiveScoreService(): LiveScoreService {
  if (!liveScoreService) {
    const apiKey = process.env.NEXT_PUBLIC_API_FOOTBALL_KEY;
    if (!apiKey) {
      throw new Error('API_FOOTBALL_KEY environment variable is required');
    }
    liveScoreService = new LiveScoreService(apiKey);
  }
  return liveScoreService;
}

// Utility functions
export function isMatchLive(match: LiveMatch): boolean {
  return match.fixture.status.short === 'LIVE' || 
         match.fixture.status.short === 'HT' || 
         match.fixture.status.short === 'ET' ||
         match.fixture.status.short === 'P';
}

export function getMatchStatusText(match: LiveMatch): string {
  const status = match.fixture.status;
  
  switch (status.short) {
    case 'LIVE':
      return `${status.elapsed}'`;
    case 'HT':
      return 'HALF-TIME';
    case 'ET':
      return 'EXTRA TIME';
    case 'P':
      return 'PENALTIES';
    case 'FT':
      return 'FULL TIME';
    case 'NS':
      return 'NOT STARTED';
    default:
      return status.long;
  }
}

export function formatMatchScore(match: LiveMatch): string {
  if (match.fixture.status.short === 'NS') {
    return 'vs';
  }
  return `${match.goals.home} - ${match.goals.away}`;
}
