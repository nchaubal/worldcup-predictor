"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useTournamentSupabase } from "@/context/TournamentContextSupabase";
import { GROUP_MATCHES, KNOCKOUT_MATCHES, TEAMS, UserPredictions } from "@/lib/tournament-data";
import { User, Edit2, Check, Star, BarChart3, Target, Trophy, Crown, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { currentUser, predictions, knockoutPredictions, getTotalPoints, getPointsBreakdown, updateUserName, getLeaderboard, isAuthenticated } = useTournamentSupabase();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(currentUser?.userName || "");
  const [leaderboard, setLeaderboard] = useState<UserPredictions[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  // Load leaderboard
  useEffect(() => {
    const loadLeaderboard = async () => {
      setLoadingLeaderboard(true);
      try {
        const data = await getLeaderboard();
        setLeaderboard(data);
      } catch (error) {
        console.error('Error loading leaderboard:', error);
      } finally {
        setLoadingLeaderboard(false);
      }
    };
    loadLeaderboard();
  }, [getLeaderboard]);

  const totalGroupMatches = GROUP_MATCHES.length;
  const totalKnockoutPicks = Object.keys(knockoutPredictions).length;
  const predictedCount = predictions.length;
  const totalPoints = getTotalPoints();

  const groupProgress = Math.round((predictedCount / totalGroupMatches) * 100);
  const knockoutProgress = Math.round((totalKnockoutPicks / 15) * 100);
  const pointsBreakdown = getPointsBreakdown();

  const saveName = () => {
    if (nameInput.trim()) {
      updateUserName(nameInput.trim());
    }
    setEditingName(false);
  };

  const recentPredictions = predictions.slice(-6).reverse();

  const getTeamById = (id: string | null | undefined) => TEAMS.find((t) => t.id === id);

  const mostPredictedWinner = (() => {
    const counts: Record<string, number> = {};
    predictions.forEach((p) => {
      if (p.predictedWinner && p.predictedWinner !== "draw") {
        counts[p.predictedWinner] = (counts[p.predictedWinner] ?? 0) + 1;
      }
    });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return top ? getTeamById(top[0]) : null;
  })();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">My Profile</h1>
            <p className="text-muted-foreground text-sm">Your predictions and stats</p>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-6 mb-8">
        <Card className="sm:col-span-1">
          <CardContent className="pt-6 pb-6 text-center">
            <div className="text-6xl mb-3">{currentUser?.avatar || "⚽"}</div>
            {editingName ? (
              <div className="flex gap-2">
                <Input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveName()}
                  className="text-center"
                  autoFocus
                />
                <Button size="sm" onClick={saveName}>
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl font-bold">{currentUser?.userName || "Guest"}</span>
                <button onClick={() => setEditingName(true)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>
            )}
            <Badge variant="secondary" className="mt-2">Predictor</Badge>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Your Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-3xl font-bold text-primary">{totalPoints}</div>
                <div className="text-xs text-muted-foreground">Total Points</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{predictedCount}</div>
                <div className="text-xs text-muted-foreground">Predictions Made</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{totalKnockoutPicks}</div>
                <div className="text-xs text-muted-foreground">Bracket Picks</div>
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Group stage predictions</span>
                  <span className="text-muted-foreground">{predictedCount}/{totalGroupMatches}</span>
                </div>
                <Progress value={groupProgress} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Knockout bracket</span>
                  <span className="text-muted-foreground">{totalKnockoutPicks}/15</span>
                </div>
                <Progress value={knockoutProgress} className="h-2" />
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="text-sm font-medium text-muted-foreground">Points Breakdown</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <div className="text-lg font-bold">{pointsBreakdown.exact}</div>
                    <div className="text-xs text-muted-foreground">Exact scores (5 pts)</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div>
                    <div className="text-lg font-bold">{pointsBreakdown.margin}</div>
                    <div className="text-xs text-muted-foreground">Correct margins (2 pts)</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div>
                    <div className="text-lg font-bold">{pointsBreakdown.result}</div>
                    <div className="text-xs text-muted-foreground">Correct results (1 pt)</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {mostPredictedWinner && (
        <Card className="mb-6 bg-primary/5 border-primary/20">
          <CardContent className="pt-4 pb-4 flex items-center gap-4">
            <Target className="h-6 w-6 text-primary shrink-0" />
            <div>
              <div className="text-sm text-muted-foreground">Your most predicted winner</div>
              <div className="flex items-center gap-2 font-semibold">
                <span className="text-xl">{mostPredictedWinner.flag}</span>
                {mostPredictedWinner.name}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {recentPredictions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /> Recent Predictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentPredictions.map((pred) => {
                const match = [...GROUP_MATCHES, ...KNOCKOUT_MATCHES].find((m) => m.id === pred.matchId);
                if (!match?.homeTeam || !match?.awayTeam) return null;
                return (
                  <div key={pred.matchId} className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                    <span>{match.homeTeam.flag}</span>
                    <span className="flex-1">{match.homeTeam.name}</span>
                    <span className="font-bold tabular-nums bg-background rounded px-2 py-0.5">
                      {pred.homeScore} : {pred.awayScore}
                    </span>
                    <span className="flex-1 text-right">{match.awayTeam.name}</span>
                    <span>{match.awayTeam.flag}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {recentPredictions.length === 0 && !isAuthenticated && (
        <Card className="text-center py-12 mb-6">
          <CardContent className="text-muted-foreground">
            <div className="text-4xl mb-4">⚽</div>
            <p className="text-lg font-medium mb-1">No predictions yet</p>
            <p className="text-sm">Head to the Predict page to start making your picks!</p>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" /> Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingLeaderboard ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-muted" />
                  <div className="flex-1 h-4 bg-muted rounded" />
                  <div className="w-12 h-4 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No players yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((user, index) => {
                const isCurrentUser = currentUser?.userId === user.userId;
                const rank = index + 1;
                
                return (
                  <div 
                    key={user.userId}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg transition-colors",
                      isCurrentUser && "bg-primary/10 ring-1 ring-primary/30",
                      !isCurrentUser && "hover:bg-muted/50"
                    )}
                  >
                    {/* Rank */}
                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
                      {rank === 1 ? (
                        <Crown className="h-6 w-6 text-yellow-500" />
                      ) : rank === 2 ? (
                        <Medal className="h-5 w-5 text-gray-400" />
                      ) : rank === 3 ? (
                        <Medal className="h-5 w-5 text-amber-600" />
                      ) : (
                        <span className="text-sm font-bold text-muted-foreground">{rank}</span>
                      )}
                    </div>
                    
                    {/* Avatar & Name */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xl">{user.avatar}</span>
                      <span className={cn(
                        "font-medium truncate",
                        isCurrentUser && "text-primary font-semibold"
                      )}>
                        {user.userName}
                        {isCurrentUser && <span className="text-xs ml-1">(you)</span>}
                      </span>
                    </div>
                    
                    {/* Points */}
                    <div className={cn(
                      "font-bold tabular-nums",
                      rank === 1 && "text-yellow-500",
                      rank === 2 && "text-gray-400",
                      rank === 3 && "text-amber-600"
                    )}>
                      {user.totalPoints} pts
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
