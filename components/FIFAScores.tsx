import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFIFAScores } from '@/hooks/useFIFAScores';
import { FIFAMatch, isMatchLive, getMatchStatusText, formatMatchScore, getTeamNames, getVenue, getTeamCode } from '@/lib/fifa-api';
import { Radio, RefreshCw, Clock, CheckCircle2, Globe } from 'lucide-react';

export function FIFAScores() {
  const { matches, loading, error, refresh, getLiveMatches, getMatchesByGroup, getMatchesByStage } = useFIFAScores();
  const [showAll, setShowAll] = useState(false);
  const liveMatches = getLiveMatches();
  const displayMatches = showAll ? matches : liveMatches;

  const getStatusIcon = (match: FIFAMatch) => {
    switch (match.status) {
      case 'LIVE':
        return <Radio className="h-3 w-3 text-red-400 animate-pulse" />;
      case 'FULL_TIME':
        return <CheckCircle2 className="h-3 w-3 text-emerald-400" />;
      case 'UPCOMING':
        return <Clock className="h-3 w-3 text-muted-foreground" />;
      default:
        return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (match: FIFAMatch) => {
    switch (match.status) {
      case 'LIVE':
        return <Badge className="bg-red-500 text-white text-xs animate-pulse">LIVE</Badge>;
      case 'FULL_TIME':
        return <Badge className="bg-emerald-500 text-white text-xs">FULL TIME</Badge>;
      case 'UPCOMING':
        return <Badge variant="outline" className="text-xs">UPCOMING</Badge>;
      case 'POSTPONED':
        return <Badge variant="destructive" className="text-xs">POSTPONED</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{match.status}</Badge>;
    }
  };

  if (error) {
    return (
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-500" />
            Live Scores (FIFA)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">Unable to load FIFA scores</p>
            <Button onClick={refresh} size="sm" variant="outline">
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-500" />
            Live Scores (FIFA)
            {loading && <RefreshCw className="h-3 w-3 animate-spin" />}
          </CardTitle>
          <div className="flex items-center gap-2">
            {liveMatches.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {liveMatches.length} LIVE
              </Badge>
            )}
            <Button
              onClick={() => setShowAll(!showAll)}
              size="sm"
              variant="ghost"
              className="text-xs h-6 px-2"
            >
              {showAll ? 'Live Only' : 'All Matches'}
            </Button>
            <Button 
              onClick={refresh} 
              size="sm" 
              variant="ghost"
              className="text-xs h-6 px-2"
              disabled={loading}
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {displayMatches.length === 0 ? (
          <div className="text-center py-6">
            <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {showAll ? 'No matches found' : 'No live matches at the moment'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Official FIFA World Cup 2026 data
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayMatches.map((match) => {
              const { home, away } = getTeamNames(match);
              const venue = getVenue(match);
              const homeCode = getTeamCode(match, 'home');
              const awayCode = getTeamCode(match, 'away');
              
              return (
                <div
                  key={match.id}
                  className={`border rounded-lg p-3 transition-all ${
                    isMatchLive(match) 
                      ? 'border-red-500/30 bg-red-50/5' 
                      : 'border-border/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(match)}
                      <span className="text-xs text-muted-foreground">
                        {getMatchStatusText(match)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {match.group && (
                        <Badge variant="outline" className="text-xs">
                          {match.group}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {match.stage}
                      </Badge>
                      {getStatusBadge(match)}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-muted-foreground">
                        {homeCode}
                      </span>
                      <span className="text-sm font-medium">{home}</span>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg">
                        {formatMatchScore(match)}
                      </div>
                      {isMatchLive(match) && (
                        <div className="text-xs text-red-400 animate-pulse">
                          LIVE
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-sm font-medium">{away}</span>
                      <span className="text-lg font-bold text-muted-foreground">
                        {awayCode}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{venue}</span>
                    <span>
                      {new Date(match.matchDate).toLocaleString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: 'numeric',
                        month: 'short'
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
