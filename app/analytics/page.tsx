"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTournamentSupabase } from "@/context/TournamentContextSupabase";
import { UserPredictions } from "@/lib/tournament-data";
import { BarChart3, Trophy, Target, Users, TrendingUp, Calendar, Award } from "lucide-react";
import { MOCK_ANALYTICS } from "@/lib/mock-data";

export default function AnalyticsPage() {
  const { leagues, currentUser, getLeaderboard, isLoading } = useTournamentSupabase();
  const [selectedLeague, setSelectedLeague] = useState(leagues[0]?.id || "");
  const [leaderboard, setLeaderboard] = useState<UserPredictions[]>([]);
  
  const currentLeague = leagues.find(l => l.id === selectedLeague);

  // Load leaderboard data
  useEffect(() => {
    const loadLeaderboard = async () => {
      if (selectedLeague) {
        const data = await getLeaderboard(selectedLeague);
        setLeaderboard(data);
      }
    };
    loadLeaderboard();
  }, [selectedLeague, getLeaderboard]);

  // Calculate additional analytics
  const analytics = useMemo(() => {
    const totalUsers = currentLeague?.members.length || 0;
    const totalPredictions = currentLeague?.members.reduce((sum, user) => 
      sum + (user.predictions?.length || 0), 0) || 0;
    
    const avgPoints = leaderboard.length > 0 
      ? leaderboard.reduce((sum, user) => sum + user.totalPoints, 0) / leaderboard.length 
      : 0;

    const topPerformer = leaderboard[0];
    const predictionAccuracy = MOCK_ANALYTICS.averageAccuracy;

    return {
      totalUsers,
      totalPredictions,
      avgPoints: Math.round(avgPoints),
      topPerformer,
      predictionAccuracy,
      mostPredictedWinner: MOCK_ANALYTICS.mostPredictedWinner,
      highestScoringUser: MOCK_ANALYTICS.highestScoringUser,
      mostActiveDay: MOCK_ANALYTICS.mostActiveDay,
      predictionDistribution: MOCK_ANALYTICS.predictionDistribution,
      teamPerformance: MOCK_ANALYTICS.teamPerformance
    };
  }, [currentLeague, leaderboard]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">League Analytics</h1>
            <p className="text-muted-foreground text-sm">Detailed insights and performance metrics</p>
          </div>
        </div>
      </div>

      {/* League Selection */}
      {leagues.length > 1 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {leagues.map((league) => (
              <button
                key={league.id}
                onClick={() => setSelectedLeague(league.id)}
                className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                  selectedLeague === league.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {league.name}
                <Badge variant="secondary" className="text-xs">{league.members.length}</Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{analytics.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Predictions</p>
                <p className="text-2xl font-bold">{analytics.totalPredictions}</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Points</p>
                <p className="text-2xl font-bold">{analytics.avgPoints}</p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Accuracy</p>
                <p className="text-2xl font-bold">{Math.round(analytics.predictionAccuracy * 100)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Leaderboard */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                {currentLeague?.name} — Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leaderboard.map((user, idx) => {
                  const isMe = currentUser?.userId === user.userId;
                  const medalColors = [
                    "text-yellow-500",
                    "text-gray-400", 
                    "text-amber-600",
                  ];
                  
                  return (
                    <div
                      key={user.userId}
                      className={`flex items-center gap-3 rounded-lg px-3 py-3 ${
                        isMe ? "bg-primary/8 ring-1 ring-primary/25" : "hover:bg-accent/40"
                      }`}
                    >
                      <div className={`w-8 text-center font-bold text-lg ${
                        medalColors[idx] ?? "text-muted-foreground"
                      }`}>
                        {idx < 3 ? <Award className="h-5 w-5 mx-auto" /> : idx + 1}
                      </div>
                      <div className="text-2xl">{user.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium flex items-center gap-2">
                          {user.userName}
                          {isMe && <Badge variant="secondary" className="text-xs">You</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.predictions?.length ?? 0} predictions made
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">{user.totalPoints}</div>
                        <div className="text-xs text-muted-foreground">pts</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Prediction Distribution */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                Prediction Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Exact Score</span>
                    <span className="font-medium">{analytics.predictionDistribution.correctExact}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(analytics.predictionDistribution.correctExact / analytics.totalPredictions) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Correct Result</span>
                    <span className="font-medium">{analytics.predictionDistribution.correctResult}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(analytics.predictionDistribution.correctResult / analytics.totalPredictions) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Incorrect</span>
                    <span className="font-medium">{analytics.predictionDistribution.incorrect}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${(analytics.predictionDistribution.incorrect / analytics.totalPredictions) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-green-500" />
                Top Performer
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.topPerformer && (
                <div className="text-center">
                  <div className="text-4xl mb-2">{analytics.topPerformer.avatar}</div>
                  <div className="font-semibold">{analytics.topPerformer.userName}</div>
                  <div className="text-2xl font-bold text-primary">{analytics.topPerformer.totalPoints}</div>
                  <div className="text-sm text-muted-foreground">points</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-500" />
                Most Active Day
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="font-semibold">{new Date(analytics.mostActiveDay).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Peak prediction activity
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
