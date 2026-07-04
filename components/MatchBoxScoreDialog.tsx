"use client";

import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Team } from "@/lib/tournament-data";
import { generateMatchStats } from "@/lib/match-stats";
import { CheckCircle2, Check, XCircle } from "lucide-react";

export type BoxScoreMatch = {
  id: string;
  teamA: Team;
  teamB: Team;
  scoreA: number;
  scoreB: number;
  pens?: string;
  venue?: string;
  date?: string;
};

// Single shared dialog reused for every finished/closed match in the bracket -
// pass whichever match was clicked (or null to keep it closed).
export function MatchBoxScoreDialog({ match, onClose }: { match: BoxScoreMatch | null; onClose: () => void }) {
  const boxScore = useMemo(() => {
    if (!match) return null;
    return generateMatchStats(match.id, match.teamA, match.teamB, match.scoreA, match.scoreB, match.pens);
  }, [match]);

  return (
    <Dialog open={!!match} onOpenChange={(open) => !open && onClose()}>
      {match && boxScore && (
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="relative flex items-center text-xs text-muted-foreground pr-8">
              <span className="shrink-0">{match.venue ?? "FIFA World Cup 2026™"}{match.date ? ` · ${match.date}` : ""}</span>
              <span className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 font-semibold text-emerald-400 whitespace-nowrap">
                <CheckCircle2 className="h-3.5 w-3.5" /> Full-time
              </span>
            </div>
            <DialogTitle className="sr-only">
              {match.teamA.name} vs {match.teamB.name} box score
            </DialogTitle>
          </DialogHeader>

          {/* Score line */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="flex flex-col items-center gap-1.5 text-center">
              <span className="text-3xl">{match.teamA.flag}</span>
              <span className="text-sm font-semibold">{match.teamA.name}</span>
            </div>
            <div className="text-center px-2">
              <div className="text-3xl font-black tabular-nums">{match.scoreA} - {match.scoreB}</div>
              {match.pens && (
                <div className="text-xs text-muted-foreground mt-0.5">Penalties: {match.pens}</div>
              )}
            </div>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <span className="text-3xl">{match.teamB.flag}</span>
              <span className="text-sm font-semibold">{match.teamB.name}</span>
            </div>
          </div>

          {/* Goal scorers */}
          {(boxScore.homeScorers.length > 0 || boxScore.awayScorers.length > 0) && (
            <div className="grid grid-cols-2 gap-4 text-xs border-y border-border/40 py-3">
              <div className="space-y-1">
                {boxScore.homeScorers.map((s, i) => (
                  <div key={i} className="text-muted-foreground">
                    ⚽ {s.name} {s.minute}&apos;{s.ownGoal ? " (OG)" : ""}
                  </div>
                ))}
              </div>
              <div className="space-y-1 text-right">
                {boxScore.awayScorers.map((s, i) => (
                  <div key={i} className="text-muted-foreground">
                    {s.name} {s.minute}&apos;{s.ownGoal ? " (OG)" : ""} ⚽
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="space-y-3">
            {boxScore.stats.map((row) => {
              const total = row.home + row.away;
              const homePct = total > 0 ? (row.home / total) * 100 : 50;
              return (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold tabular-nums w-10 text-left">{row.home}{row.suffix ?? ""}</span>
                    <span className="text-muted-foreground uppercase tracking-wide text-[10px]">{row.label}</span>
                    <span className="font-bold tabular-nums w-10 text-right">{row.away}{row.suffix ?? ""}</span>
                  </div>
                  <div className="flex h-1.5 rounded-full overflow-hidden bg-muted">
                    <div className="bg-primary" style={{ width: `${homePct}%` }} />
                    <div className="bg-blue-500" style={{ width: `${100 - homePct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Penalty shootout */}
          {boxScore.penaltyKicks.length > 0 && (
            <div className="border-t border-border/40 pt-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground text-center mb-2">
                Penalty Shootout · {match.pens}
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                {boxScore.penaltyKicks.map((k, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 text-xs ${
                      k.team === "away" ? "flex-row-reverse text-right" : ""
                    }`}
                  >
                    {k.scored ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                    )}
                    <span className="text-muted-foreground truncate">{k.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      )}
    </Dialog>
  );
}
