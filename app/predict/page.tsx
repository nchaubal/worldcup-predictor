"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTeamById } from "@/lib/tournament-data";
import { useFootballData } from "@/hooks/useFootballData";
import { syncTournamentWithFootballData } from "@/lib/football-data-sync";
import { useTournamentSupabase } from "@/context/TournamentContextSupabase";
import { PredictionModal } from "@/components/PredictionModal";
import { calculateMatchPoints, type MatchResult as PointsMatchResult } from "@/lib/points-calculator";
import { Clock, CheckCircle2, Radio, Lock, Users, MapPin, Trophy, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";

// Check if predictions are locked (5 minutes before kickoff)
const isPredictionLocked = (): boolean => {
  // For now, return false for upcoming matches (will implement proper time check)
  // In production, parse the date/time and check if current time is within 5 mins of kickoff
  return false;
};

export default function PredictPage() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed">("upcoming");
  const { matches: footballMatches, fetchWorldCupMatches } = useFootballData();
  const { predictions, setPrediction, isAuthenticated } = useTournamentSupabase();
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<typeof allMatches[0] | null>(null);

  useEffect(() => {
    fetchWorldCupMatches();
    const interval = setInterval(fetchWorldCupMatches, 60000);
    return () => clearInterval(interval);
  }, [fetchWorldCupMatches]);

  const syncedTournament = syncTournamentWithFootballData(footballMatches);
  const allMatches = syncedTournament.all;
  
  const liveMatches = allMatches.filter(m => m.status === "live");
  const upcomingMatches = allMatches.filter(m => m.status === "upcoming");
  const completedMatches = allMatches.filter(m => m.status === "completed").reverse();

  // Get user's prediction for a match
  const getUserPrediction = (matchId: string) => {
    return predictions.find(p => p.matchId === matchId);
  };

  // Open prediction modal for a match
  const openPredictionModal = (match: typeof allMatches[0]) => {
    setSelectedMatch(match);
    setModalOpen(true);
  };

  // Handle prediction submission from modal
  const handlePredictionSubmit = async (prediction: {
    homeScore: number;
    awayScore: number;
    etResult: string;
    penaltyWinner: string;
  }) => {
    if (!selectedMatch) return;
    await setPrediction(
      selectedMatch.id,
      prediction.homeScore,
      prediction.awayScore,
      prediction.etResult,
      prediction.penaltyWinner
    );
  };

  // Render a match card with prediction button
  const renderMatchCard = (m: typeof allMatches[0]) => {
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
    const isLocked = isLive || isCompleted || isPredictionLocked();
    const userPrediction = getUserPrediction(m.id);
    const homeWon = m.winner === (m.homeTeamId || homeTeam.id);
    const awayWon = m.winner === (m.awayTeamId || awayTeam.id);
    
    // Calculate points earned using the new points calculator
    let pointsBreakdown = null;
    if (isCompleted && userPrediction && m.homeScore !== undefined && m.awayScore !== undefined) {
      // Build match result object (TODO: get actual ET/penalty results from match data)
      const matchResult: PointsMatchResult = {
        matchId: m.id,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        // For now, we don't have ET/penalty data from the API
        // This would need to be added when match data includes knockout details
        etResult: null,
        penaltyWinner: null,
      };
      
      pointsBreakdown = calculateMatchPoints(
        {
          matchId: m.id,
          homeScore: userPrediction.homeScore,
          awayScore: userPrediction.awayScore,
          etResult: userPrediction.etResult,
          penaltyWinner: userPrediction.penaltyWinner,
        },
        matchResult
      );
    }
    const pointsEarned = pointsBreakdown?.total ?? 0;

    // Format prediction display
    const getPredictionDisplay = () => {
      if (!userPrediction) return null;
      let display = `${userPrediction.homeScore} – ${userPrediction.awayScore}`;
      if (userPrediction.homeScore === userPrediction.awayScore) {
        if (userPrediction.etResult === 'home') {
          display += ` (${homeTeam.name} wins ET)`;
        } else if (userPrediction.etResult === 'away') {
          display += ` (${awayTeam.name} wins ET)`;
        } else if (userPrediction.etResult === 'draw' && userPrediction.penaltyWinner) {
          display += ` (${userPrediction.penaltyWinner === 'home' ? homeTeam.name : awayTeam.name} wins pens)`;
        }
      }
      return display;
    };

    return (
      <Card 
        key={m.id} 
        className={cn(
          "border-border/50 transition-all duration-200",
          isLive && "border-red-500/30 bg-red-500/5 ring-1 ring-red-500/20",
          isCompleted && "opacity-90"
        )}
      >
        <CardContent className="py-4 px-4">
          {/* Match header */}
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
            <div className="flex items-center gap-2">
              {isLive && <Radio className="h-3.5 w-3.5 text-red-400 animate-pulse" />}
              {isCompleted && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
              {!isLive && !isCompleted && <Clock className="h-3.5 w-3.5" />}
              <span className={cn(
                "font-semibold",
                isLive && "text-red-400",
                isCompleted && "text-emerald-400"
              )}>
                {isLive ? "LIVE" : isCompleted ? "FT" : m.date}
              </span>
              {m.venue && (
                <>
                  <span>·</span>
                  <MapPin className="h-3 w-3" />
                  <span className="truncate max-w-[120px]">{m.venue}</span>
                </>
              )}
            </div>
            {isLocked && !isCompleted && (
              <Badge variant="secondary" className="text-[10px] gap-1">
                <Lock className="h-3 w-3" /> Locked
              </Badge>
            )}
          </div>

          {/* Teams and scores */}
          <div className="flex items-center gap-3">
            {/* Home team */}
            <div className={cn("flex-1 flex items-center gap-2", isCompleted && !homeWon && "opacity-50")}>
              <span className="text-2xl">{homeTeam.flag}</span>
              <span className={cn("font-semibold text-sm truncate", homeWon && "text-primary")}>{homeTeam.name}</span>
            </div>

            {/* Score display */}
            <div className="shrink-0 flex items-center gap-2">
              {isCompleted || isLive ? (
                <div className="text-center">
                  <div className="font-black text-xl">
                    <span className={homeWon ? "text-primary" : ""}>{m.homeScore}</span>
                    <span className="text-muted-foreground mx-2">–</span>
                    <span className={awayWon ? "text-primary" : ""}>{m.awayScore}</span>
                  </div>
                  {isLive && <div className="text-[10px] text-red-400 animate-pulse">LIVE</div>}
                </div>
              ) : userPrediction ? (
                <div className="text-center">
                  <div className="font-bold text-lg text-primary">
                    {userPrediction.homeScore} – {userPrediction.awayScore}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Your prediction</div>
                </div>
              ) : (
                <span className="text-muted-foreground font-bold text-lg">vs</span>
              )}
            </div>

            {/* Away team */}
            <div className={cn("flex-1 flex items-center justify-end gap-2", isCompleted && !awayWon && "opacity-50")}>
              <span className={cn("font-semibold text-sm truncate", awayWon && "text-primary")}>{awayTeam.name}</span>
              <span className="text-2xl">{awayTeam.flag}</span>
            </div>
          </div>

          {/* Prediction button for upcoming matches */}
          {isAuthenticated && !isLocked && !isCompleted && (
            <div className="mt-3 flex justify-center">
              <Button 
                size="sm" 
                variant={userPrediction ? "outline" : "default"}
                onClick={() => openPredictionModal(m)}
                className="gap-2"
              >
                {userPrediction ? (
                  <>
                    <Edit3 className="h-4 w-4" />
                    Edit Prediction
                  </>
                ) : (
                  <>
                    <Trophy className="h-4 w-4" />
                    Make Prediction
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Show user's prediction details for completed matches */}
          {isCompleted && userPrediction && (
            <div className="mt-3 pt-3 border-t border-border/30">
              <div className="flex items-center justify-between text-sm">
                <div className="text-muted-foreground">
                  Your prediction: <span className="font-semibold text-foreground">{getPredictionDisplay()}</span>
                </div>
                <Badge 
                  variant={pointsEarned >= 5 ? "default" : pointsEarned > 0 ? "secondary" : "outline"}
                  className={cn(
                    pointsEarned >= 5 && "bg-emerald-500",
                    pointsEarned >= 3 && pointsEarned < 5 && "bg-blue-500",
                    pointsEarned >= 1 && pointsEarned < 3 && "bg-yellow-500"
                  )}
                >
                  +{pointsEarned} pts
                </Badge>
              </div>
              {/* Show points breakdown if available */}
              {pointsBreakdown && pointsEarned > 0 && (
                <div className="mt-1 text-xs text-muted-foreground">
                  {pointsBreakdown.details.exactScore && <span className="text-emerald-500">Exact score! </span>}
                  {pointsBreakdown.details.correctMargin && <span className="text-blue-500">Correct margin </span>}
                  {pointsBreakdown.details.correctResult && <span className="text-yellow-500">Correct result </span>}
                  {pointsBreakdown.details.correctEtResult && <span className="text-purple-500">+ET </span>}
                  {pointsBreakdown.details.correctPenaltyWinner && <span className="text-pink-500">+Pens </span>}
                  {pointsBreakdown.details.correctUltimateWinner && <span className="text-green-500">+Winner </span>}
                </div>
              )}
            </div>
          )}

          {/* Show prediction details for upcoming matches with predictions */}
          {!isCompleted && !isLive && userPrediction && userPrediction.etResult && (
            <div className="mt-2 text-center text-xs text-muted-foreground">
              <span>
                ET: {userPrediction.etResult === 'home' ? homeTeam.name : userPrediction.etResult === 'away' ? awayTeam.name : 'Draw'}
                {userPrediction.penaltyWinner && (
                  <> | Pens: {userPrediction.penaltyWinner === 'home' ? homeTeam.name : awayTeam.name}</>
                )}
              </span>
            </div>
          )}

          {/* Placeholder for other users' predictions (shown after lock) */}
          {isLocked && (
            <div className="mt-3 pt-3 border-t border-border/30">
              <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Users className="h-3.5 w-3.5" />
                <span>View friends&apos; predictions</span>
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Match Predictions</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Predict match scores before kickoff. Predictions lock 5 minutes before each match.
        </p>
        {!isAuthenticated && (
          <div className="mt-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm text-primary">Sign in to make predictions and compete with friends!</p>
          </div>
        )}
      </div>

      {/* Live matches (always shown at top) */}
      {liveMatches.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Radio className="h-4 w-4 text-red-400 animate-pulse" />
            <h2 className="text-lg font-bold text-red-400">Live Now</h2>
          </div>
          <div className="space-y-3">
            {liveMatches.map(m => renderMatchCard(m))}
          </div>
        </section>
      )}

      {/* Tabs for upcoming/completed */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "upcoming" | "completed")}>
        <TabsList className="w-full mb-4">
          <TabsTrigger value="upcoming" className="flex-1 gap-2">
            <Clock className="h-4 w-4" />
            Upcoming ({upcomingMatches.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex-1 gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Completed ({completedMatches.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-3">
          {upcomingMatches.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-8 text-center text-muted-foreground">
                No upcoming matches scheduled
              </CardContent>
            </Card>
          ) : (
            upcomingMatches.map(m => renderMatchCard(m))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-3">
          {completedMatches.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-8 text-center text-muted-foreground">
                No completed matches yet
              </CardContent>
            </Card>
          ) : (
            completedMatches.map(m => renderMatchCard(m))
          )}
        </TabsContent>
      </Tabs>

      {/* Prediction Modal */}
      {selectedMatch && (() => {
        let homeTeam, awayTeam;
        if (selectedMatch.homeTeamId && selectedMatch.awayTeamId) {
          homeTeam = getTeamById(selectedMatch.homeTeamId) || { name: selectedMatch.homeTeamId, flag: '🏳️', id: selectedMatch.homeTeamId };
          awayTeam = getTeamById(selectedMatch.awayTeamId) || { name: selectedMatch.awayTeamId, flag: '🏳️', id: selectedMatch.awayTeamId };
        } else {
          const parts = selectedMatch.id.split('-');
          homeTeam = getTeamById(parts[0]) || { name: parts[0], flag: '🏳️', id: parts[0] };
          awayTeam = getTeamById(parts[1]) || { name: parts[1], flag: '🏳️', id: parts[1] };
        }
        const existingPred = getUserPrediction(selectedMatch.id);
        
        return (
          <PredictionModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onSubmit={handlePredictionSubmit}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            matchDate={selectedMatch.date}
            matchVenue={selectedMatch.venue}
            existingPrediction={existingPred ? {
              homeScore: existingPred.homeScore,
              awayScore: existingPred.awayScore,
              etResult: existingPred.etResult,
              penaltyWinner: existingPred.penaltyWinner,
            } : null}
          />
        );
      })()}
    </div>
  );
}
