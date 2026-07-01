// Hook for using Football Data.org API
import { useState, useEffect, useCallback } from 'react';
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
      
      const response = await footballDataApi.getTodayWorldCupMatches();
      const matchesWithDetails = response.matches.map(match => ({
        ...match,
        formattedTime: footballDataApi.getMatchTime(match),
        formattedScore: footballDataApi.getMatchScore(match),
        isLive: footballDataApi.isMatchLive(match),
        isFinished: footballDataApi.isMatchFinished(match),
      }));
      
      setMatches(matchesWithDetails);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch today matches');
      console.error('Error fetching today matches:', err);
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

  // Auto-refresh live matches every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLiveMatches();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchLiveMatches]);

  // Initial load of today's matches
  useEffect(() => {
    fetchTodayMatches();
  }, [fetchTodayMatches]);

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
