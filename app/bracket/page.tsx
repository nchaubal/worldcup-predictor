"use client";

import React, { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { useTournamentSupabase } from "@/context/TournamentContextSupabase";
import { TEAMS, Team, R32_MATCHES } from "@/lib/tournament-data";
import { syncTournamentWithFootballData } from "@/lib/football-data-sync";
import { predictMatch } from "@/lib/ai-predictor";
import { useFootballData } from "@/hooks/useFootballData";
import { GitBranch, Brain, Trophy, CheckCircle2, Clock, Radio, ZoomIn, Undo } from "lucide-react";

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
// Slot — one team row inside a match card
// ─────────────────────────────────────────────────────────────────────────────
function Slot({ team, picked, lost, score, onClick, isResult }: {
  team: Team | null; picked: boolean; lost: boolean;
  score?: number; onClick?: () => void; isResult?: boolean;
}) {
  if (!team) return (
    <div className="flex items-center gap-2 px-2.5 py-2 text-xs text-muted-foreground/40 italic">TBD</div>
  );
  return (
    <button
      onClick={onClick}
      disabled={isResult || !onClick}
      className={[
        "flex items-center gap-2 px-2.5 py-2 w-full text-left transition-all duration-150",
        picked       ? "bg-primary/20 border-l-[3px] border-primary"
          : lost     ? "opacity-25"
          : !isResult ? "hover:bg-accent/70 cursor-pointer"
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
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MatchCard
// ─────────────────────────────────────────────────────────────────────────────
function MatchCard({ matchId, teamA, teamB, winnerId, scoreA, scoreB, pens, status, onPick, showAI, venue }: {
  matchId: string; teamA: Team | null; teamB: Team | null;
  winnerId?: string | null; scoreA?: number; scoreB?: number;
  pens?: string; status?: "completed" | "live" | "upcoming";
  onPick?: (teamId: string) => void; showAI?: boolean; venue?: string;
}) {
  const [aiOpen, setAiOpen] = useState(false);
  const isResult = status === "completed";
  const isLive   = status === "live";
  const pred     = showAI && teamA && teamB ? predictMatch(teamA, teamB) : null;
  const wonA = winnerId === teamA?.id;
  const wonB = winnerId === teamB?.id;

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
          </div>
        )}
        {/* Teams */}
        <div className="divide-y divide-border/25">
          <Slot team={teamA} picked={wonA} lost={isResult && !wonA && !!teamA}
            score={scoreA} isResult={isResult || isLive}
            onClick={!isResult && !isLive && teamA ? () => onPick?.(teamA.id) : undefined} />
          <Slot team={teamB} picked={wonB} lost={isResult && !wonB && !!teamB}
            score={scoreB} isResult={isResult || isLive}
            onClick={!isResult && !isLive && teamB ? () => onPick?.(teamB.id) : undefined} />
        </div>
        {/* AI toggle */}
        {pred && !isResult && (
          <button onClick={() => setAiOpen(v => !v)}
            className="w-full flex items-center justify-center gap-1 py-1 text-[10px] text-primary/60 hover:text-primary border-t border-border/20 transition-colors">
            <Brain className="h-2.5 w-2.5" /> AI odds
          </button>
        )}
      </div>
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
// Column — a list of match cards, vertically spaced
// ─────────────────────────────────────────────────────────────────────────────
function Col({ matches, picks, onPick, showAI }: {
  matches: MatchDef[]; picks: Record<string, string>;
  onPick: (id: string, tid: string) => void; showAI?: boolean;
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
          onPick={tid => onPick(m.id, tid)}
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
  const { setKnockoutPrediction, knockoutPredictions } = useTournamentSupabase();
  const { matches: footballMatches, fetchWorldCupMatches } = useFootballData();
  const [picks, setPicks]         = useState<Record<string, string>>({});

  // Fetch ALL World Cup matches so the bracket syncs across all rounds
  useEffect(() => {
    fetchWorldCupMatches();
  }, [fetchWorldCupMatches]);

  // knockoutPredictions loads asynchronously from Supabase after auth
  // resolves, so seed local picks once they arrive (e.g. on page reload).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPicks((prev) => ({ ...knockoutPredictions, ...prev }));
  }, [knockoutPredictions]);
  const [history, setHistory]     = useState<Record<string, string>[]>([]);
  const [scale, setScale]           = useState(1);
  const [bracketH, setBracketH]     = useState(0);
  const outerRef   = useRef<HTMLDivElement>(null);
  const bracketRef = useRef<HTMLDivElement>(null);

  const BRACKET_W = CW * 9 + GAP * 8;

  useEffect(() => {
    const recalc = () => {
      const avail = (outerRef.current?.clientWidth ?? window.innerWidth) - 48;
      const s = Math.min(1, avail / BRACKET_W);
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

  const handlePick = (id: string, tid: string) => {
    setHistory(prev => [...prev, picks]);
    setPicks(prev => ({ ...prev, [id]: tid }));
    setKnockoutPrediction(id, tid);
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

  // QF: r16_1+r16_2 → qf_1, r16_3+r16_4 → qf_2, r16_5+r16_6 → qf_3, r16_7+r16_8 → qf_4
  const qf: MatchDef[] = [
    { id: "qf_1", teamAId: picks["r16_1"] ?? null, teamBId: picks["r16_2"] ?? null, winnerId: picks["qf_1"] ?? null },
    { id: "qf_2", teamAId: picks["r16_3"] ?? null, teamBId: picks["r16_4"] ?? null, winnerId: picks["qf_2"] ?? null },
    { id: "qf_3", teamAId: picks["r16_5"] ?? null, teamBId: picks["r16_6"] ?? null, winnerId: picks["qf_3"] ?? null },
    { id: "qf_4", teamAId: picks["r16_7"] ?? null, teamBId: picks["r16_8"] ?? null, winnerId: picks["qf_4"] ?? null },
  ];

  // SF: qf_1+qf_2 → sf_1, qf_3+qf_4 → sf_2
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
  // Left half feeds r16_1..4:  [r32_1,r32_3], [r32_2,r32_5], [r32_4,r32_6], [r32_7,r32_8]
  // Right half feeds r16_5..8: [r32_12,r32_11], [r32_10,r32_9], [r32_15,r32_14], [r32_13,r32_16]
  const leftR32  = ["r32_1","r32_3","r32_2","r32_5","r32_4","r32_6","r32_7","r32_8"].map(r32ById);
  const rightR32 = ["r32_12","r32_11","r32_10","r32_9","r32_15","r32_14","r32_13","r32_16"].map(r32ById);
  const leftR16  = r16.slice(0, 4);
  const rightR16 = r16.slice(4, 8);
  const leftQF   = qf.slice(0, 2);
  const rightQF  = qf.slice(2, 4);

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
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 min-h-screen" ref={outerRef}>

      {/* Header */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
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
      <div className="mb-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-400" /> Confirmed</span>
        <span className="flex items-center gap-1"><Radio className="h-3 w-3 text-red-400 animate-pulse" /> Live</span>
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Click to predict</span>
        <span className="flex items-center gap-1"><ZoomIn className="h-3 w-3 text-primary/60" /> Hover to magnify</span>
        <span className="flex items-center gap-1"><Brain className="h-3 w-3 text-primary/70" /> AI odds on pending</span>
      </div>

      {/*
        Scale wrapper: the bracket renders at its natural pixel width,
        then CSS transform shrinks it to fit. We set the outer height
        to the post-scale height so the page flow collapses correctly.
      */}
      <div style={{ height: bracketH || undefined }} className="overflow-hidden">
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
            <Col matches={leftR32} picks={picks} onPick={handlePick} showAI />
            <Connector pairs={4} />

            {/* Left R16 */}
            <Col matches={leftR16} picks={picks} onPick={handlePick} showAI />
            <Connector pairs={2} />

            {/* Left QF */}
            <Col matches={leftQF} picks={picks} onPick={handlePick} showAI />
            <Connector pairs={1} />

            {/* Left SF */}
            <Col matches={[sf[0]]} picks={picks} onPick={handlePick} showAI />
            <Connector pairs={1} />

            {/* Final + champion */}
            <div className="flex flex-col items-center justify-center shrink-0" style={{ width: CW }}>
              <MatchCard
                matchId="final"
                teamA={TEAMS.find(t => t.id === finalMatch.teamAId) ?? null}
                teamB={TEAMS.find(t => t.id === finalMatch.teamBId) ?? null}
                winnerId={finalMatch.winnerId}
                venue="MetLife"
                onPick={tid => handlePick("final", tid)}
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
            <Connector pairs={1} flip />
            <Col matches={[sf[1]]} picks={picks} onPick={handlePick} showAI />
            <Connector pairs={1} flip />

            <Col matches={rightQF} picks={picks} onPick={handlePick} showAI />
            <Connector pairs={2} flip />

            <Col matches={rightR16} picks={picks} onPick={handlePick} showAI />
            <Connector pairs={4} flip />

            <Col matches={rightR32} picks={picks} onPick={handlePick} showAI />

          </div>
        </div>
      </div>
    </div>
  );
}
