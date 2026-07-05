// Hook for using OpenFootball API data
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  fetchOpenFootballData, 
  getMatchDetails, 
  OpenFootballData, 
  MatchDetails 
} from '@/lib/openfootball-api';

export function useOpenFootball() {
  const [data, setData] = useState<OpenFootballData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchOpenFootballData();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      console.error('Error fetching openfootball data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchData();
    }
  }, [fetchData]);

  const getDetails = useCallback(
    (homeTeam: string, awayTeam: string, matchDate?: string): MatchDetails | null => {
      if (!data) return null;
      return getMatchDetails(data, homeTeam, awayTeam, matchDate);
    },
    [data]
  );

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    getMatchDetails: getDetails,
  };
}
