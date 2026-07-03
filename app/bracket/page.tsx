"use client";

import React, { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { useTournamentSupabase } from "@/context/TournamentContextSupabase";
import { TEAMS, Team, R32_MATCHES } from "@/lib/tournament-data";
import { syncTournamentWithFootballData } from "@/lib/football-data-sync";
import { predictMatch } from "@/lib/ai-predictor";
import { useFootballData } from "@/hooks/useFootballData";
import { GitBranch, Brain, Trophy, CheckCircle2, Clock, Radio, ZoomIn, Undo, Edit3, X, RefreshCw } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const CW  = 156; // card width px
const GAP = 20;  // connector width px

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type MatchDef = {
  id: string;
  teamAId: string | null;
  teamBId: string | null;
  winnerId?: string | null;
  scoreA?: number;
  scoreB?: number;
  pens?: string;
  status?: "completed" | "live" | "upcoming";
  venue?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Slot — one team row inside a match card (display only, click handled by parent)
// ─────────────────────────────────────────────────────────────────────────────
function Slot({ team, picked, lost, score, isResult }: {
  team: Team | null; picked: boolean; lost: boolean;
  score?: number; isResult?: boolean;
}) {
  if (!team) return (
    <div className="flex items-center gap-2 px-2.5 py-2 text-xs text-muted-foreground/40 italic">TBD</div>
  );
  return (
    <div
      className={[
        "flex items-center gap-2 px-2.5 py-2 w-full text-left transition-all duration-150",
        picked       ? "bg-primary/20 border-l-[3px] border-primary"
          : lost     ? "opacity-25"
          : "",
      ].join(" ")}
    >
      <span className="text-lg leading-none shrink-0">{team.flag}</span>
      <span className={`flex-1 text-xs font-semibold truncate ${picked ? "text-primary" : "text-foreground"}`}>
        {team.name}
      </span>
      {score !== undefined && (
        <span className={`text-sm font-black tabular-nums shrink-0 ${picked ? "text-primary" : "text-muted-foreground"}`}>
          {score}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MatchCard
// ─────────────────────────────────────────────────────────────────────────────
function MatchCard({ matchId, teamA, teamB, winnerId, scoreA, scoreB, pens, status, onScorePick, showAI, venue, predictedScoreA, predictedScoreB }: {
  matchId: string; teamA: Team | null; teamB: Team | null;
  winnerId?: string | null; scoreA?: number; scoreB?: number;
  pens?: string; status?: "completed" | "live" | "upcoming";
  onScorePick?: (teamId: string, homeScore: number, awayScore: number) => void;
  showAI?: boolean; venue?: string;
  predictedScoreA?: number; predictedScoreB?: number;
}) {
  const [aiOpen, setAiOpen] = useState(false);
  const [scoreOpen, setScoreOpen] = useState(false);
  const [tempScoreA, setTempScoreA] = useState(predictedScoreA ?? 0);
  const [tempScoreB, setTempScoreB] = useState(predictedScoreB ?? 0);
  
  const isResult = status === "completed";
  const isLive   = status === "live";
  const pred     = showAI && teamA && teamB ? predictMatch(teamA, teamB) : null;
  const wonA = winnerId === teamA?.id;
  const wonB = winnerId === teamB?.id;
  const hasPredictedScore = predictedScoreA !== undefined && predictedScoreB !== undefined;

  const handleScoreSubmit = () => {
    if (!teamA || !teamB) return;
    const winner = tempScoreA > tempScoreB ? teamA.id : tempScoreB > tempScoreA ? teamB.id : teamA.id; // Default to teamA on draw
    onScorePick?.(winner, tempScoreA, tempScoreB);
    setScoreOpen(false);
  };

  return (
    <div
      className="group relative transition-all duration-200 ease-out hover:scale-[1.12] hover:z-30 hover:shadow-2xl"
      style={{ width: CW }}
    >
      <div className={[
        "rounded-lg border overflow-hidden bg-card transition-all duration-150",
        isLive   ? "border-red-500/60 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
          : isResult ? "border-border/30 opacity-75"
          : winnerId  ? "border-primary/50 shadow-[0_0_8px_rgba(180,140,60,0.18)]"
          : "border-border/50 group-hover:border-primary/50",
      ].join(" ")}>
        {/* Status bar */}
        {(isResult || isLive) ? (
          <div className={`flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold ${
            isLive ? "bg-red-500/20 text-red-400" : "bg-emerald-500/10 text-emerald-400"
          }`}>
            {isLive ? <Radio className="h-2.5 w-2.5 animate-pulse" /> : <CheckCircle2 className="h-2.5 w-2.5" />}
            <span>{isLive ? "LIVE" : "FT"}</span>
            {pens && <span className="ml-auto font-normal">({pens}p)</span>}
          </div>
        ) : (
          <div className="flex items-center gap-1 px-2.5 py-0.5 text-[10px] text-muted-foreground border-b border-border/20">
            <Clock className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">{venue ?? "Pick winner"}</span>
            {hasPredictedScore && (
              <span className="ml-auto text-primary font-medium">{predictedScoreA}-{predictedScoreB}</span>
            )}
          </div>
        )}
        {/* Teams - clicking opens score picker instead of directly selecting winner */}
        <div 
          className={`divide-y divide-border/25 ${!isResult && !isLive && teamA && teamB ? 'cursor-pointer' : ''}`}
          onClick={!isResult && !isLive && teamA && teamB ? () => { setScoreOpen(true); setAiOpen(false); setTempScoreA(predictedScoreA ?? 0); setTempScoreB(predictedScoreB ?? 0); } : undefined}
        >
          <Slot team={teamA} picked={wonA} lost={isResult && !wonA && !!teamA}
            score={scoreA} isResult={isResult || isLive} />
          <Slot team={teamB} picked={wonB} lost={isResult && !wonB && !!teamB}
            score={scoreB} isResult={isResult || isLive} />
        </div>
        {/* Action buttons */}
        {!isResult && !isLive && teamA && teamB && (
          <div className="flex border-t border-border/20 divide-x divide-border/20">
            {pred && (
              <button onClick={() => { setAiOpen(v => !v); setScoreOpen(false); }}
                className="flex-1 flex items-center justify-center gap-1 py-1 text-[10px] text-primary/60 hover:text-primary transition-colors">
                <Brain className="h-2.5 w-2.5" /> AI
              </button>
            )}
            <button onClick={() => { setScoreOpen(v => !v); setAiOpen(false); setTempScoreA(predictedScoreA ?? 0); setTempScoreB(predictedScoreB ?? 0); }}
              className="flex-1 flex items-center justify-center gap-1 py-1 text-[10px] text-emerald-500/70 hover:text-emerald-500 transition-colors">
              <Edit3 className="h-2.5 w-2.5" /> Predict
            </button>
          </div>
        )}
      </div>
      {/* Score prediction popover */}
      {scoreOpen && teamA && teamB && (
        <>
          {/* Backdrop to close on click outside */}
          <div className="fixed inset-0 z-40" onClick={() => setScoreOpen(false)} />
          <div 
            className="absolute left-full top-0 ml-2 z-50 w-44 rounded-xl border border-emerald-500/25 bg-card p-3 shadow-2xl text-xs space-y-2"
            onKeyDown={(e) => e.key === 'Escape' && setScoreOpen(false)}
          >
            <div className="flex items-center justify-between">
              <div className="font-bold text-emerald-500 flex items-center gap-1"><Edit3 className="h-3 w-3" /> Predict Score</div>
              <button 
                onClick={() => setScoreOpen(false)} 
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{teamA.flag}</span>
                <span className="flex-1 truncate text-xs">{teamA.name}</span>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={tempScoreA}
                  onChange={(e) => setTempScoreA(Math.max(0, Math.min(20, parseInt(e.target.value) || 0)))}
                  className="w-10 h-6 text-center text-sm font-bold rounded border border-border bg-background"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">{teamB.flag}</span>
                <span className="flex-1 truncate text-xs">{teamB.name}</span>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={tempScoreB}
                  onChange={(e) => setTempScoreB(Math.max(0, Math.min(20, parseInt(e.target.value) || 0)))}
                  className="w-10 h-6 text-center text-sm font-bold rounded border border-border bg-background"
                />
              </div>
            </div>
            <button
              onClick={handleScoreSubmit}
              className="w-full py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 transition-colors"
            >
              Save Prediction
            </button>
            <p className="text-muted-foreground text-[10px] text-center">+5 pts for exact score!</p>
          </div>
        </>
      )}
      {/* AI popover */}
      {aiOpen && pred && (
        <div className="absolute left-full top-0 ml-2 z-50 w-48 rounded-xl border border-primary/25 bg-card p-3 shadow-2xl text-xs space-y-2">
          <div className="font-bold text-primary flex items-center gap-1"><Brain className="h-3 w-3" /> AI Prediction</div>
          {([
            { label: teamA?.name, pct: pred.homeWin, cls: "text-primary" },
            { label: "Draw/ET",   pct: pred.draw,    cls: "text-muted-foreground" },
            { label: teamB?.name, pct: pred.awayWin, cls: "text-blue-400" },
          ] as const).map(r => (
            <div key={r.label} className="flex items-center gap-1">
              <span className="flex-1 truncate text-foreground/80">{r.label}</span>
              <span className={`font-black w-8 text-right ${r.cls}`}>{r.pct}%</span>
            </div>
          ))}
          <div className="flex h-1.5 rounded-full overflow-hidden">
            <div className="bg-primary" style={{ width: `${pred.homeWin}%` }} />
            <div className="bg-muted"   style={{ width: `${pred.draw}%` }} />
            <div className="bg-blue-500" style={{ width: `${pred.awayWin}%` }} />
          </div>
          <p className="text-muted-foreground italic text-[10px] leading-snug">{pred.insight}</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Connector — lines between rounds
// ─────────────────────────────────────────────────────────────────────────────
function Connector({ pairs, flip }: { pairs: number; flip?: boolean }) {
  return (
    <div className="flex flex-col justify-around self-stretch shrink-0" style={{ width: GAP }}>
      {Array.from({ length: pairs }).map((_, i) => (
        <div key={i} className="flex-1 flex flex-col min-h-0">
          {flip ? (
            <>
              <div className="flex-1 border-l-2 border-t-2 border-border/35 rounded-tl" />
              <div className="flex-1 border-l-2 border-b-2 border-border/35 rounded-bl" />
            </>
          ) : (
            <>
              <div className="flex-1 border-r-2 border-t-2 border-border/35 rounded-tr" />
              <div className="flex-1 border-r-2 border-b-2 border-border/35 rounded-br" />
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SFConnector — QF to SF connector (2 matches merge into 1)
// ─────────────────────────────────────────────────────────────────────────────
function SFConnector({ flip }: { flip?: boolean }) {
  return (
    <div className="flex flex-col justify-center self-stretch shrink-0" style={{ width: GAP }}>
      <div className="flex-1 flex flex-col min-h-0">
        {flip ? (
          <>
            <div className="flex-1 border-l-2 border-t-2 border-border/35 rounded-tl" />
            <div className="flex-1 border-l-2 border-b-2 border-border/35 rounded-bl" />
          </>
        ) : (
          <>
            <div className="flex-1 border-r-2 border-t-2 border-border/35 rounded-tr" />
            <div className="flex-1 border-r-2 border-b-2 border-border/35 rounded-br" />
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FinalConnector — SF to Final connector (single line to center)
// ─────────────────────────────────────────────────────────────────────────────
function FinalConnector({ flip: _flip }: { flip?: boolean }) {
  return (
    <div className="flex flex-col justify-center self-stretch shrink-0" style={{ width: GAP }}>
      <div className="h-0.5 bg-border/35" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Column — a list of match cards, vertically spaced
// ─────────────────────────────────────────────────────────────────────────────
function Col({ matches, picks, scores, onScorePick, showAI }: {
  matches: MatchDef[]; picks: Record<string, string>;
  scores: Record<string, { home: number; away: number }>;
  onScorePick: (id: string, tid: string, homeScore: number, awayScore: number) => void;
  showAI?: boolean;
}) {
  const getT = (id: string | null | undefined): Team | null =>
    id ? (TEAMS.find(t => t.id === id) ?? null) : null;
  return (
    <div className="flex flex-col justify-around flex-1 gap-3 shrink-0" style={{ width: CW }}>
      {matches.map(m => (
        <MatchCard
          key={m.id}
          matchId={m.id}
          teamA={getT(m.teamAId)}
          teamB={getT(m.teamBId)}
          winnerId={m.winnerId ?? picks[m.id] ?? null}
          scoreA={m.scoreA} scoreB={m.scoreB} pens={m.pens}
          status={m.status} venue={m.venue}
          onScorePick={(tid, homeScore, awayScore) => onScorePick(m.id, tid, homeScore, awayScore)}
          predictedScoreA={scores[m.id]?.home}
          predictedScoreB={scores[m.id]?.away}
          showAI={showAI && !m.winnerId}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function BracketPage() {
  const { setKnockoutPrediction, knockoutPredictions, knockoutScores } = useTournamentSupabase();
  const { matches: footballMatches, fetchWorldCupMatches, loading: dataLoading } = useFootballData();
  const [picks, setPicks]         = useState<Record<string, string>>({});
  const [scores, setScores]       = useState<Record<string, { home: number; away: number }>>({});
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Fetch ALL World Cup matches so the bracket syncs across all rounds
  useEffect(() => {
    fetchWorldCupMatches();
  }, [fetchWorldCupMatches]);

  // Auto-refresh every 60 seconds to catch live match updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchWorldCupMatches();
      setLastRefresh(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchWorldCupMatches]);

  const handleRefresh = () => {
    fetchWorldCupMatches();
    setLastRefresh(new Date());
  };

  // knockoutPredictions loads asynchronously from Supabase after auth
  // resolves, so seed local picks once they arrive (e.g. on page reload).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPicks((prev) => ({ ...knockoutPredictions, ...prev }));
  }, [knockoutPredictions]);
  
  // Sync knockout scores from Supabase
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setScores((prev) => ({ ...knockoutScores, ...prev }));
  }, [knockoutScores]);
  
  const [history, setHistory]     = useState<Record<string, string>[]>([]);
  const [scale, setScale]           = useState(1);
  const [bracketH, setBracketH]     = useState(0);
  const outerRef   = useRef<HTMLDivElement>(null);
  const bracketRef = useRef<HTMLDivElement>(null);

  const BRACKET_W = CW * 9 + GAP * 8;
  const MIN_SCALE = 0.55; // Don't scale below this - use scrolling instead

  useEffect(() => {
    const recalc = () => {
      const avail = (outerRef.current?.clientWidth ?? window.innerWidth) - 48;
      // On mobile, use a minimum scale and allow horizontal scrolling
      const s = Math.max(MIN_SCALE, Math.min(1, avail / BRACKET_W));
      setScale(s);
      if (bracketRef.current) setBracketH(bracketRef.current.offsetHeight * s);
    };

    recalc();
    window.addEventListener("resize", recalc);

    const ro = new ResizeObserver(recalc);
    if (bracketRef.current) ro.observe(bracketRef.current);

    return () => {
      window.removeEventListener("resize", recalc);
      ro.disconnect();
    };
  }, [BRACKET_W]);

  const handleScorePick = (id: string, tid: string, homeScore: number, awayScore: number) => {
    setHistory(prev => [...prev, picks]);
    setPicks(prev => ({ ...prev, [id]: tid }));
    setScores(prev => ({ ...prev, [id]: { home: homeScore, away: awayScore } }));
    setKnockoutPrediction(id, tid, homeScore, awayScore);
  };

  const handleUndo = () => {
    if (history.length > 0) {
      const previousState = history[history.length - 1];
      setPicks(previousState);
      setHistory(prev => prev.slice(0, -1));
      
      // Update knockout predictions for all changed picks
      Object.keys(previousState).forEach(matchId => {
        setKnockoutPrediction(matchId, previousState[matchId]);
      });
    }
  };

  // ── Build match data ──────────────────────────────────────────────────────

  // R32 winner helper with dynamic sync
  const r32W = (matchId: string): string | null => {
    const syncedTournament = syncTournamentWithFootballData(footballMatches);
    const syncedMatch = syncedTournament.r32.find(m => m.id === matchId);
    return syncedMatch?.winner ?? picks[matchId] ?? null;
  };

  // R32 → MatchDef lookup by id with dynamic sync
  const r32ById = (id: string): MatchDef => {
    const syncedTournament = syncTournamentWithFootballData(footballMatches);
    const syncedMatch = syncedTournament.r32.find(m => m.id === id);
    
    if (!syncedMatch) {
      // Fallback to original data if sync fails
      const m = R32_MATCHES.find(x => x.id === id)!;
      return { 
        id: m.id, 
        teamAId: m.homeTeamId, 
        teamBId: m.awayTeamId,
        winnerId: m.winner ?? null, 
        scoreA: m.homeScore, 
        scoreB: m.awayScore,
        pens: m.pens, 
        status: m.status, 
        venue: m.venue 
      };
    }
    
    return { 
      id: syncedMatch.id, 
      teamAId: syncedMatch.homeTeamId, 
      teamBId: syncedMatch.awayTeamId,
      winnerId: syncedMatch.winner ?? null, 
      scoreA: syncedMatch.homeScore, 
      scoreB: syncedMatch.awayScore,
      pens: syncedMatch.pens, 
      status: syncedMatch.status, 
      venue: syncedMatch.venue 
    };
  };

  // ── Correct R16 source pairs (from R16_MATCHES data):
  //   r16_1  Canada vs Morocco        → winner of r32_1 (can) vs winner of r32_3 (mar)
  //   r16_2  Paraguay vs France       → winner of r32_2 (par) vs winner of r32_5 (fra)
  //   r16_3  Brazil vs Norway         → winner of r32_4 (bra) vs winner of r32_6 (nor)
  //   r16_4  Mex/Ecu vs Eng/Congo     → winner of r32_7      vs winner of r32_8
  //   r16_5  Por/Cro vs Esp/Aut       → winner of r32_12     vs winner of r32_11
  //   r16_6  USA/Bos vs Bel/Sen       → winner of r32_10     vs winner of r32_9
  //   r16_7  Arg/CPV vs Aus/Egy       → winner of r32_15     vs winner of r32_14
  //   r16_8  Sui/Alg vs Col/Gha       → winner of r32_13     vs winner of r32_16

  // Each entry: [r16Id, r32A, r32B]
  const R16_SOURCES: [string, string, string][] = [
    ["r16_1", "r32_1",  "r32_3" ],
    ["r16_2", "r32_2",  "r32_5" ],
    ["r16_3", "r32_4",  "r32_6" ],
    ["r16_4", "r32_7",  "r32_8" ],
    ["r16_5", "r32_12", "r32_11"],
    ["r16_6", "r32_10", "r32_9" ],
    ["r16_7", "r32_15", "r32_14"],
    ["r16_8", "r32_13", "r32_16"],
  ];

  const r16: MatchDef[] = R16_SOURCES.map(([id, a, b]) => ({
    id, teamAId: r32W(a), teamBId: r32W(b), winnerId: picks[id] ?? null,
  }));

  // QF pairings based on official bracket:
  // First half:
  //   qf_1: r16_1 vs r16_2 (Canada/Morocco vs France/Paraguay)
  //   qf_2: r16_6 vs r16_5 (USA/Belgium vs Portugal/Spain)
  // Second half:
  //   qf_3: r16_3 vs r16_4 (Brazil/Norway vs Mexico/England)
  //   qf_4: r16_8 vs r16_7 (Switzerland/Colombia vs Argentina/Australia)
  const qf: MatchDef[] = [
    { id: "qf_1", teamAId: picks["r16_1"] ?? null, teamBId: picks["r16_2"] ?? null, winnerId: picks["qf_1"] ?? null },
    { id: "qf_2", teamAId: picks["r16_6"] ?? null, teamBId: picks["r16_5"] ?? null, winnerId: picks["qf_2"] ?? null },
    { id: "qf_3", teamAId: picks["r16_3"] ?? null, teamBId: picks["r16_4"] ?? null, winnerId: picks["qf_3"] ?? null },
    { id: "qf_4", teamAId: picks["r16_8"] ?? null, teamBId: picks["r16_7"] ?? null, winnerId: picks["qf_4"] ?? null },
  ];

  // SF pairings:
  //   sf_1: qf_1 vs qf_2 (First half: France/Spain potential)
  //   sf_2: qf_3 vs qf_4 (Second half: Brazil/Argentina potential)
  const sf: MatchDef[] = [
    { id: "sf_1", teamAId: picks["qf_1"] ?? null, teamBId: picks["qf_2"] ?? null, winnerId: picks["sf_1"] ?? null },
    { id: "sf_2", teamAId: picks["qf_3"] ?? null, teamBId: picks["qf_4"] ?? null, winnerId: picks["sf_2"] ?? null },
  ];

  // Final
  const finalMatch: MatchDef = {
    id: "final",
    teamAId: picks["sf_1"] ?? null,
    teamBId: picks["sf_2"] ?? null,
    winnerId: picks["final"] ?? null,
    venue: "MetLife Stadium",
  };

  const champion    = picks["final"] ? TEAMS.find(t => t.id === picks["final"]) : null;
  const pickedCount = Object.keys(picks).length;

  // R32 display order: reordered so each consecutive pair feeds its R16 match,
  // keeping connectors visually correct.
  //
  // Left half (SF1 - France/Spain potential):
  //   r16_1: r32_1 vs r32_3 (Canada vs Morocco) → qf_1
  //   r16_2: r32_2 vs r32_5 (France vs Paraguay) → qf_1
  //   r16_6: r32_10 vs r32_9 (USA vs Belgium) → qf_2
  //   r16_5: r32_12 vs r32_11 (Portugal vs Spain) → qf_2
  //
  // Right half (SF2 - Brazil/Argentina potential):
  //   r16_3: r32_4 vs r32_6 (Brazil vs Norway) → qf_3
  //   r16_4: r32_7 vs r32_8 (Mexico vs England) → qf_3
  //   r16_8: r32_13 vs r32_16 (Switzerland vs Colombia) → qf_4
  //   r16_7: r32_15 vs r32_14 (Argentina vs Australia) → qf_4
  const leftR32  = ["r32_1","r32_3","r32_2","r32_5","r32_10","r32_9","r32_12","r32_11"].map(r32ById);
  const rightR32 = ["r32_4","r32_6","r32_7","r32_8","r32_13","r32_16","r32_15","r32_14"].map(r32ById);
  
  // R16 matches reordered to match visual layout
  const leftR16  = [r16[0], r16[1], r16[5], r16[4]]; // r16_1, r16_2, r16_6, r16_5
  const rightR16 = [r16[2], r16[3], r16[7], r16[6]]; // r16_3, r16_4, r16_8, r16_7
  const leftQF   = [qf[0], qf[1]];  // qf_1, qf_2 (France/Spain side)
  const rightQF  = [qf[2], qf[3]];  // qf_3, qf_4 (Brazil/Argentina side)

  // Bracket columns left→right:
  // [R32-L] [R16-L] [QF-L] [SF-L] [FINAL] [SF-R] [QF-R] [R16-R] [R32-R]
  // Round label positions (centred over their column index)
  // col 0=R32-L, 1=R16-L, 2=QF-L, 3=SF-L, 4=FINAL, 5=SF-R, 6=QF-R, 7=R16-R, 8=R32-R
  const roundLabels = [
    { label: "Round of 32", col: 0 },
    { label: "Round of 16", col: 1 },
    { label: "Quarter-Final", col: 2 },
    { label: "Semi-Final", col: 3 },
    { label: "🏆 Final", col: 4 },
    { label: "Semi-Final", col: 5 },
    { label: "Quarter-Final", col: 6 },
    { label: "Round of 16", col: 7 },
    { label: "Round of 32", col: 8 },
  ];

  return (
    <div className="px-4 py-4 sm:px-6 lg:px-8 min-h-screen" ref={outerRef}>

      {/* Header */}
      <div className="mx-auto max-w-7xl mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center shrink-0">
            <GitBranch className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Knockout Bracket</h1>
            <p className="text-muted-foreground text-xs mt-0.5">Click any team to pick · undo last prediction · hover to magnify</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRefresh}
            disabled={dataLoading}
            className="flex items-center gap-1.5 bg-muted/50 hover:bg-muted/70 border border-border/50 rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            title={`Refresh live data (last: ${lastRefresh.toLocaleTimeString()})`}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${dataLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {history.length > 0 && (
            <button
              onClick={handleUndo}
              className="flex items-center gap-1.5 bg-muted/50 hover:bg-muted/70 border border-border/50 rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              title="Undo last prediction"
            >
              <Undo className="h-3.5 w-3.5" />
              Undo
            </button>
          )}
          {pickedCount > 0 && <Badge variant="secondary" className="text-xs">{pickedCount} picks</Badge>}
          {champion && (
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-xl px-3 py-1.5">
              <Trophy className="h-4 w-4 text-primary shrink-0" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Champion</span>
              <span className="font-black text-sm ml-1">{champion.flag} {champion.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mx-auto max-w-7xl mb-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-400" /> Confirmed</span>
        <span className="flex items-center gap-1"><Radio className="h-3 w-3 text-red-400 animate-pulse" /> Live</span>
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Tap to predict</span>
        <span className="hidden sm:flex items-center gap-1"><ZoomIn className="h-3 w-3 text-primary/60" /> Hover to magnify</span>
        <span className="flex items-center gap-1"><Brain className="h-3 w-3 text-primary/70" /> AI odds on pending</span>
        <span className="flex sm:hidden items-center gap-1 text-primary">← Swipe to scroll →</span>
      </div>

      {/*
        Scale wrapper: the bracket renders at its natural pixel width,
        then CSS transform shrinks it to fit. On mobile, we allow horizontal
        scrolling to keep the bracket readable.
      */}
      <div className="overflow-x-auto sm:overflow-visible pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 flex justify-center">
        <div style={{ height: bracketH || undefined, width: BRACKET_W * scale, minWidth: BRACKET_W * MIN_SCALE }} className="overflow-visible">
        <div
          ref={bracketRef}
          style={{
            width: BRACKET_W,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {/* ── Round labels row — absolutely positioned over each column ── */}
          <div className="relative mb-3" style={{ width: BRACKET_W, height: 18 }}>
            {roundLabels.map(({ label, col }) => (
              <div
                key={label + col}
                className="absolute text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap overflow-hidden"
                style={{
                  left: col * (CW + GAP),
                  width: CW,
                }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* ── Bracket body ───────────────────────────────────── */}
          <div className="flex items-stretch" style={{ width: BRACKET_W }}>

            {/* Left R32 */}
            <Col matches={leftR32} picks={picks} scores={scores} onScorePick={handleScorePick} showAI />
            <Connector pairs={4} />

            {/* Left R16 */}
            <Col matches={leftR16} picks={picks} scores={scores} onScorePick={handleScorePick} showAI />
            <Connector pairs={2} />

            {/* Left QF */}
            <Col matches={leftQF} picks={picks} scores={scores} onScorePick={handleScorePick} showAI />
            {/* QF→SF connector: 2 QF matches merge into 1 SF */}
            <SFConnector flip={false} />

            {/* Left SF */}
            <div className="flex flex-col justify-center shrink-0" style={{ width: CW }}>
              <MatchCard
                matchId="sf_1"
                teamA={TEAMS.find(t => t.id === sf[0].teamAId) ?? null}
                teamB={TEAMS.find(t => t.id === sf[0].teamBId) ?? null}
                winnerId={sf[0].winnerId ?? picks["sf_1"] ?? null}
                onScorePick={(tid, homeScore, awayScore) => handleScorePick("sf_1", tid, homeScore, awayScore)}
                predictedScoreA={scores["sf_1"]?.home}
                predictedScoreB={scores["sf_1"]?.away}
                showAI
              />
            </div>
            {/* SF→Final connector */}
            <FinalConnector flip={false} />

            {/* Final + champion */}
            <div className="flex flex-col items-center justify-center shrink-0" style={{ width: CW }}>
              <MatchCard
                matchId="final"
                teamA={TEAMS.find(t => t.id === finalMatch.teamAId) ?? null}
                teamB={TEAMS.find(t => t.id === finalMatch.teamBId) ?? null}
                winnerId={finalMatch.winnerId}
                venue="MetLife"
                onScorePick={(tid, homeScore, awayScore) => handleScorePick("final", tid, homeScore, awayScore)}
                predictedScoreA={scores["final"]?.home}
                predictedScoreB={scores["final"]?.away}
                showAI
              />
              {champion && (
                <div className="mt-3 text-center">
                  <div className="text-2xl">{champion.flag}</div>
                  <div className="font-black text-xs text-primary mt-0.5">{champion.name}</div>
                  <div className="text-[9px] text-muted-foreground uppercase tracking-widest">Champions</div>
                </div>
              )}
            </div>

            {/* Right connectors mirror left, converging back into the Final */}
            <FinalConnector flip />
            {/* Right SF */}
            <div className="flex flex-col justify-center shrink-0" style={{ width: CW }}>
              <MatchCard
                matchId="sf_2"
                teamA={TEAMS.find(t => t.id === sf[1].teamAId) ?? null}
                teamB={TEAMS.find(t => t.id === sf[1].teamBId) ?? null}
                winnerId={sf[1].winnerId ?? picks["sf_2"] ?? null}
                onScorePick={(tid, homeScore, awayScore) => handleScorePick("sf_2", tid, homeScore, awayScore)}
                predictedScoreA={scores["sf_2"]?.home}
                predictedScoreB={scores["sf_2"]?.away}
                showAI
              />
            </div>
            <SFConnector flip />

            <Col matches={rightQF} picks={picks} scores={scores} onScorePick={handleScorePick} showAI />
            <Connector pairs={2} flip />

            <Col matches={rightR16} picks={picks} scores={scores} onScorePick={handleScorePick} showAI />
            <Connector pairs={4} flip />

            <Col matches={rightR32} picks={picks} scores={scores} onScorePick={handleScorePick} showAI />

          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
