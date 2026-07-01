// Free ESPN API Integration
// ESPN provides free public endpoints for sports data

export interface ESPNMatch {
  id: string;
  name: string;
  shortName: string;
  date: string;
  status: {
    type: {
      id: string;
      name: string;
      state: string;
      completed: boolean;
      description: string;
    };
    displayClock: string;
    period: number;
  };
  competitions: Array<{
    id: string;
    competitors: Array<{
      id: string;
      team: {
        id: string;
        name: string;
        displayName: string;
        logo: string;
      };
      score: number;
      winner: boolean;
    }>;
    venue: {
      fullName: string;
    };
  }>;
}

export interface ESPNResponse {
  events: ESPNMatch[];
}

class ESPNScoreService {
  private baseUrl = 'https://site.web.api.espn.com/apis/site/v2/sports/soccer/ifa/world-cup';
  private pollInterval: NodeJS.Timeout | null = null;
  private subscribers: Set<(matches: ESPNMatch[]) => void> = new Set();

  // Subscribe to live score updates
  subscribe(callback: (matches: ESPNMatch[]) => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  // Notify all subscribers
  private notifySubscribers(matches: ESPNMatch[]) {
    this.subscribers.forEach(callback => callback(matches));
  }

  // Fetch live matches
  async fetchLiveMatches(): Promise<ESPNMatch[]> {
    try {
      // ESPN's free public API endpoint
      const response = await fetch(`${this.baseUrl}/scoreboard`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ESPNResponse = await response.json();
      return data.events || [];
    } catch (error) {
      console.error('Error fetching ESPN matches:', error);
      return [];
    }
  }

  // Fetch specific match details
  async fetchMatch(matchId: string): Promise<ESPNMatch | null> {
    try {
      const response = await fetch(`${this.baseUrl}/scoreboard?event=${matchId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ESPNResponse = await response.json();
      return data.events.find(match => match.id === matchId) || null;
    } catch (error) {
      console.error('Error fetching ESPN match:', error);
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

  // Get all World Cup fixtures
  async getWorldCupFixtures(): Promise<ESPNMatch[]> {
    return this.fetchLiveMatches();
  }
}

// Create singleton instance
let espnService: ESPNScoreService | null = null;

export function getESPNScoreService(): ESPNScoreService {
  if (!espnService) {
    espnService = new ESPNScoreService();
  }
  return espnService;
}

// Utility functions
export function isMatchLive(match: ESPNMatch): boolean {
  return match.status.type.state === 'in' || 
         match.status.type.state === 'pre' || 
         match.status.type.id === '39'; // Live status
}

export function getMatchStatusText(match: ESPNMatch): string {
  const status = match.status.type;
  
  if (status.completed) {
    return 'FULL TIME';
  }
  
  switch (status.state) {
    case 'in':
      return match.status.displayClock || 'LIVE';
    case 'pre':
      return 'UPCOMING';
    case 'post':
      return status.description || 'FULL TIME';
    default:
      return status.name || 'UNKNOWN';
  }
}

export function formatMatchScore(match: ESPNMatch): string {
  if (match.status.type.state === 'pre') {
    return 'vs';
  }
  
  const competition = match.competitions[0];
  if (!competition) return 'vs';
  
  const homeScore = competition.competitors[0]?.score || 0;
  const awayScore = competition.competitors[1]?.score || 0;
  
  return `${homeScore} - ${awayScore}`;
}

export function getTeamNames(match: ESPNMatch): { home: string; away: string } {
  const competition = match.competitions[0];
  if (!competition) return { home: 'Team A', away: 'Team B' };
  
  const homeTeam = competition.competitors[0]?.team.displayName || 'Team A';
  const awayTeam = competition.competitors[1]?.team.displayName || 'Team B';
  
  return { home: homeTeam, away: awayTeam };
}

export function getVenue(match: ESPNMatch): string {
  return match.competitions[0]?.venue?.fullName || 'Unknown Venue';
}
