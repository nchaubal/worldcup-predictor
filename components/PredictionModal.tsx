"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Trophy, Clock, Target, ChevronRight, ChevronLeft, Check } from "lucide-react";

type Team = {
  id: string;
  name: string;
  flag: string;
};

type PredictionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (prediction: {
    homeScore: number;
    awayScore: number;
    etResult: string;
    penaltyWinner: string;
  }) => void;
  homeTeam: Team;
  awayTeam: Team;
  matchDate: string;
  matchVenue?: string;
  existingPrediction?: {
    homeScore: number;
    awayScore: number;
    etResult?: string | null;
    penaltyWinner?: string | null;
  } | null;
};

export function PredictionModal({
  isOpen,
  onClose,
  onSubmit,
  homeTeam,
  awayTeam,
  matchDate,
  matchVenue,
  existingPrediction,
}: PredictionModalProps) {
  // Current step (1, 2, or 3) - always 3 steps
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: 90-minute score
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  
  // Step 2: ET result (always required)
  const [etResult, setEtResult] = useState<string | null>(null);
  
  // Step 3: Penalty winner (always required)
  const [penaltyWinner, setPenaltyWinner] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (existingPrediction) {
        setHomeScore(existingPrediction.homeScore.toString());
        setAwayScore(existingPrediction.awayScore.toString());
        setEtResult(existingPrediction.etResult || null);
        setPenaltyWinner(existingPrediction.penaltyWinner || null);
        setCurrentStep(1);
      } else {
        setHomeScore("");
        setAwayScore("");
        setEtResult(null);
        setPenaltyWinner(null);
        setCurrentStep(1);
      }
    }
  }, [isOpen, existingPrediction]);

  const homeScoreNum = parseInt(homeScore) || 0;
  const awayScoreNum = parseInt(awayScore) || 0;
  
  // Step validation - all 3 steps always required
  const isStep1Complete = homeScore !== "" && awayScore !== "";
  const isStep2Complete = etResult !== null;
  const isStep3Complete = penaltyWinner !== null;
  
  // Always 3 steps
  const totalSteps = 3;
  const canProceedFromStep1 = isStep1Complete;
  const canProceedFromStep2 = isStep2Complete;
  const canSubmit = isStep1Complete && isStep2Complete && isStep3Complete;

  const handleScoreChange = (team: "home" | "away", value: string) => {
    const numValue = value.replace(/\D/g, "").slice(0, 2);
    if (team === "home") {
      setHomeScore(numValue);
    } else {
      setAwayScore(numValue);
    }
  };

  const handleEtResultChange = (result: string) => {
    setEtResult(result);
  };

  const handleNext = () => {
    if (currentStep === 1 && canProceedFromStep1) {
      setCurrentStep(2);
    } else if (currentStep === 2 && canProceedFromStep2) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    
    onSubmit({
      homeScore: homeScoreNum,
      awayScore: awayScoreNum,
      etResult: etResult!,
      penaltyWinner: penaltyWinner!,
    });
    onClose();
  };

  // Determine the ultimate winner for display
  // Winner is determined by: ET result if not draw, otherwise penalty winner
  const getUltimateWinner = () => {
    if (etResult === "home") return homeTeam.name;
    if (etResult === "away") return awayTeam.name;
    // ET is draw, so penalty winner decides
    if (penaltyWinner === "home") return homeTeam.name;
    if (penaltyWinner === "away") return awayTeam.name;
    return null;
  };

  // Step indicator - always 3 steps
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-4">
      {[1, 2, 3].map((step) => {
        const isActive = currentStep === step;
        const isCompleted = currentStep > step;
        
        return (
          <div key={step} className="flex items-center">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                isActive && "bg-primary text-primary-foreground",
                isCompleted && "bg-primary/20 text-primary",
                !isActive && !isCompleted && "bg-muted text-muted-foreground"
              )}
            >
              {isCompleted ? <Check className="h-4 w-4" /> : step}
            </div>
            {step < 3 && (
              <div className={cn(
                "w-8 h-0.5 mx-1",
                currentStep > step ? "bg-primary/50" : "bg-muted"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Make Prediction
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Match Info */}
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-center gap-4 mb-2">
              <div className="text-center">
                <span className="text-2xl">{homeTeam.flag}</span>
                <p className="text-xs font-semibold mt-1">{homeTeam.name}</p>
              </div>
              <span className="text-muted-foreground font-bold">vs</span>
              <div className="text-center">
                <span className="text-2xl">{awayTeam.flag}</span>
                <p className="text-xs font-semibold mt-1">{awayTeam.name}</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{matchDate}</span>
              {matchVenue && <span>· {matchVenue}</span>}
            </div>
          </div>

          {/* Step Indicator */}
          {renderStepIndicator()}

          {/* Step 1: 90-minute score */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="text-center">
                <Badge variant="secondary" className="mb-2">Step 1 of {totalSteps}</Badge>
                <h3 className="text-lg font-semibold">90-Minute Score</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  What will be the score at full time (90 minutes)?
                </p>
              </div>
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">{homeTeam.name}</p>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={homeScore}
                    onChange={(e) => handleScoreChange("home", e.target.value)}
                    className="w-20 h-16 text-center font-bold text-3xl"
                    placeholder="0"
                    autoFocus
                  />
                </div>
                <span className="text-3xl font-bold text-muted-foreground mt-6">–</span>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">{awayTeam.name}</p>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={awayScore}
                    onChange={(e) => handleScoreChange("away", e.target.value)}
                    className="w-20 h-16 text-center font-bold text-3xl"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Extra Time Result */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <Badge variant="secondary" className="mb-2">Step 2 of {totalSteps}</Badge>
                <h3 className="text-lg font-semibold">Extra Time Result</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  If the match goes to Extra Time, who wins or does it go to penalties?
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2">
                <Button
                  variant={etResult === "home" ? "default" : "outline"}
                  onClick={() => handleEtResultChange("home")}
                  className="flex flex-col h-auto py-4"
                >
                  <span className="text-2xl">{homeTeam.flag}</span>
                  <span className="text-xs mt-2 font-semibold">{homeTeam.name}</span>
                  <span className="text-[10px] text-muted-foreground mt-1">wins in ET</span>
                </Button>
                <Button
                  variant={etResult === "draw" ? "default" : "outline"}
                  onClick={() => handleEtResultChange("draw")}
                  className="flex flex-col h-auto py-4"
                >
                  <span className="text-2xl">⚖️</span>
                  <span className="text-xs mt-2 font-semibold">Still Tied</span>
                  <span className="text-[10px] text-muted-foreground mt-1">→ Penalties</span>
                </Button>
                <Button
                  variant={etResult === "away" ? "default" : "outline"}
                  onClick={() => handleEtResultChange("away")}
                  className="flex flex-col h-auto py-4"
                >
                  <span className="text-2xl">{awayTeam.flag}</span>
                  <span className="text-xs mt-2 font-semibold">{awayTeam.name}</span>
                  <span className="text-[10px] text-muted-foreground mt-1">wins in ET</span>
                </Button>
              </div>
              <p className="text-[10px] text-center text-muted-foreground">
                Your 90-min prediction: {homeTeam.name} {homeScoreNum} – {awayScoreNum} {awayTeam.name}
              </p>
            </div>
          )}

          {/* Step 3: Penalty Winner */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="text-center">
                <Badge variant="secondary" className="mb-2">Step 3 of 3</Badge>
                <h3 className="text-lg font-semibold">Penalty Shootout</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  If it goes to penalties, who wins?
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 py-2">
                <Button
                  variant={penaltyWinner === "home" ? "default" : "outline"}
                  onClick={() => setPenaltyWinner("home")}
                  className="flex flex-col h-auto py-6"
                >
                  <span className="text-3xl">{homeTeam.flag}</span>
                  <span className="text-sm font-semibold mt-2">{homeTeam.name}</span>
                  <span className="text-xs text-muted-foreground mt-1">wins on penalties</span>
                </Button>
                <Button
                  variant={penaltyWinner === "away" ? "default" : "outline"}
                  onClick={() => setPenaltyWinner("away")}
                  className="flex flex-col h-auto py-6"
                >
                  <span className="text-3xl">{awayTeam.flag}</span>
                  <span className="text-sm font-semibold mt-2">{awayTeam.name}</span>
                  <span className="text-xs text-muted-foreground mt-1">wins on penalties</span>
                </Button>
              </div>
              <p className="text-[10px] text-center text-muted-foreground">
                90 mins: {homeScoreNum} – {awayScoreNum} | ET: {etResult === "home" ? homeTeam.name : etResult === "away" ? awayTeam.name : "Draw"}
              </p>
            </div>
          )}

          {/* Summary (shown on step 3 when complete) */}
          {currentStep === 3 && canSubmit && (
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Summary</span>
              </div>
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">90 mins:</span>{" "}
                  <span className="font-semibold">{homeScoreNum} – {awayScoreNum}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Extra Time:</span>{" "}
                  <span className="font-semibold">
                    {etResult === "draw" ? "Still tied" : `${etResult === "home" ? homeTeam.name : awayTeam.name} wins`}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Penalties:</span>{" "}
                  <span className="font-semibold">{penaltyWinner === "home" ? homeTeam.name : awayTeam.name} wins</span>
                </p>
                <p className="pt-1 border-t border-primary/20 mt-2">
                  <span className="text-muted-foreground">Match Winner:</span>{" "}
                  <span className="font-bold text-primary">{getUltimateWinner()}</span>
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-2">
            {currentStep === 1 ? (
              <>
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleNext} 
                  disabled={!canProceedFromStep1} 
                  className="flex-1 gap-2"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            ) : currentStep === 2 ? (
              <>
                <Button variant="outline" onClick={handleBack} className="gap-2">
                  <ChevronLeft className="h-4 w-4" /> Back
                </Button>
                <Button 
                  onClick={handleNext} 
                  disabled={!canProceedFromStep2} 
                  className="flex-1 gap-2"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleBack} className="gap-2">
                  <ChevronLeft className="h-4 w-4" /> Back
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={!canSubmit} 
                  className="flex-1 gap-2"
                >
                  <Check className="h-4 w-4" /> Save Prediction
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
