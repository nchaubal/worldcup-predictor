import { useState, useEffect, useCallback } from 'react';
import { FIFAMatch, getFIFAApiService } from '@/lib/fifa-api';

export function useFIFAScores(pollInterval: number = 60000) {
  const [matches, setMatches] = useState<FIFAMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let mounted = true;

    const init = async () => {
      try {
        const fifaApiService = getFIFAApiService();

        // Subscribe to live score updates
        unsubscribe = fifaApiService.subscribe((updatedMatches) => {
          if (mounted) {
            setMatches(updatedMatches);
            setLoading(false);
            setError(null);
          }
        });

        // Start polling
        fifaApiService.startPolling(pollInterval);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize FIFA scores');
          setLoading(false);
        }
      }
    };

    init();

    // Cleanup
    return () => {
      mounted = false;
      unsubscribe?.();
      try {
        getFIFAApiService().stopPolling();
      } catch {
        // Service may not be initialized
      }
    };
  }, [pollInterval]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const fifaApiService = getFIFAApiService();
      const updatedMatches = await fifaApiService.fetchLiveMatches();
      setMatches(updatedMatches);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch FIFA scores');
    } finally {
      setLoading(false);
    }
  }, []);

  const getMatchById = useCallback((matchId: string) => {
    return matches.find(match => match.id === matchId);
  }, [matches]);

  const getLiveMatches = useCallback(() => {
    return matches.filter(match => match.status === 'LIVE');
  }, [matches]);

  const getMatchesByGroup = useCallback((group: string) => {
    return matches.filter(match => match.group === group);
  }, [matches]);

  const getMatchesByStage = useCallback((stage: string) => {
    return matches.filter(match => match.stage === stage);
  }, [matches]);

  return {
    matches,
    loading,
    error,
    refresh,
    getMatchById,
    getLiveMatches,
    getMatchesByGroup,
    getMatchesByStage,
  };
}
