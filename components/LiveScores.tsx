import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLiveScores } from '@/hooks/useLiveScores';
import { LiveMatch, isMatchLive, getMatchStatusText, formatMatchScore } from '@/lib/live-scores';
import { Radio, RefreshCw, Clock, CheckCircle2 } from 'lucide-react';

export function LiveScores() {
  const { matches, loading, error, refresh, getLiveMatches } = useLiveScores();
  const [showAll, setShowAll] = useState(false);
  
  const liveMatches = getLiveMatches();
  const displayMatches = showAll ? matches : liveMatches;

  const getStatusIcon = (match: LiveMatch) => {
    const status = match.fixture.status.short;
    
    switch (status) {
      case 'LIVE':
        return <Radio className="h-3 w-3 text-red-400 animate-pulse" />;
      case 'HT':
        return <Clock className="h-3 w-3 text-yellow-400" />;
      case 'FT':
        return <CheckCircle2 className="h-3 w-3 text-emerald-400" />;
      default:
        return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (match: LiveMatch) => {
    const status = match.fixture.status.short;
    
    switch (status) {
      case 'LIVE':
        return <Badge className="bg-red-500 text-white text-xs animate-pulse">LIVE</Badge>;
      case 'HT':
        return <Badge variant="secondary" className="text-xs">HALF-TIME</Badge>;
      case 'FT':
        return <Badge className="bg-emerald-500 text-white text-xs">FULL TIME</Badge>;
      case 'NS':
        return <Badge variant="outline" className="text-xs">UPCOMING</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    }
  };

  if (error) {
    return (
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Radio className="h-4 w-4 text-red-400" />
            Live Scores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">Unable to load live scores</p>
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
            <Radio className="h-4 w-4 text-red-400" />
            Live Scores
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
              {showAll ? 'No matches scheduled' : 'No live matches at the moment'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayMatches.map((match) => (
              <div
                key={match.fixture.id}
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
                  {getStatusBadge(match)}
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{match.teams.home.name}</span>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-sm">
                      {formatMatchScore(match)}
                    </div>
                    {match.fixture.status.short === 'HT' && (
                      <div className="text-xs text-muted-foreground">
                        HT: {match.score.halftime.home} - {match.score.halftime.away}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-lg">{match.teams.away.name}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{match.fixture.venue.name}</span>
                  <span>
                    {new Date(match.fixture.date).toLocaleString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
