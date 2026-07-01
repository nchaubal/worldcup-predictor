import { useState, useEffect, useCallback } from 'react';
import { BBCMatch, getBBCSportService } from '@/lib/bbc-sport-api';

export function useBBCSportScores(pollInterval: number = 30000) {
  const [matches, setMatches] = useState<BBCMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const bbcSportService = getBBCSportService();

      // Subscribe to live score updates
      const unsubscribe = bbcSportService.subscribe((updatedMatches) => {
        setMatches(updatedMatches);
        setLoading(false);
        setError(null);
      });

      // Start polling
      bbcSportService.startPolling(pollInterval);

      // Cleanup
      return () => {
        unsubscribe();
        bbcSportService.stopPolling();
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize BBC Sport scores');
      setLoading(false);
    }
  }, [pollInterval]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const bbcSportService = getBBCSportService();
      const updatedMatches = await bbcSportService.fetchLiveMatches();
      setMatches(updatedMatches);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch BBC Sport scores');
    } finally {
      setLoading(false);
    }
  }, []);

  const getMatchById = useCallback((matchId: string) => {
    return matches.find(match => match.id === matchId);
  }, [matches]);

  const getLiveMatches = useCallback(() => {
    return matches.filter(match => match.isLive);
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
