// Football Data.org Scores Component
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFootballData, FootballDataMatchWithDetails } from '@/hooks/useFootballData';

interface FootballDataScoresProps {
  className?: string;
  limit?: number;
  showOnlyLive?: boolean;
}

export const FootballDataScores: React.FC<FootballDataScoresProps> = ({ 
  className, 
  limit = 10,
  showOnlyLive = false 
}) => {
  const { matches, loading, error, fetchLiveMatches, fetchTodayMatches } = useFootballData();

  React.useEffect(() => {
    if (showOnlyLive) {
      fetchLiveMatches();
    } else {
      fetchTodayMatches();
    }
  }, [showOnlyLive, fetchLiveMatches, fetchTodayMatches]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">World Cup 2026 Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">World Cup 2026 Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Unable to load scores</p>
            <p className="text-sm mt-2">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayMatches = showOnlyLive 
    ? matches.filter(m => m.isLive)
    : matches.slice(0, limit);

  if (displayMatches.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">
            {showOnlyLive ? 'Live Matches' : "Today's Matches"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>
              {showOnlyLive 
                ? 'No live matches currently' 
                : 'No matches scheduled for today'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (match: FootballDataMatchWithDetails) => {
    if (match.isLive) {
      return (
        <Badge variant="destructive" className="animate-pulse">
          LIVE
        </Badge>
      );
    }
    if (match.isFinished) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          FT
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        {match.formattedTime}
      </Badge>
    );
  };

  const getScoreDisplay = (match: FootballDataMatchWithDetails) => {
    if (match.isLive || match.isFinished) {
      return (
        <span className={`font-bold ${match.isLive ? 'text-red-600' : 'text-gray-900'}`}>
          {match.formattedScore}
        </span>
      );
    }
    return <span className="text-gray-500">vs</span>;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>{showOnlyLive ? 'Live Matches' : "Today's Matches"}</span>
          {!showOnlyLive && (
            <button
              onClick={() => fetchTodayMatches()}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Refresh
            </button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayMatches.map((match) => (
            <div
              key={match.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                match.isLive ? 'border-red-200 bg-red-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-3 flex-1">
                <div className="text-right flex-1">
                  <p className="font-medium text-sm">{match.homeTeam.name}</p>
                  <p className="text-xs text-muted-foreground">{match.homeTeam.tla}</p>
                </div>
                
                <div className="px-3">
                  {getScoreDisplay(match)}
                </div>
                
                <div className="text-left flex-1">
                  <p className="font-medium text-sm">{match.awayTeam.name}</p>
                  <p className="text-xs text-muted-foreground">{match.awayTeam.tla}</p>
                </div>
              </div>
              
              <div className="flex flex-col items-end space-y-1 ml-4">
                {getStatusBadge(match)}
                {match.stage && (
                  <span className="text-xs text-muted-foreground">
                    {match.stage}
                  </span>
                )}
                {match.group && (
                  <span className="text-xs text-muted-foreground">
                    {match.group}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {!showOnlyLive && matches.length > limit && (
          <div className="mt-4 text-center">
            <button
              onClick={() => fetchTodayMatches()}
              className="text-sm text-primary hover:underline"
            >
              View all matches
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
