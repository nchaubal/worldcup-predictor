import { useState, useEffect, useCallback } from 'react';
import { ESPNMatch, getESPNScoreService } from '@/lib/espn-api';

export function useESPNScores(pollInterval: number = 30000) {
  const [matches, setMatches] = useState<ESPNMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const espnService = getESPNScoreService();

      // Subscribe to live score updates
      const unsubscribe = espnService.subscribe((updatedMatches) => {
        setMatches(updatedMatches);
        setLoading(false);
        setError(null);
      });

      // Start polling
      espnService.startPolling(pollInterval);

      // Cleanup
      return () => {
        unsubscribe();
        espnService.stopPolling();
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize ESPN scores');
      setLoading(false);
    }
  }, [pollInterval]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const espnService = getESPNScoreService();
      const updatedMatches = await espnService.fetchLiveMatches();
      setMatches(updatedMatches);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ESPN scores');
    } finally {
      setLoading(false);
    }
  }, []);

  const getMatchById = useCallback((matchId: string) => {
    return matches.find(match => match.id === matchId);
  }, [matches]);

  const getLiveMatches = useCallback(() => {
    return matches.filter(match => {
      const status = match.status.type;
      return status.state === 'in' || status.id === '39';
    });
  }, [matches]);

  return {
    matches,
    loading,
    error,
    refresh,
    getMatchById,
    getLiveMatches,
  };
}
