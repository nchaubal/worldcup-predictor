"use client";

import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTeamById } from "@/lib/tournament-data";
import { useFootballData } from "@/hooks/useFootballData";
import { syncTournamentWithFootballData } from "@/lib/football-data-sync";
import { useTournamentSupabase } from "@/context/TournamentContextSupabase";
import { History, CheckCircle2, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HistoryPage() {
  const { matches: footballMatches, fetchWorldCupMatches } = useFootballData();
  const { predictions, isAuthenticated, getTotalPoints, getPointsBreakdown } = useTournamentSupabase();

  useEffect(() => {
    fetchWorldCupMatches();
  }, [fetchWorldCupMatches]);

  const syncedTournament = syncTournamentWithFootballData(footballMatches);
  const completedMatches = syncedTournament.all.filter(m => m.status === "completed").reverse();
  const pointsBreakdown = getPointsBreakdown();

  // Get matches where user made predictions
  const predictedMatches = completedMatches.filter(m => 
    predictions.some(p => p.matchId === m.id)
  );

  // Calculate points for each prediction
  const getMatchPoints = (matchId: string, homeScore: number, awayScore: number) => {
    const prediction = predictions.find(p => p.matchId === matchId);
    if (!prediction) return { points: 0, type: 'none' };
    
    const predHome = prediction.homeScore;
    const predAway = prediction.awayScore;
    
    if (predHome === homeScore && predAway === awayScore) {
      return { points: 3, type: 'exact' };
    } else if ((predHome - predAway) === (homeScore - awayScore)) {
      return { points: 2, type: 'margin' };
    } else if (
      (predHome > predAway && homeScore > awayScore) ||
      (predHome < predAway && homeScore < awayScore) ||
      (predHome === predAway && homeScore === awayScore)
    ) {
      return { points: 1, type: 'result' };
    }
    return { points: 0, type: 'wrong' };
  };

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <History className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Prediction History</h1>
        </div>
        <Card className="border-border/50">
          <CardContent className="py-12 text-center">
            <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">Sign in to view your prediction history</p>
            <p className="text-sm text-muted-foreground">Track your predictions and points earned for each match</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <History className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold">Prediction History</h1>
      </div>

      {/* Stats summary */}
      <Card className="mb-6 border-border/50">
        <CardContent className="py-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-black text-primary">{getTotalPoints()}</div>
              <div className="text-xs text-muted-foreground">Total Points</div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-400">{pointsBreakdown.exact}</div>
              <div className="text-xs text-muted-foreground">Exact (3pts)</div>
            </div>
            <div>
              <div className="text-2xl font-black text-blue-400">{pointsBreakdown.margin}</div>
              <div className="text-xs text-muted-foreground">Margin (2pts)</div>
            </div>
            <div>
              <div className="text-2xl font-black text-yellow-400">{pointsBreakdown.result}</div>
              <div className="text-xs text-muted-foreground">Result (1pt)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prediction history */}
      {predictedMatches.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">No completed predictions yet</p>
            <p className="text-sm text-muted-foreground">Your prediction results will appear here after matches are completed</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {predictedMatches.map(m => {
            let homeTeam, awayTeam;
            if (m.homeTeamId && m.awayTeamId) {
              homeTeam = getTeamById(m.homeTeamId) || { name: m.homeTeamId, flag: '🏳️', id: m.homeTeamId };
              awayTeam = getTeamById(m.awayTeamId) || { name: m.awayTeamId, flag: '🏳️', id: m.awayTeamId };
            } else {
              const parts = m.id.split('-');
              homeTeam = getTeamById(parts[0]) || { name: parts[0], flag: '🏳️', id: parts[0] };
              awayTeam = getTeamById(parts[1]) || { name: parts[1], flag: '🏳️', id: parts[1] };
            }

            const prediction = predictions.find(p => p.matchId === m.id);
            const { points, type } = getMatchPoints(m.id, m.homeScore ?? 0, m.awayScore ?? 0);
            const homeWon = m.winner === (m.homeTeamId || homeTeam.id);
            const awayWon = m.winner === (m.awayTeamId || awayTeam.id);

            return (
              <Card key={m.id} className="border-border/50">
                <CardContent className="py-4 px-4">
                  {/* Match info */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="font-semibold text-emerald-400">FT</span>
                      <span>·</span>
                      <span>{m.date}</span>
                    </div>
                    <Badge 
                      variant={type === 'exact' ? "default" : type !== 'wrong' ? "secondary" : "outline"}
                      className={cn(
                        "text-xs",
                        type === 'exact' && "bg-emerald-500",
                        type === 'margin' && "bg-blue-500",
                        type === 'result' && "bg-yellow-500"
                      )}
                    >
                      {points > 0 ? `+${points} pts` : '0 pts'}
                    </Badge>
                  </div>

                  {/* Actual result */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn("flex-1 flex items-center gap-2", !homeWon && "opacity-50")}>
                      <span className="text-xl">{homeTeam.flag}</span>
                      <span className={cn("font-semibold text-sm truncate", homeWon && "text-primary")}>{homeTeam.name}</span>
                    </div>
                    <div className="font-black text-lg">
                      <span className={homeWon ? "text-primary" : ""}>{m.homeScore}</span>
                      <span className="text-muted-foreground mx-2">–</span>
                      <span className={awayWon ? "text-primary" : ""}>{m.awayScore}</span>
                    </div>
                    <div className={cn("flex-1 flex items-center justify-end gap-2", !awayWon && "opacity-50")}>
                      <span className={cn("font-semibold text-sm truncate", awayWon && "text-primary")}>{awayTeam.name}</span>
                      <span className="text-xl">{awayTeam.flag}</span>
                    </div>
                  </div>

                  {/* User's prediction */}
                  {prediction && (
                    <div className="pt-3 border-t border-border/30">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Your prediction:</span>
                        <span className={cn(
                          "font-semibold",
                          type === 'exact' && "text-emerald-400",
                          type === 'margin' && "text-blue-400",
                          type === 'result' && "text-yellow-400",
                          type === 'wrong' && "text-red-400"
                        )}>
                          {prediction.homeScore} – {prediction.awayScore}
                          {type === 'exact' && " ✓ Exact!"}
                          {type === 'margin' && " ✓ Margin"}
                          {type === 'result' && " ✓ Result"}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
