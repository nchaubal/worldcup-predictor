"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GROUPS, GROUP_STANDINGS, getTeamById } from "@/lib/tournament-data";
import { LayoutGrid, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const THIRD_PLACE_GROUPS = new Set(["B", "D", "E", "F", "I", "J", "K", "L"]);

export default function PredictPage() {
  const [activeGroup, setActiveGroup] = useState("A");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center">
            <LayoutGrid className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Group Stage — Final Standings</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              All 12 groups concluded · 32 teams advanced to Round of 32
            </p>
          </div>
        </div>
        <Link
          href="/bracket"
          className={cn(buttonVariants({ size: "sm" }), "shrink-0 bg-primary text-primary-foreground gap-1.5")}
        >
          Predict Knockouts <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mb-6 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-primary/20 ring-1 ring-primary/40 inline-block" /> Group winner</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-accent/70 inline-block" /> Runner-up</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-accent/30 inline-block" /> Best 3rd (advanced)</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-muted/30 opacity-50 inline-block" /> Eliminated</div>
      </div>

      <Tabs value={activeGroup} onValueChange={setActiveGroup}>
        <TabsList className="flex flex-wrap h-auto gap-1 mb-6 bg-card border border-border/60 p-1 rounded-xl">
          {GROUPS.map((g) => (
            <TabsTrigger key={g} value={g}
              className="rounded-lg text-xs font-semibold px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {g}
            </TabsTrigger>
          ))}
        </TabsList>

        {GROUPS.map((g) => {
          const standings = GROUP_STANDINGS[g];
          const hasBestThird = THIRD_PLACE_GROUPS.has(g);
          return (
            <TabsContent key={g} value={g}>
              <Card className="border-border/60 overflow-hidden">
                <CardHeader className="py-3 px-5 border-b border-border/60 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold">Group {g}</CardTitle>
                    <div className="flex gap-1">
                      {standings.map((s) => {
                        const t = getTeamById(s.teamId)!;
                        return <span key={t.id} className="text-xl" title={t.name}>{t.flag}</span>;
                      })}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Header row */}
                  <div className="grid grid-cols-[auto_1fr_repeat(6,_auto)] gap-x-3 px-5 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wide border-b border-border/40">
                    <span className="w-5">#</span>
                    <span>Team</span>
                    <span className="w-6 text-center">P</span>
                    <span className="w-6 text-center">W</span>
                    <span className="w-6 text-center">D</span>
                    <span className="w-6 text-center">L</span>
                    <span className="w-8 text-center">GD</span>
                    <span className="w-8 text-center font-black">Pts</span>
                  </div>
                  {standings.map((s, idx) => {
                    const team = getTeamById(s.teamId)!;
                    const isWinner   = idx === 0;
                    const isRunner   = idx === 1;
                    const isBest3rd  = idx === 2 && hasBestThird;
                    const isElim     = !isWinner && !isRunner && !isBest3rd;
                    return (
                      <div key={s.teamId}
                        className={cn(
                          "grid grid-cols-[auto_1fr_repeat(6,_auto)] gap-x-3 px-5 py-3 items-center border-b border-border/20 last:border-0 transition-colors",
                          isWinner  && "bg-primary/8",
                          isRunner  && "bg-accent/50",
                          isBest3rd && "bg-accent/25",
                          isElim    && "opacity-40"
                        )}>
                        <span className={cn("w-5 text-xs font-bold text-center", isWinner && "text-primary")}>{idx + 1}</span>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-2xl">{team.flag}</span>
                          <div className="min-w-0">
                            <div className={cn("font-semibold text-sm truncate", isWinner && "text-primary")}>{team.name}</div>
                            <div className="text-[10px] text-muted-foreground">FIFA #{team.fifaRanking}</div>
                          </div>
                          {isWinner  && <Badge className="text-[9px] px-1 py-0 bg-primary/20 text-primary border-primary/30 shrink-0">1st</Badge>}
                          {isRunner  && <Badge variant="secondary" className="text-[9px] px-1 py-0 shrink-0">2nd</Badge>}
                          {isBest3rd && <Badge variant="secondary" className="text-[9px] px-1 py-0 shrink-0">3rd ✓</Badge>}
                          {isElim    && <Badge variant="secondary" className="text-[9px] px-1 py-0 shrink-0 opacity-70">Out</Badge>}
                        </div>
                        <span className="w-6 text-center text-sm text-muted-foreground">{s.played}</span>
                        <span className="w-6 text-center text-sm">{s.won}</span>
                        <span className="w-6 text-center text-sm text-muted-foreground">{s.drawn}</span>
                        <span className="w-6 text-center text-sm text-muted-foreground">{s.lost}</span>
                        <span className={cn("w-8 text-center text-sm", s.gd > 0 && "text-emerald-400", s.gd < 0 && "text-red-400")}>
                          {s.gd > 0 ? "+" : ""}{s.gd}
                        </span>
                        <span className={cn("w-8 text-center font-black text-base", isWinner && "text-primary")}>{s.points}</span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
