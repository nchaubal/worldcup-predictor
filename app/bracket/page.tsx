"use client";

import React, { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { useTournamentSupabase } from "@/context/TournamentContextSupabase";
import { TEAMS, Team, R32_MATCHES } from "@/lib/tournament-data";
import { syncTournamentWithFootballData, isPredictionLocked, TournamentMatch } from "@/lib/football-data-sync";
import { useFootballData } from "@/hooks/useFootballData";
import { PredictionModal } from "@/components/PredictionModal";
import { GitBranch, Trophy, CheckCircle2, Clock, Radio, ZoomIn, Undo, Edit3, RefreshCw } from "lucide-react";

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
  utcDate?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Slot — one team row inside a match card (display only, click handled by parent)
// ─────────────────────────────────────────────────────────────────────────────
function Slot({ team, picked, lost, score }: {
  team: Team | null; picked: boolean; lost: boolean;
  score?: number;
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
function MatchCard({ teamA, teamB, winnerId, scoreA, scoreB, pens, status, onOpenPredict, venue, predictedScoreA, predictedScoreB, isLocked }: {
  teamA: Team | null; teamB: Team | null;
  winnerId?: string | null; scoreA?: number; scoreB?: number;
  pens?: string; status?: "completed" | "live" | "upcoming";
  onOpenPredict?: () => void;
  venue?: string;
  predictedScoreA?: number; predictedScoreB?: number;
  isLocked?: boolean;
}) {
  const isResult = status === "completed";
  const isLive   = status === "live";
  const wonA = winnerId === teamA?.id;
  const wonB = winnerId === teamB?.id;
  const hasPredictedScore = predictedScoreA !== undefined && predictedScoreB !== undefined;
  const canPredict = !isResult && !isLive && !isLocked && teamA && teamB;

  return (
    <div
      className="group relative transition-all duration-200 ease-out hover:scale-[1.12] hover:z-30 hover:shadow-2xl"
      style={{ width: CW }}
    >
      <div className={[
        "rounded-lg border overflow-hidden bg-card transition-all duration-150",
        isLive   ? "border-red-500/60 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
          : isResult ? "border-border/30 opacity-75"
          : isLocked ? "border-amber-500/30 opacity-80"
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
        ) : isLocked ? (
          <div className="flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-400">
            <Clock className="h-2.5 w-2.5" />
            <span>LOCKED</span>
            {hasPredictedScore && (
              <span className="ml-auto font-normal">{predictedScoreA}-{predictedScoreB}</span>
            )}
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
        {/* Teams - clicking opens prediction modal */}
        <div 
          className={`divide-y divide-border/25 ${canPredict ? 'cursor-pointer' : ''}`}
          onClick={canPredict ? onOpenPredict : undefined}
        >
          <Slot team={teamA} picked={wonA} lost={isResult && !wonA && !!teamA}
            score={scoreA} />
          <Slot team={teamB} picked={wonB} lost={isResult && !wonB && !!teamB}
            score={scoreB} />
        </div>
        {/* Action buttons */}
        {canPredict && (
          <div className="flex border-t border-border/20">
            <button onClick={onOpenPredict}
              className="flex-1 flex items-center justify-center gap-1 py-1 text-[10px] text-emerald-500/70 hover:text-emerald-500 transition-colors">
              <Edit3 className="h-2.5 w-2.5" /> Predict
            </button>
          </div>
        )}
      </div>
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
function FinalConnector() {
  return (
    <div className="flex flex-col justify-center self-stretch shrink-0" style={{ width: GAP }}>
      <div className="h-0.5 bg-border/35" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Column — a list of match cards, vertically spaced
// ─────────────────────────────────────────────────────────────────────────────
function Col({ matches, picks, scores, onOpenPredict }: {
  matches: MatchDef[]; picks: Record<string, string>;
  scores: Record<string, { home: number; away: number }>;
  onOpenPredict: (matchId: string, teamA: Team, teamB: Team) => void;
}) {
  const getT = (id: string | null | undefined): Team | null =>
    id ? (TEAMS.find(t => t.id === id) ?? null) : null;
  return (
    <div className="flex flex-col justify-around flex-1 gap-3 shrink-0" style={{ width: CW }}>
      {matches.map(m => {
        const teamA = getT(m.teamAId);
        const teamB = getT(m.teamBId);
        // Check if prediction is locked (5 min before kickoff)
        const matchForLock: TournamentMatch = {
          id: m.id,
          homeTeamId: m.teamAId || '',
          awayTeamId: m.teamBId || '',
          date: '',
          venue: m.venue || '',
          status: m.status || 'upcoming',
          utcDate: m.utcDate,
        };
        const isLocked = isPredictionLocked(matchForLock);
        return (
          <MatchCard
            key={m.id}
            teamA={teamA}
            teamB={teamB}
            winnerId={m.winnerId ?? picks[m.id] ?? null}
            scoreA={m.scoreA} scoreB={m.scoreB} pens={m.pens}
            status={m.status} venue={m.venue}
            onOpenPredict={teamA && teamB ? () => onOpenPredict(m.id, teamA, teamB) : undefined}
            predictedScoreA={scores[m.id]?.home}
            predictedScoreB={scores[m.id]?.away}
            isLocked={isLocked}
          />
        );
      })}
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
  
  // Modal state for predictions
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<{
    id: string;
    homeTeam: Team;
    awayTeam: Team;
    venue?: string;
  } | null>(null);

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

  // Open prediction modal for a match
  const handleOpenPredict = (matchId: string, teamA: Team, teamB: Team, venue?: string) => {
    setSelectedMatch({ id: matchId, homeTeam: teamA, awayTeam: teamB, venue });
    setModalOpen(true);
  };

  // Handle prediction submission from modal
  const handlePredictionSubmit = (prediction: {
    homeScore: number;
    awayScore: number;
    etResult: string;
    penaltyWinner: string;
  }) => {
    if (!selectedMatch) return;
    
    const { id, homeTeam, awayTeam } = selectedMatch;
    const { homeScore, awayScore, penaltyWinner } = prediction;
    
    // Determine winner based on prediction
    let winner: string;
    if (homeScore > awayScore) {
      winner = homeTeam.id;
    } else if (awayScore > homeScore) {
      winner = awayTeam.id;
    } else {
      // Draw - use penalty winner
      winner = penaltyWinner;
    }
    
    setHistory(prev => [...prev, picks]);
    setPicks(prev => ({ ...prev, [id]: winner }));
    setScores(prev => ({ ...prev, [id]: { home: homeScore, away: awayScore } }));
    setKnockoutPrediction(id, winner, homeScore, awayScore);
    setModalOpen(false);
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
      venue: syncedMatch.venue,
      utcDate: syncedMatch.utcDate,
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

  // R16 winner helper with dynamic sync
  const r16W = (matchId: string): string | null => {
    const syncedTournament = syncTournamentWithFootballData(footballMatches);
    const syncedMatch = syncedTournament.r16.find(m => m.id === matchId);
    return syncedMatch?.winner ?? picks[matchId] ?? null;
  };

  // Build R16 matches with synced data
  const r16: MatchDef[] = R16_SOURCES.map(([id, a, b]) => {
    const syncedTournament = syncTournamentWithFootballData(footballMatches);
    const syncedMatch = syncedTournament.r16.find(m => m.id === id);
    
    return {
      id,
      teamAId: r32W(a),
      teamBId: r32W(b),
      winnerId: syncedMatch?.winner ?? picks[id] ?? null,
      scoreA: syncedMatch?.homeScore,
      scoreB: syncedMatch?.awayScore,
      pens: syncedMatch?.pens,
      status: syncedMatch?.status,
      venue: syncedMatch?.venue,
      utcDate: syncedMatch?.utcDate,
    };
  });

  // QF winner helper with dynamic sync
  const qfW = (matchId: string): string | null => {
    const syncedTournament = syncTournamentWithFootballData(footballMatches);
    const syncedMatch = syncedTournament.qf.find(m => m.id === matchId);
    return syncedMatch?.winner ?? picks[matchId] ?? null;
  };

  // SF winner helper with dynamic sync
  const sfW = (matchId: string): string | null => {
    const syncedTournament = syncTournamentWithFootballData(footballMatches);
    const syncedMatch = syncedTournament.sf.find(m => m.id === matchId);
    return syncedMatch?.winner ?? picks[matchId] ?? null;
  };

  // QF pairings based on official bracket:
  // First half:
  //   qf_1: r16_1 vs r16_2 (Canada/Morocco vs France/Paraguay) → France vs Morocco
  //   qf_2: r16_6 vs r16_5 (USA/Belgium vs Portugal/Spain) → Belgium vs Spain
  // Second half:
  //   qf_3: r16_3 vs r16_4 (Brazil/Norway vs Mexico/England) → Norway vs England
  //   qf_4: r16_8 vs r16_7 (Switzerland/Colombia vs Argentina/Egypt) → Switzerland vs Argentina
  const qf: MatchDef[] = (() => {
    const syncedTournament = syncTournamentWithFootballData(footballMatches);
    return [
      { id: "qf_1", teamAId: r16W("r16_2"), teamBId: r16W("r16_1"), winnerId: syncedTournament.qf.find(m => m.id === "qf_1")?.winner ?? picks["qf_1"] ?? null, scoreA: syncedTournament.qf.find(m => m.id === "qf_1")?.homeScore, scoreB: syncedTournament.qf.find(m => m.id === "qf_1")?.awayScore, status: syncedTournament.qf.find(m => m.id === "qf_1")?.status },
      { id: "qf_2", teamAId: r16W("r16_5"), teamBId: r16W("r16_6"), winnerId: syncedTournament.qf.find(m => m.id === "qf_2")?.winner ?? picks["qf_2"] ?? null, scoreA: syncedTournament.qf.find(m => m.id === "qf_2")?.homeScore, scoreB: syncedTournament.qf.find(m => m.id === "qf_2")?.awayScore, status: syncedTournament.qf.find(m => m.id === "qf_2")?.status },
      { id: "qf_3", teamAId: r16W("r16_3"), teamBId: r16W("r16_4"), winnerId: syncedTournament.qf.find(m => m.id === "qf_3")?.winner ?? picks["qf_3"] ?? null, scoreA: syncedTournament.qf.find(m => m.id === "qf_3")?.homeScore, scoreB: syncedTournament.qf.find(m => m.id === "qf_3")?.awayScore, status: syncedTournament.qf.find(m => m.id === "qf_3")?.status },
      { id: "qf_4", teamAId: r16W("r16_7"), teamBId: r16W("r16_8"), winnerId: syncedTournament.qf.find(m => m.id === "qf_4")?.winner ?? picks["qf_4"] ?? null, scoreA: syncedTournament.qf.find(m => m.id === "qf_4")?.homeScore, scoreB: syncedTournament.qf.find(m => m.id === "qf_4")?.awayScore, status: syncedTournament.qf.find(m => m.id === "qf_4")?.status },
    ];
  })();

  // SF pairings:
  //   sf_1: qf_1 vs qf_2 (France vs Spain)
  //   sf_2: qf_3 vs qf_4 (England vs Argentina)
  const sf: MatchDef[] = (() => {
    const syncedTournament = syncTournamentWithFootballData(footballMatches);
    return [
      { id: "sf_1", teamAId: qfW("qf_1"), teamBId: qfW("qf_2"), winnerId: syncedTournament.sf.find(m => m.id === "sf_1")?.winner ?? picks["sf_1"] ?? null, scoreA: syncedTournament.sf.find(m => m.id === "sf_1")?.homeScore, scoreB: syncedTournament.sf.find(m => m.id === "sf_1")?.awayScore, status: syncedTournament.sf.find(m => m.id === "sf_1")?.status },
      { id: "sf_2", teamAId: qfW("qf_3"), teamBId: qfW("qf_4"), winnerId: syncedTournament.sf.find(m => m.id === "sf_2")?.winner ?? picks["sf_2"] ?? null, scoreA: syncedTournament.sf.find(m => m.id === "sf_2")?.homeScore, scoreB: syncedTournament.sf.find(m => m.id === "sf_2")?.awayScore, status: syncedTournament.sf.find(m => m.id === "sf_2")?.status },
    ];
  })();

  // Final
  const finalMatch: MatchDef = (() => {
    const syncedTournament = syncTournamentWithFootballData(footballMatches);
    const syncedFinal = syncedTournament.final;
    return {
      id: "final",
      teamAId: sfW("sf_1"),
      teamBId: sfW("sf_2"),
      winnerId: syncedFinal?.winner ?? picks["final"] ?? null,
      scoreA: syncedFinal?.homeScore,
      scoreB: syncedFinal?.awayScore,
      status: syncedFinal?.status,
      venue: "MetLife Stadium",
    };
  })();

  const champion    = finalMatch.winnerId ? TEAMS.find(t => t.id === finalMatch.winnerId) : null;
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
            <Col matches={leftR32} picks={picks} scores={scores} onOpenPredict={handleOpenPredict} />
            <Connector pairs={4} />

            {/* Left R16 */}
            <Col matches={leftR16} picks={picks} scores={scores} onOpenPredict={handleOpenPredict} />
            <Connector pairs={2} />

            {/* Left QF */}
            <Col matches={leftQF} picks={picks} scores={scores} onOpenPredict={handleOpenPredict} />
            {/* QF→SF connector: 2 QF matches merge into 1 SF */}
            <SFConnector flip={false} />

            {/* Left SF */}
            <div className="flex flex-col justify-center shrink-0" style={{ width: CW }}>
              {(() => {
                const teamA = TEAMS.find(t => t.id === sf[0].teamAId) ?? null;
                const teamB = TEAMS.find(t => t.id === sf[0].teamBId) ?? null;
                return (
                  <MatchCard
                    teamA={teamA}
                    teamB={teamB}
                    winnerId={sf[0].winnerId ?? picks["sf_1"] ?? null}
                    onOpenPredict={teamA && teamB ? () => handleOpenPredict("sf_1", teamA, teamB) : undefined}
                    predictedScoreA={scores["sf_1"]?.home}
                    predictedScoreB={scores["sf_1"]?.away}
                  />
                );
              })()}
            </div>
            {/* SF→Final connector */}
            <FinalConnector />

            {/* Final + champion */}
            <div className="flex flex-col items-center justify-center shrink-0" style={{ width: CW }}>
              {(() => {
                const teamA = TEAMS.find(t => t.id === finalMatch.teamAId) ?? null;
                const teamB = TEAMS.find(t => t.id === finalMatch.teamBId) ?? null;
                return (
                  <MatchCard
                    teamA={teamA}
                    teamB={teamB}
                    winnerId={finalMatch.winnerId}
                    venue="MetLife"
                    onOpenPredict={teamA && teamB ? () => handleOpenPredict("final", teamA, teamB, "MetLife") : undefined}
                    predictedScoreA={scores["final"]?.home}
                    predictedScoreB={scores["final"]?.away}
                  />
                );
              })()}
              {champion && (
                <div className="mt-3 text-center">
                  <div className="text-2xl">{champion.flag}</div>
                  <div className="font-black text-xs text-primary mt-0.5">{champion.name}</div>
                  <div className="text-[9px] text-muted-foreground uppercase tracking-widest">Champions</div>
                </div>
              )}
            </div>

            {/* Right connectors mirror left, converging back into the Final */}
            <FinalConnector />
            {/* Right SF */}
            <div className="flex flex-col justify-center shrink-0" style={{ width: CW }}>
              {(() => {
                const teamA = TEAMS.find(t => t.id === sf[1].teamAId) ?? null;
                const teamB = TEAMS.find(t => t.id === sf[1].teamBId) ?? null;
                return (
                  <MatchCard
                    teamA={teamA}
                    teamB={teamB}
                    winnerId={sf[1].winnerId ?? picks["sf_2"] ?? null}
                    onOpenPredict={teamA && teamB ? () => handleOpenPredict("sf_2", teamA, teamB) : undefined}
                    predictedScoreA={scores["sf_2"]?.home}
                    predictedScoreB={scores["sf_2"]?.away}
                  />
                );
              })()}
            </div>
            <SFConnector flip />

            <Col matches={rightQF} picks={picks} scores={scores} onOpenPredict={handleOpenPredict} />
            <Connector pairs={2} flip />

            <Col matches={rightR16} picks={picks} scores={scores} onOpenPredict={handleOpenPredict} />
            <Connector pairs={4} flip />

            <Col matches={rightR32} picks={picks} scores={scores} onOpenPredict={handleOpenPredict} />

          </div>
        </div>
        </div>
      </div>
      
      {/* Prediction Modal */}
      {selectedMatch && (
        <PredictionModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handlePredictionSubmit}
          homeTeam={selectedMatch.homeTeam}
          awayTeam={selectedMatch.awayTeam}
          matchDate={selectedMatch.venue || "Knockout Stage"}
          matchVenue={selectedMatch.venue}
          existingPrediction={
            scores[selectedMatch.id] ? {
              homeScore: scores[selectedMatch.id].home,
              awayScore: scores[selectedMatch.id].away,
            } : null
          }
        />
      )}
    </div>
  );
}
