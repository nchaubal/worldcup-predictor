// Hook for using Football Data.org API
import { useState, useCallback } from 'react';
import { footballDataApi, FootballDataMatch } from '@/lib/football-data-api';

export interface FootballDataMatchWithDetails extends FootballDataMatch {
  formattedTime: string;
  formattedScore: string;
  isLive: boolean;
  isFinished: boolean;
}

export const useFootballData = () => {
  const [matches, setMatches] = useState<FootballDataMatchWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorldCupMatches = useCallback(async (filters?: {
    matchday?: number;
    dateFrom?: string;
    dateTo?: string;
    stage?: string;
    status?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await footballDataApi.getWorldCupMatches(filters);
      const matchesWithDetails = response.matches.map(match => ({
        ...match,
        formattedTime: footballDataApi.getMatchTime(match),
        formattedScore: footballDataApi.getMatchScore(match),
        isLive: footballDataApi.isMatchLive(match),
        isFinished: footballDataApi.isMatchFinished(match),
      }));
      
      setMatches(matchesWithDetails);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch matches');
      console.error('Error fetching World Cup matches:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLiveMatches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await footballDataApi.getLiveWorldCupMatches();
      const matchesWithDetails = response.matches.map(match => ({
        ...match,
        formattedTime: footballDataApi.getMatchTime(match),
        formattedScore: footballDataApi.getMatchScore(match),
        isLive: footballDataApi.isMatchLive(match),
        isFinished: footballDataApi.isMatchFinished(match),
      }));
      
      setMatches(matchesWithDetails);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch live matches');
      console.error('Error fetching live matches:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTodayMatches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to get today's matches first
      const todayResponse = await footballDataApi.getTodayWorldCupMatches();
      
      // If no matches today, get recent matches (last 5 days)
      let matches = todayResponse.matches;
      
      if (matches.length === 0) {
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
        const dateFrom = fiveDaysAgo.toISOString().split('T')[0];
        const dateTo = new Date().toISOString().split('T')[0];
        
        const recentResponse = await footballDataApi.getWorldCupMatches({ 
          dateFrom, 
          dateTo 
        });
        matches = recentResponse.matches;
      }
      
      const matchesWithDetails = matches.map(match => ({
        ...match,
        formattedTime: footballDataApi.getMatchTime(match),
        formattedScore: footballDataApi.getMatchScore(match),
        isLive: footballDataApi.isMatchLive(match),
        isFinished: footballDataApi.isMatchFinished(match),
      }));
      
      // Sort: live matches first, then finished (most recent first), then upcoming
      matchesWithDetails.sort((a, b) => {
        // Live matches always first
        if (a.isLive && !b.isLive) return -1;
        if (!a.isLive && b.isLive) return 1;
        
        // Finished matches before upcoming
        if (a.isFinished && !b.isFinished && !b.isLive) return -1;
        if (!a.isFinished && !a.isLive && b.isFinished) return 1;
        
        // For finished matches, most recent first (descending by date)
        if (a.isFinished && b.isFinished) {
          return new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime();
        }
        
        // For upcoming matches, soonest first (ascending by date)
        return new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime();
      });
      
      setMatches(matchesWithDetails);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch matches');
      console.error('Error fetching matches:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMatch = useCallback(async (matchId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const match = await footballDataApi.getMatch(matchId);
      const matchWithDetails = {
        ...match,
        formattedTime: footballDataApi.getMatchTime(match),
        formattedScore: footballDataApi.getMatchScore(match),
        isLive: footballDataApi.isMatchLive(match),
        isFinished: footballDataApi.isMatchFinished(match),
      };
      
      return matchWithDetails;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch match');
      console.error('Error fetching match:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // NOTE: This hook does NOT auto-fetch. Each consumer decides what to load
  // (e.g. fetchWorldCupMatches for all matches, fetchLiveMatches for the live
  // widget) so that one component's fetch does not overwrite another's data.

  return {
    matches,
    loading,
    error,
    fetchWorldCupMatches,
    fetchLiveMatches,
    fetchTodayMatches,
    fetchMatch,
    refetch: fetchTodayMatches,
  };
};
