import { useState, useEffect, useCallback } from 'react';
import { LiveMatch, getLiveScoreService } from '@/lib/live-scores';

export function useLiveScores(pollInterval: number = 30000) {
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let mounted = true;

    const init = async () => {
      // Check if API key is available
      if (!process.env.NEXT_PUBLIC_API_FOOTBALL_KEY) {
        if (mounted) {
          setError('API key not configured. See LIVE_SCORES_SETUP.md for instructions.');
          setLoading(false);
        }
        return;
      }

      try {
        const liveScoreService = getLiveScoreService();

        // Subscribe to live score updates
        unsubscribe = liveScoreService.subscribe((updatedMatches) => {
          if (mounted) {
            setMatches(updatedMatches);
            setLoading(false);
            setError(null);
          }
        });

        // Start polling
        liveScoreService.startPolling(pollInterval);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize live scores');
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
        getLiveScoreService().stopPolling();
      } catch {
        // Service may not be initialized
      }
    };
  }, [pollInterval]);

  const refresh = useCallback(async () => {
    if (!process.env.NEXT_PUBLIC_API_FOOTBALL_KEY) {
      setError('API key not configured. See LIVE_SCORES_SETUP.md for instructions.');
      return;
    }

    try {
      setLoading(true);
      const liveScoreService = getLiveScoreService();
      const updatedMatches = await liveScoreService.fetchLiveMatches();
      setMatches(updatedMatches);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch live scores');
    } finally {
      setLoading(false);
    }
  }, []);

  const getMatchById = useCallback((fixtureId: number) => {
    return matches.find(match => match.fixture.id === fixtureId);
  }, [matches]);

  const getLiveMatches = useCallback(() => {
    return matches.filter(match => 
      match.fixture.status.short === 'LIVE' || 
      match.fixture.status.short === 'HT' || 
      match.fixture.status.short === 'ET' ||
      match.fixture.status.short === 'P'
    );
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
