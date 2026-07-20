"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, CheckCircle2, Clock, Radio, Calendar, Trophy, ChevronRight, ChevronDown, ChevronUp, Crown, Medal, AlertTriangle } from "lucide-react";
import { getTeamById, UserPredictions } from "@/lib/tournament-data";
import { syncTournamentWithFootballData, isPredictionLocked as checkPredictionLocked } from "@/lib/football-data-sync";
import { useFootballData } from "@/hooks/useFootballData";
import { useOpenFootball } from "@/hooks/useOpenFootball";
import { useTournamentSupabase } from "@/context/TournamentContextSupabase";

type MatchStatus = "completed" | "live" | "upcoming";

const statusIcon: Record<MatchStatus, React.ReactNode> = {
  completed: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
  live:      <Radio className="h-3.5 w-3.5 text-red-400 animate-pulse" />,
  upcoming:  <Clock className="h-3.5 w-3.5 text-muted-foreground" />,
};

const statusLabel: Record<MatchStatus, string> = {
  completed: "FT",
  live:      "LIVE",
  upcoming:  "Upcoming",
};

// Helper to calculate time until kickoff - uses utcDate from API
function getTimeUntilKickoff(utcDate: string | undefined, fallbackDate: string): { text: string; isLocked: boolean; isClosing: boolean } {
  // If no UTC date, just show the fallback date string
  if (!utcDate) {
    return { text: fallbackDate, isLocked: false, isClosing: false };
  }
  
  const now = Date.now();
  const kickoff = new Date(utcDate).getTime();
  
  if (isNaN(kickoff)) {
    return { text: fallbackDate, isLocked: false, isClosing: false };
  }
  
  const diffMs = kickoff - now;
  const diffMins = Math.floor(diffMs / 60000);
  
  // Already started or passed
  if (diffMins <= 0) {
    return { text: "Started", isLocked: true, isClosing: false };
  }
  
  // Less than 5 minutes - locked
  if (diffMins < 5) {
    return { text: `${diffMins}m left - LOCKED`, isLocked: true, isClosing: true };
  }
  
  // Less than 30 minutes - closing soon
  if (diffMins < 30) {
    return { text: `${diffMins}m to kickoff`, isLocked: false, isClosing: true };
  }
  
  // Less than 60 minutes
  if (diffMins < 60) {
    return { text: `${diffMins}m to kickoff`, isLocked: false, isClosing: false };
  }
  
  // Hours
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  
  if (hours < 24) {
    return { text: mins > 0 ? `${hours}h ${mins}m` : `${hours}h`, isLocked: false, isClosing: false };
  }
  
  // Days
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  if (days === 1) {
    return { text: remainingHours > 0 ? `1 day ${remainingHours}h` : "1 day", isLocked: false, isClosing: false };
  }
  
  return { text: `${days} days`, isLocked: false, isClosing: false };
}

export default function HomePage() {
  const [showPastGames, setShowPastGames] = useState(false);
  const [expandedMatches, setExpandedMatches] = useState<Set<string>>(new Set());
  const [leaderboard, setLeaderboard] = useState<UserPredictions[]>([]);
  const { matches: footballMatches, fetchWorldCupMatches } = useFootballData();
  const { getMatchDetails: getOpenFootballDetails } = useOpenFootball();
  const { getLeaderboard, currentUser, predictions, isAuthenticated } = useTournamentSupabase();
  
  const toggleMatchExpanded = (matchId: string) => {
    setExpandedMatches(prev => {
      const next = new Set(prev);
      if (next.has(matchId)) {
        next.delete(matchId);
      } else {
        next.add(matchId);
      }
      return next;
    });
  };

  useEffect(() => {
    fetchWorldCupMatches();
    const interval = setInterval(fetchWorldCupMatches, 60000);
    return () => clearInterval(interval);
  }, [fetchWorldCupMatches]);

  // Load leaderboard
  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const data = await getLeaderboard();
        setLeaderboard(data);
      } catch (error) {
        console.error('Error loading leaderboard:', error);
      }
    };
    loadLeaderboard();
  }, [getLeaderboard]);
  
  const syncedTournament = syncTournamentWithFootballData(footballMatches);
  
  // Use the 'all' array from synced tournament
  const allMatches = syncedTournament.all;
  const liveMatches = allMatches.filter(m => m.status === "live");
  const upcomingMatches = allMatches.filter(m => m.status === "upcoming").slice(0, 6);
  const pastMatches = allMatches.filter(m => m.status === "completed").reverse().slice(0, showPastGames ? 12 : 4);
  
  // Helper to render a match card
  const renderMatchCard = (m: typeof allMatches[0], showPredictButton = false) => {
    const userPrediction = predictions.find(p => p.matchId === m.id);
    let homeTeam, awayTeam;
    if (m.homeTeamId && m.awayTeamId) {
      homeTeam = getTeamById(m.homeTeamId) || { name: m.homeTeamId, flag: '🏳️', id: m.homeTeamId };
      awayTeam = getTeamById(m.awayTeamId) || { name: m.awayTeamId, flag: '🏳️', id: m.awayTeamId };
    } else {
      const parts = m.id.split('-');
      homeTeam = getTeamById(parts[0]) || { name: parts[0], flag: '🏳️', id: parts[0] };
      awayTeam = getTeamById(parts[1]) || { name: parts[1], flag: '🏳️', id: parts[1] };
    }
    
    const isCompleted = m.status === "completed";
    const isLive = m.status === "live";
    const isUpcoming = m.status === "upcoming";
    const homeWon = m.winner === (m.homeTeamId || homeTeam.id);
    const awayWon = m.winner === (m.awayTeamId || awayTeam.id);
    
    // Get match details from OpenFootball API (includes goal scorers)
    // Pass date to uniquely identify the match (teams can play multiple times in a tournament)
    const openFootballDetails = isCompleted ? getOpenFootballDetails(homeTeam.name, awayTeam.name, m.utcDate || m.date) : null;
    // Use OpenFootball goals if available, otherwise fall back to static data
    const goals = openFootballDetails?.goals || m.goals || [];
    const hasGoals = goals.length > 0;
    
    // Calculate time to kickoff for upcoming matches
    const kickoffInfo = isUpcoming ? getTimeUntilKickoff(m.utcDate, m.date) : null;
    // Use the centralized isPredictionLocked function
    const isPredictionLocked = checkPredictionLocked(m);
    
    return (
      <Card 
        key={m.id} 
        className={cn(
          "border-border/50 transition-all duration-200",
          isLive && "border-red-500/30 bg-red-500/5 ring-1 ring-red-500/20",
          isCompleted && "opacity-80 hover:opacity-100",
          kickoffInfo?.isClosing && !kickoffInfo?.isLocked && "border-amber-500/30 bg-amber-500/5",
          kickoffInfo?.isLocked && "border-red-500/20 bg-red-500/5",
          !isCompleted && !isLive && !kickoffInfo?.isClosing && "hover:border-primary/30"
        )}
      >
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            {isUpcoming && kickoffInfo?.isClosing ? (
              <AlertTriangle className={cn("h-3.5 w-3.5", kickoffInfo.isLocked ? "text-red-400" : "text-amber-400")} />
            ) : (
              statusIcon[m.status as MatchStatus]
            )}
            <span className={cn(
              "font-semibold",
              isLive && "text-red-400",
              isCompleted && "text-emerald-400",
              kickoffInfo?.isLocked && "text-red-400",
              kickoffInfo?.isClosing && !kickoffInfo?.isLocked && "text-amber-400"
            )}>
              {isUpcoming && kickoffInfo ? kickoffInfo.text : statusLabel[m.status as MatchStatus]}
            </span>
            {!isUpcoming && (
              <>
                <span>·</span>
                <span>{m.date}</span>
              </>
            )}
            {m.venue && (
              <>
                <span>·</span>
                <MapPin className="h-3 w-3" />
                <span className="truncate max-w-[100px]">{m.venue}</span>
              </>
            )}
          </div>
          <div 
            className={cn("flex items-center gap-1.5 sm:gap-2", isCompleted && hasGoals && "cursor-pointer")}
            onClick={isCompleted && hasGoals ? () => toggleMatchExpanded(m.id) : undefined}
          >
            <div className={cn("flex-1 flex items-center gap-1.5 sm:gap-2 min-w-0", isCompleted && !homeWon && "opacity-40")}>
              <span className="text-lg sm:text-xl shrink-0">{homeTeam.flag}</span>
              <span className={cn("text-xs sm:text-sm font-semibold truncate", homeWon && "text-primary")}>{homeTeam.name}</span>
            </div>
            <div className="shrink-0 text-center min-w-[3rem] sm:min-w-[3.5rem]">
              {isCompleted || isLive ? (
                <div className="font-black text-sm sm:text-base">
                  <span className={homeWon ? "text-primary" : ""}>{m.homeScore}</span>
                  <span className="text-muted-foreground mx-1">–</span>
                  <span className={awayWon ? "text-primary" : ""}>{m.awayScore}</span>
                </div>
              ) : (
                <span className="text-muted-foreground text-xs sm:text-sm font-bold">vs</span>
              )}
              {m.pens && <div className="text-[10px] text-muted-foreground">pens {m.pens}</div>}
              {isLive && <div className="text-[10px] text-red-400 animate-pulse">LIVE</div>}
            </div>
            <div className={cn("flex-1 flex items-center justify-end gap-1.5 sm:gap-2 min-w-0", isCompleted && !awayWon && "opacity-40")}>
              <span className={cn("text-xs sm:text-sm font-semibold truncate", awayWon && "text-primary")}>{awayTeam.name}</span>
              <span className="text-lg sm:text-xl shrink-0">{awayTeam.flag}</span>
            </div>
            {/* Expand indicator for completed matches with goals */}
            {isCompleted && hasGoals && (
              <div className="shrink-0 ml-1">
                {expandedMatches.has(m.id) ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            )}
          </div>
          {/* Expanded goal details */}
          {isCompleted && expandedMatches.has(m.id) && hasGoals && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {/* Home team goals */}
                <div className="space-y-1">
                  {goals.filter(g => g.team === 'home').map((goal, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground font-mono">{goal.minute}&apos;</span>
                      <span className={cn(goal.ownGoal && "text-red-400")}>
                        {goal.scorer}
                        {goal.penalty && <span className="text-muted-foreground ml-1">(P)</span>}
                        {goal.ownGoal && <span className="text-red-400 ml-1">(OG)</span>}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Away team goals */}
                <div className="space-y-1 text-right">
                  {goals.filter(g => g.team === 'away').map((goal, idx) => (
                    <div key={idx} className="flex items-center justify-end gap-2 text-xs">
                      <span className={cn(goal.ownGoal && "text-red-400")}>
                        {goal.penalty && <span className="text-muted-foreground mr-1">(P)</span>}
                        {goal.ownGoal && <span className="text-red-400 mr-1">(OG)</span>}
                        {goal.scorer}
                      </span>
                      <span className="text-muted-foreground font-mono">{goal.minute}&apos;</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {/* Show prediction if user has one */}
          {showPredictButton && !isCompleted && !isLive && isAuthenticated && userPrediction && (
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                Your prediction: <span className="font-semibold text-foreground">{userPrediction.homeScore} – {userPrediction.awayScore}</span>
              </span>
              {!isPredictionLocked ? (
                <Link href="/predict">
                  <Button size="sm" variant="outline">
                    Update <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              ) : (
                <Badge variant="secondary" className="text-xs">Locked</Badge>
              )}
            </div>
          )}
          {/* Show locked badge if prediction is locked and user has no prediction */}
          {showPredictButton && !isCompleted && !isLive && isPredictionLocked && !userPrediction && isAuthenticated && (
            <div className="mt-3 text-center">
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Predictions locked
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen pb-20">

      {/* ── Hero - Simplified ───────────────────────────────── */}
      <section className="relative overflow-hidden px-4 py-12 sm:py-16"
        style={{ background: "linear-gradient(135deg, oklch(0.08 0.025 160) 0%, oklch(0.13 0.04 155) 50%, oklch(0.10 0.020 145) 100%)" }}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl">
          <div className="flex flex-col items-center text-center gap-5">
            <div className="flex items-center gap-4">
              <Image
                src="/2026_FIFA_World_Cup_emblem.svg.webp"
                alt="FIFA World Cup 2026"
                width={960}
                height={1482}
                priority
                className="h-16 w-auto sm:h-20 rounded-xl shrink-0"
              />
              <div className="text-left">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                  FIFA World Cup <span className="text-primary">2026™</span>
                </h1>
                <p className="text-sm text-muted-foreground">Predictor</p>
              </div>
            </div>

            <p className="max-w-md text-muted-foreground text-sm">
              Predict match scores, compete with friends, and track your points throughout the tournament.
            </p>

            <Link href="/predict" className={cn(buttonVariants({ size: "lg" }), "bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-8 text-base")}>
              Predict Matches <ChevronRight className="h-5 w-5 ml-1" />
            </Link>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>Jun 11 – Jul 19</span>
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="h-3.5 w-3.5" />
                <span>48 Teams</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-6 space-y-8">

        {/* ── Leaderboard ───────────────────────────────────── */}
        {leaderboard.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span>Leaderboard</span>
                </div>
                <Link href="/profile" className="text-xs text-primary hover:underline font-normal">
                  View all
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                {leaderboard.slice(0, 5).map((user, index) => {
                  const isCurrentUser = currentUser?.userId === user.userId;
                  const rank = index + 1;
                  
                  return (
                    <div 
                      key={user.userId}
                      className={cn(
                        "flex items-center gap-2 py-2 px-2 rounded-lg",
                        isCurrentUser && "bg-primary/10"
                      )}
                    >
                      <div className="w-6 flex items-center justify-center shrink-0">
                        {rank === 1 ? (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        ) : rank === 2 ? (
                          <Medal className="h-4 w-4 text-gray-400" />
                        ) : rank === 3 ? (
                          <Medal className="h-4 w-4 text-amber-600" />
                        ) : (
                          <span className="text-xs font-bold text-muted-foreground">{rank}</span>
                        )}
                      </div>
                      <span className="text-lg">{user.avatar}</span>
                      <span className={cn(
                        "flex-1 text-sm truncate",
                        isCurrentUser && "font-semibold text-primary"
                      )}>
                        {user.userName}
                      </span>
                      <span className={cn(
                        "font-bold text-sm tabular-nums",
                        rank === 1 && "text-yellow-500"
                      )}>
                        {user.totalPoints}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Live Matches ───────────────────────────────────── */}
        {liveMatches.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Radio className="h-4 w-4 text-red-400 animate-pulse" />
              <h2 className="text-lg font-bold text-red-400">Live Now</h2>
            </div>
            <div className="grid gap-3">
              {liveMatches.map(m => renderMatchCard(m))}
            </div>
          </section>
        )}

        {/* ── Upcoming Matches ───────────────────────────────── */}
        {upcomingMatches.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-lg font-bold">Upcoming Matches</h2>
              </div>
              <Link href="/predict">
                <Button size="sm" variant="default">
                  Make Predictions <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="grid gap-3">
              {upcomingMatches.map(m => renderMatchCard(m, true))}
            </div>
          </section>
        )}

        {/* ── Past Matches ───────────────────────────────────── */}
        {pastMatches.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <h2 className="text-lg font-bold">Recent Results</h2>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowPastGames(!showPastGames)}
                className="text-sm text-muted-foreground"
              >
                {showPastGames ? (
                  <>Show less <ChevronUp className="h-4 w-4 ml-1" /></>
                ) : (
                  <>Show more <ChevronDown className="h-4 w-4 ml-1" /></>
                )}
              </Button>
            </div>
            <div className="grid gap-3">
              {pastMatches.map(m => renderMatchCard(m))}
            </div>
          </section>
        )}

        {/* ── Tournament Bracket Preview ─────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-bold">Tournament Bracket</h2>
            </div>
            <Link href="/bracket" className="text-sm text-primary hover:underline flex items-center gap-1">
              Full bracket <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <Card className="border-border/50">
            <CardContent className="py-4 px-4">
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div>
                  <div className="font-bold text-muted-foreground mb-2">Round of 32</div>
                  <div className="text-2xl font-black text-primary">
                    {syncedTournament.r32.filter(m => m.status === "completed").length}/32
                  </div>
                  <div className="text-muted-foreground">completed</div>
                </div>
                <div>
                  <div className="font-bold text-muted-foreground mb-2">Round of 16</div>
                  <div className="text-2xl font-black">
                    {syncedTournament.r32.filter(m => m.status === "completed").length >= 32 ? "0/16" : "—"}
                  </div>
                  <div className="text-muted-foreground">upcoming</div>
                </div>
                <div>
                  <div className="font-bold text-muted-foreground mb-2">Quarter Finals</div>
                  <div className="text-2xl font-black">—</div>
                  <div className="text-muted-foreground">upcoming</div>
                </div>
                <div>
                  <div className="font-bold text-muted-foreground mb-2">Final</div>
                  <div className="text-2xl font-black">🏆</div>
                  <div className="text-muted-foreground">Jul 19</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

      </div>
    </div>
  );
}
