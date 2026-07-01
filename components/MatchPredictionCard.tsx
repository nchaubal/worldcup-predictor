"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Match, Prediction } from "@/lib/tournament-data";
import { predictMatch, MatchProbability } from "@/lib/ai-predictor";
import { useTournament } from "@/context/TournamentContext";
import { Brain, ChevronDown, ChevronUp } from "lucide-react";

type Props = {
  match: Match;
};

export default function MatchPredictionCard({ match }: Props) {
  const { setPrediction, predictions } = useTournament();
  const existing = predictions.find((p) => p.matchId === match.id);
  const [homeScore, setHomeScore] = useState(existing?.homeScore ?? 0);
  const [awayScore, setAwayScore] = useState(existing?.awayScore ?? 0);
  const [showAI, setShowAI] = useState(false);
  const [aiPred, setAiPred] = useState<MatchProbability | null>(null);

  useEffect(() => {
    if (match.homeTeam && match.awayTeam) {
      setAiPred(predictMatch(match.homeTeam, match.awayTeam));
    }
  }, [match.homeTeam, match.awayTeam]);

  const handleScore = (side: "home" | "away", value: number) => {
    const clamped = Math.max(0, Math.min(20, value));
    if (side === "home") {
      setHomeScore(clamped);
      setPrediction(match.id, clamped, awayScore);
    } else {
      setAwayScore(clamped);
      setPrediction(match.id, homeScore, clamped);
    }
  };

  const isPredicted = existing !== undefined;
  const homeTeam = match.homeTeam;
  const awayTeam = match.awayTeam;

  if (!homeTeam || !awayTeam) {
    return (
      <Card className="opacity-50">
        <CardContent className="pt-4 pb-4 text-center text-muted-foreground text-sm">
          TBD vs TBD
        </CardContent>
      </Card>
    );
  }

  const confidenceColor = {
    high: "bg-green-500/10 text-green-700 border-green-500/30",
    medium: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30",
    low: "bg-muted text-muted-foreground border-border",
  };

  return (
    <Card className={`transition-all ${isPredicted ? "ring-1 ring-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/10" : ""}`}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <span className="text-3xl">{homeTeam.flag}</span>
            <span className="text-xs font-medium text-center leading-tight">{homeTeam.name}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => handleScore("home", homeScore + 1)}
                className="w-7 h-7 rounded bg-muted hover:bg-muted/80 flex items-center justify-center text-sm font-bold transition-colors"
              >
                +
              </button>
              <span className="w-8 text-center text-xl font-bold tabular-nums">{homeScore}</span>
              <button
                onClick={() => handleScore("home", homeScore - 1)}
                disabled={homeScore === 0}
                className="w-7 h-7 rounded bg-muted hover:bg-muted/80 flex items-center justify-center text-sm font-bold transition-colors disabled:opacity-30"
              >
                −
              </button>
            </div>
            <span className="text-muted-foreground font-bold">:</span>
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => handleScore("away", awayScore + 1)}
                className="w-7 h-7 rounded bg-muted hover:bg-muted/80 flex items-center justify-center text-sm font-bold transition-colors"
              >
                +
              </button>
              <span className="w-8 text-center text-xl font-bold tabular-nums">{awayScore}</span>
              <button
                onClick={() => handleScore("away", awayScore - 1)}
                disabled={awayScore === 0}
                className="w-7 h-7 rounded bg-muted hover:bg-muted/80 flex items-center justify-center text-sm font-bold transition-colors disabled:opacity-30"
              >
                −
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <span className="text-3xl">{awayTeam.flag}</span>
            <span className="text-xs font-medium text-center leading-tight">{awayTeam.name}</span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{match.scheduledDate}</span>
          {isPredicted && (
            <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-700">
              Saved
            </Badge>
          )}
          {aiPred && (
            <button
              onClick={() => setShowAI((v) => !v)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Brain className="h-3 w-3" />
              AI
              {showAI ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          )}
        </div>

        {showAI && aiPred && (
          <div className="mt-3 pt-3 border-t border-border space-y-2">
            <div className="flex gap-1 text-xs">
              <div className="flex-1 text-center">
                <div className="font-medium text-blue-600">{aiPred.homeWin}%</div>
                <div className="text-muted-foreground">{homeTeam.name}</div>
              </div>
              <div className="flex-1 text-center">
                <div className="font-medium text-muted-foreground">{aiPred.draw}%</div>
                <div className="text-muted-foreground">Draw</div>
              </div>
              <div className="flex-1 text-center">
                <div className="font-medium text-orange-600">{aiPred.awayWin}%</div>
                <div className="text-muted-foreground">{awayTeam.name}</div>
              </div>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden">
              <div className="bg-blue-500 transition-all" style={{ width: `${aiPred.homeWin}%` }} />
              <div className="bg-muted transition-all" style={{ width: `${aiPred.draw}%` }} />
              <div className="bg-orange-500 transition-all" style={{ width: `${aiPred.awayWin}%` }} />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>xG: {aiPred.expectedHomeGoals}</span>
              <Badge className={`text-xs border ${confidenceColor[aiPred.confidence]}`}>
                {aiPred.confidence} confidence
              </Badge>
              <span>xG: {aiPred.expectedAwayGoals}</span>
            </div>
            <p className="text-xs text-muted-foreground italic">{aiPred.insight}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
