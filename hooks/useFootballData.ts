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
      
      // Only update state if we got valid data - prevents wiping out good data on API errors
      if (matchesWithDetails.length > 0) {
        setMatches(matchesWithDetails);
      } else {
        console.warn('API returned empty matches, keeping previous data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch matches');
      console.error('Error fetching World Cup matches:', err);
      // Don't clear matches on error - keep the last good data
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
      
      // Live matches can legitimately be empty (no games currently playing)
      setMatches(matchesWithDetails);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch live matches');
      console.error('Error fetching live matches:', err);
      // Don't clear matches on error
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTodayMatches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get matches from the last 3 days plus today to show recent results
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const dateFrom = threeDaysAgo.toISOString().split('T')[0];
      const dateTo = new Date().toISOString().split('T')[0];
      
      const recentResponse = await footballDataApi.getWorldCupMatches({ 
        dateFrom, 
        dateTo 
      });
      const matches = recentResponse.matches;
      
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
      
      // Only update if we got data
      if (matchesWithDetails.length > 0) {
        setMatches(matchesWithDetails);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch matches');
      console.error('Error fetching matches:', err);
      // Don't clear matches on error
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUpcomingMatches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const today = new Date().toISOString().split('T')[0];
      const tenDaysOut = new Date();
      tenDaysOut.setDate(tenDaysOut.getDate() + 10);
      const dateTo = tenDaysOut.toISOString().split('T')[0];

      const response = await footballDataApi.getWorldCupMatches({ dateFrom: today, dateTo });
      const matchesWithDetails = response.matches
        .map(match => ({
          ...match,
          formattedTime: footballDataApi.getMatchTime(match),
          formattedScore: footballDataApi.getMatchScore(match),
          isLive: footballDataApi.isMatchLive(match),
          isFinished: footballDataApi.isMatchFinished(match),
        }))
        // Only genuinely upcoming fixtures - excludes today's matches that
        // already finished or are currently live.
        .filter(match => !match.isFinished && !match.isLive);

      // Upcoming can legitimately be empty if all matches are done
      setMatches(matchesWithDetails);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch upcoming matches');
      console.error('Error fetching upcoming matches:', err);
      // Don't clear matches on error
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
    fetchUpcomingMatches,
    fetchMatch,
    refetch: fetchTodayMatches,
  };
};
