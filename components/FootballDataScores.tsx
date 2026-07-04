// Football Data.org Scores Component with OpenFootball enrichment
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useFootballData, FootballDataMatchWithDetails } from '@/hooks/useFootballData';
import { useOpenFootball } from '@/hooks/useOpenFootball';
import { MatchDetails } from '@/lib/openfootball-api';

interface FootballDataScoresProps {
  className?: string;
  limit?: number;
  showOnlyLive?: boolean;
}

function MatchRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 animate-pulse">
      <div className="flex items-center gap-3 flex-1">
        <div className="flex-1 space-y-1.5 text-right">
          <div className="h-3.5 w-24 rounded bg-muted ml-auto" />
          <div className="h-2.5 w-10 rounded bg-muted ml-auto" />
        </div>
        <div className="h-4 w-8 rounded bg-muted shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-24 rounded bg-muted" />
          <div className="h-2.5 w-10 rounded bg-muted" />
        </div>
      </div>
      <div className="h-5 w-12 rounded bg-muted ml-4 shrink-0" />
    </div>
  );
}

// Goal scorers display component
function GoalScorersDisplay({ details, isHome }: { details: MatchDetails; isHome: boolean }) {
  const goals = details.goals.filter(g => g.team === (isHome ? 'home' : 'away'));
  if (goals.length === 0) return null;

  return (
    <div className={`text-[10px] text-muted-foreground ${isHome ? 'text-right' : 'text-left'}`}>
      {goals.map((goal, i) => (
        <div key={i} className="truncate">
          ⚽ {goal.scorer} {goal.minute}&apos;
          {goal.penalty && ' (P)'}
          {goal.ownGoal && ' (OG)'}
        </div>
      ))}
    </div>
  );
}

export const FootballDataScores: React.FC<FootballDataScoresProps> = ({
  className,
  limit = 10,
  showOnlyLive = false
}) => {
  const { matches, loading, error, fetchLiveMatches, fetchUpcomingMatches } = useFootballData();
  const { getMatchDetails } = useOpenFootball();
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null);
  const [showAll, setShowAll] = React.useState(false);

  React.useEffect(() => {
    const load = () => (showOnlyLive ? fetchLiveMatches() : fetchUpcomingMatches());
    load();
    // Refresh periodically so live scores stay current
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [showOnlyLive, fetchLiveMatches, fetchUpcomingMatches]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">World Cup 2026 Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <MatchRowSkeleton />
            <MatchRowSkeleton />
            <MatchRowSkeleton />
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
    : showAll ? matches : matches.slice(0, limit);

  if (displayMatches.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">
            {showOnlyLive ? 'Live Matches' : "Upcoming World Cup Matches"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>
              {showOnlyLive
                ? 'No live matches currently'
                : 'No upcoming World Cup matches found'
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
        <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-400">
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
        <span className={`font-bold tabular-nums ${match.isLive ? 'text-red-400' : 'text-foreground'}`}>
          {match.formattedScore}
        </span>
      );
    }
    return <span className="text-muted-foreground">vs</span>;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>{showOnlyLive ? 'Live Matches' : "Upcoming World Cup Matches"}</span>
          {!showOnlyLive && (
            <button
              onClick={() => fetchUpcomingMatches()}
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Refresh
            </button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayMatches.map((match) => {
            const matchDetails = getMatchDetails(match.homeTeam.name, match.awayTeam.name);
            const isExpanded = expandedMatch === match.id;
            const hasGoals = matchDetails && matchDetails.goals.length > 0;

            return (
              <div
                key={match.id}
                className={`rounded-lg border transition-colors duration-150 ${
                  match.isLive
                    ? 'border-red-500/30 bg-red-500/5'
                    : 'border-border/50'
                }`}
              >
                <div 
                  className={`flex items-center justify-between p-3 ${hasGoals ? 'cursor-pointer hover:bg-accent/40' : ''}`}
                  onClick={() => hasGoals && setExpandedMatch(isExpanded ? null : match.id)}
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="text-right flex-1 min-w-0">
                      <p className="font-medium text-xs sm:text-sm truncate">{match.homeTeam.name}</p>
                      <p className="text-[10px] text-muted-foreground">{match.homeTeam.tla}</p>
                    </div>

                    <div className="px-2 sm:px-3 text-center shrink-0">
                      {getScoreDisplay(match)}
                      {/* Show elapsed time for live matches */}
                      {match.isLive && (
                        <p className="text-[10px] text-red-400 animate-pulse mt-0.5">
                          {match.status === 'PAUSED' ? 'HT' : 'LIVE'}
                        </p>
                      )}
                    </div>

                    <div className="text-left flex-1 min-w-0">
                      <p className="font-medium text-xs sm:text-sm truncate">{match.awayTeam.name}</p>
                      <p className="text-[10px] text-muted-foreground">{match.awayTeam.tla}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 ml-2 sm:ml-4 shrink-0">
                    <div className="flex items-center gap-1 sm:gap-2">
                      {getStatusBadge(match)}
                      {hasGoals && (
                        isExpanded ? <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      )}
                    </div>
                    {match.stage && (
                      <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                        {match.stage}
                      </span>
                    )}
                    {match.group && (
                      <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                        {match.group}
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded goal scorers section */}
                {isExpanded && matchDetails && (
                  <div className="px-3 pb-3 border-t border-border/30 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <GoalScorersDisplay details={matchDetails} isHome={true} />
                      <GoalScorersDisplay details={matchDetails} isHome={false} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!showOnlyLive && !showAll && matches.length > limit && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowAll(true)}
              className="text-sm text-primary hover:underline"
            >
              See more
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
