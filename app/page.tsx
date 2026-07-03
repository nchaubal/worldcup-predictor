"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid, GitBranch, Users, MapPin, CheckCircle2, Clock, Radio, Calendar, Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { TEAMS, GROUPS, GROUP_STANDINGS, R32_MATCHES, getTeamById, getTeamByName } from "@/lib/tournament-data";
import { syncTournamentWithFootballData, getGroupStandingsFromAPI } from "@/lib/football-data-sync";
import { FootballDataScores } from "@/components/FootballDataScores";
import { useFootballData } from "@/hooks/useFootballData";
import { useOpenFootball } from "@/hooks/useOpenFootball";

const STATS = [
  { label: "Teams",   value: "48", icon: "🌍" },
  { label: "Matches", value: "104", icon: "⚽" },
  { label: "Groups",  value: "12", icon: "🏟️" },
  { label: "Nations", value: "3",  icon: "🗺️", sub: "hosts" },
];

const statusIcon = {
  completed: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
  live:      <Radio className="h-3.5 w-3.5 text-red-400 animate-pulse" />,
  upcoming:  <Clock className="h-3.5 w-3.5 text-muted-foreground" />,
};

const statusLabel = {
  completed: "FT",
  live:      "LIVE",
  upcoming:  "Soon",
};

export default function HomePage() {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const { matches: footballMatches, fetchWorldCupMatches } = useFootballData();
  const { getMatchDetails } = useOpenFootball();

  // Fetch ALL World Cup matches on mount (and refresh every 60s) so standings,
  // completed results, and live matches stay current.
  useEffect(() => {
    fetchWorldCupMatches();
    const interval = setInterval(fetchWorldCupMatches, 60000);
    return () => clearInterval(interval);
  }, [fetchWorldCupMatches]);
  
  // Use dynamic sync system to get real-time match data
  const syncedTournament = syncTournamentWithFootballData(footballMatches);
  const apiGroupStandings = getGroupStandingsFromAPI(footballMatches);
  const featuredGroups    = ["I", "J", "C", "L"]; // France, Argentina, Brazil, England groups

  // Round of 32 grid always shows a 12-game window (4 rows x 3 cols) centered
  // on the current match: 6 before it, the current match, and 5 after. Near
  // either edge of the schedule, the window shifts inward so it still totals 12.
  const r32List = syncedTournament.r32;
  const currentR32Idx = (() => {
    const liveIdx = r32List.findIndex(m => m.status === "live");
    if (liveIdx !== -1) return liveIdx;
    const upcomingIdx = r32List.findIndex(m => m.status === "upcoming");
    if (upcomingIdx !== -1) return upcomingIdx;
    return r32List.length - 1;
  })();
  const lastR32Idx = r32List.length - 1;
  let windowStart = currentR32Idx - 6;
  let windowEnd = currentR32Idx + 5;
  if (windowEnd > lastR32Idx) {
    windowStart -= windowEnd - lastR32Idx;
    windowEnd = lastR32Idx;
  }
  if (windowStart < 0) {
    windowEnd += -windowStart;
    windowStart = 0;
  }
  windowStart = Math.max(0, windowStart);
  windowEnd = Math.min(lastR32Idx, windowEnd);
  const windowedR32 = r32List.slice(windowStart, windowEnd + 1);

  return (
    <div className="min-h-screen">

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8"
        style={{ background: "linear-gradient(135deg, oklch(0.08 0.025 160) 0%, oklch(0.13 0.04 155) 50%, oklch(0.10 0.020 145) 100%)" }}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl animate-float-slow" />
          <div className="absolute -bottom-16 -left-16 h-72 w-72 rounded-full bg-primary/8 blur-3xl animate-float-slower" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20rem] opacity-[0.03] select-none">⚽</div>
        </div>

        <div className="relative mx-auto max-w-5xl">
          <div className="flex flex-col items-center text-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            <Badge className="bg-primary/15 text-primary border-primary/30 text-xs px-4 py-1.5 font-semibold tracking-wide uppercase">
              🔴 Round of 32 Underway · Jun 28 – Jul 4
            </Badge>

            <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-8">
              <Image
                src="/2026_FIFA_World_Cup_emblem.svg.webp"
                alt="FIFA World Cup 2026"
                width={960}
                height={1482}
                priority
                className="h-24 w-auto sm:h-40 rounded-xl shrink-0"
              />
              <h1 className="text-center sm:text-left text-4xl font-black tracking-tight sm:text-6xl leading-none">
                Boom FIFA World Cup<br />
                <span className="text-primary">2026™</span>{" "}
                <span className="text-foreground/60 font-light">Predictor</span>
              </h1>
            </div>

            <p className="max-w-xl text-lg text-muted-foreground leading-relaxed">
              48 teams. 104 matches. 3 nations hosting. Predict every result, build your bracket, and compete with friends.
            </p>

            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/bracket" className={cn(buttonVariants({ size: "lg" }), "bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-8 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-primary/25")}>
                Build My Bracket
              </Link>
              <Link href="/predict" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "border-border text-foreground hover:bg-accent px-8 transition-all duration-200 hover:scale-105")}>
                Predict Matches
              </Link>
            </div>

            <div className="flex flex-col items-center gap-1.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>🇺🇸 USA · 🇨🇦 Canada · 🇲🇽 Mexico</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>June 11 – July 19</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                <span>Final: July 19 · New Jersey, USA</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-14">

        {/* ── Stats bar ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STATS.map((s) => (
            <Card key={s.label} className="text-center border-border/60 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
              <CardContent className="py-5">
                <div className="text-3xl mb-1">{s.icon}</div>
                <div className="text-3xl font-black text-primary">{s.value}</div>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{s.sub ?? s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Live Scores ───────────────────────────────────── */}
        <FootballDataScores />

        {/* ── R32 Results ────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold">Round of 32</h2>
            <Link href="/bracket" className="text-sm text-primary hover:underline">View full bracket →</Link>
          </div>

          {footballMatches.filter(m => m.isLive).length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Radio className="h-4 w-4 text-red-400 animate-pulse" />
                <span className="text-sm font-semibold text-red-400 uppercase tracking-wide">Live Now</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {footballMatches.filter(m => m.isLive).map((match) => {
                  return (
                    <Card key={match.id} className="border-red-500/30 bg-red-500/5 ring-1 ring-red-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-500/10 hover:ring-red-500/40 sm:only:col-span-2">
                      <CardContent className="py-4 flex items-center gap-3">
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-lg font-bold text-muted-foreground">{match.homeTeam.tla}</span>
                          <span className="font-semibold text-sm">{match.homeTeam.name}</span>
                        </div>
                        <div className="text-center shrink-0">
                          <div className="text-xs text-red-400 font-bold animate-pulse">LIVE</div>
                          <div className="text-lg font-bold">{match.formattedScore}</div>
                        </div>
                        <div className="flex-1 flex items-center justify-end gap-2">
                          <span className="font-semibold text-sm">{match.awayTeam.name}</span>
                          <span className="text-lg font-bold text-muted-foreground">{match.awayTeam.tla}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {windowedR32.map((m) => {
              // Handle both static matches (with teamId) and API matches (with team names)
              let homeTeam, awayTeam;
              
              if (m.homeTeamId && m.awayTeamId) {
                // Static match format
                homeTeam = getTeamById(m.homeTeamId)!;
                awayTeam = getTeamById(m.awayTeamId)!;
              } else {
                // API match format - extract from match ID or use fallback
                const homeTeamName = m.id.split('-')[0];
                const awayTeamName = m.id.split('-')[1];
                homeTeam = getTeamById(homeTeamName) || { name: homeTeamName, flag: '🏳️', id: homeTeamName };
                awayTeam = getTeamById(awayTeamName) || { name: awayTeamName, flag: '🏳️', id: awayTeamName };
              }
              
              const isCompleted = m.status === "completed";
              const isLive = m.status === "live";
              const homeWon = m.winner === (m.homeTeamId || homeTeam.id);
              const awayWon = m.winner === (m.awayTeamId || awayTeam.id);
              
              // Get match details from OpenFootball
              const matchDetails = getMatchDetails(homeTeam.name, awayTeam.name);
              const hasGoals = matchDetails && matchDetails.goals.length > 0;
              const isExpanded = expandedMatch === m.id;
              const homeGoals = matchDetails?.goals.filter(g => g.team === 'home') || [];
              const awayGoals = matchDetails?.goals.filter(g => g.team === 'away') || [];
              
              return (
                <Card 
                  key={m.id} 
                  className={`border-border/50 transition-all duration-200 ${isCompleted ? "opacity-80 hover:opacity-100" : "hover:border-primary/30"} ${hasGoals ? "cursor-pointer" : ""}`}
                  onClick={() => hasGoals && setExpandedMatch(isExpanded ? null : m.id)}
                >
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground mb-2">
                      <div className="flex items-center gap-2">
                        {statusIcon[m.status]}
                        <span className={`font-semibold ${m.status === "live" ? "text-red-400" : m.status === "completed" ? "text-emerald-400" : ""}`}>
                          {statusLabel[m.status]}
                        </span>
                        <span>·</span>
                        <span>{m.date}</span>
                        <span>·</span>
                        <MapPin className="h-3 w-3" /><span>{m.venue}</span>
                      </div>
                      {hasGoals && (
                        isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`flex-1 flex items-center gap-2 ${isCompleted && !homeWon ? "opacity-40" : ""}`}>
                        <span className="text-xl">{homeTeam.flag}</span>
                        <span className={`text-sm font-semibold ${homeWon ? "text-primary" : ""}`}>{homeTeam.name}</span>
                      </div>
                      <div className="shrink-0 text-center min-w-[3rem]">
                        {isCompleted || isLive ? (
                          <div className="font-black text-base">
                            <span className={homeWon ? "text-primary" : ""}>{m.homeScore}</span>
                            <span className="text-muted-foreground mx-1">–</span>
                            <span className={awayWon ? "text-primary" : ""}>{m.awayScore}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm font-bold">vs</span>
                        )}
                        {m.pens && <div className="text-[10px] text-muted-foreground">pens {m.pens}</div>}
                        {isLive && <div className="text-[10px] text-red-400 animate-pulse">LIVE</div>}
                      </div>
                      <div className={`flex-1 flex items-center justify-end gap-2 ${isCompleted && !awayWon ? "opacity-40" : ""}`}>
                        <span className={`text-sm font-semibold ${awayWon ? "text-primary" : ""}`}>{awayTeam.name}</span>
                        <span className="text-xl">{awayTeam.flag}</span>
                      </div>
                    </div>
                    
                    {/* Expanded goal scorers section */}
                    {isExpanded && matchDetails && (
                      <div className="mt-3 pt-3 border-t border-border/30">
                        <div className="grid grid-cols-2 gap-4 text-[10px]">
                          <div className="text-left space-y-0.5">
                            {homeGoals.length > 0 ? homeGoals.map((goal, i) => (
                              <div key={i} className="text-muted-foreground">
                                ⚽ {goal.scorer} {goal.minute}&apos;
                                {goal.penalty && ' (P)'}
                                {goal.ownGoal && ' (OG)'}
                              </div>
                            )) : <span className="text-muted-foreground/50 italic">No goals</span>}
                          </div>
                          <div className="text-right space-y-0.5">
                            {awayGoals.length > 0 ? awayGoals.map((goal, i) => (
                              <div key={i} className="text-muted-foreground">
                                ⚽ {goal.scorer} {goal.minute}&apos;
                                {goal.penalty && ' (P)'}
                                {goal.ownGoal && ' (OG)'}
                              </div>
                            )) : <span className="text-muted-foreground/50 italic">No goals</span>}
                          </div>
                        </div>
                        {matchDetails.cards.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-border/20">
                            <div className="grid grid-cols-2 gap-4 text-[10px] text-muted-foreground">
                              <div className="text-left">
                                {matchDetails.cards.filter(c => c.team === 'home').map((card, i) => (
                                  <div key={i}>
                                    {card.type === 'red' ? '🟥' : card.type === 'yellowred' ? '🟨🟥' : '🟨'} {card.player} {card.minute}&apos;
                                  </div>
                                ))}
                              </div>
                              <div className="text-right">
                                {matchDetails.cards.filter(c => c.team === 'away').map((card, i) => (
                                  <div key={i}>
                                    {card.type === 'red' ? '🟥' : card.type === 'yellowred' ? '🟨🟥' : '🟨'} {card.player} {card.minute}&apos;
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* ── Selected Group Standings ───────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold">Final Group Standings</h2>
            <div className="flex items-center gap-3">
              {selectedGroup && (
                <Badge variant="secondary" className="text-xs">
                  Selected: Group {selectedGroup}
                </Badge>
              )}
              <Link href="/predict" className="text-sm text-primary hover:underline">See all groups →</Link>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredGroups.map((grp) => {
              const standings = apiGroupStandings[grp] || [];
              const isSelected = selectedGroup === grp;
              return (
                <Card 
                  key={grp} 
                  className={`border-border/60 cursor-pointer transition-all hover:border-primary/40 hover:shadow-md ${
                    isSelected ? "ring-2 ring-primary/50 border-primary/50 bg-primary/5" : ""
                  }`}
                  onClick={() => setSelectedGroup(isSelected ? null : grp)}
                >
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className={`text-sm font-bold uppercase tracking-widest ${
                      isSelected ? "text-primary" : "text-muted-foreground"
                    }`}>Group {grp}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0 space-y-1.5">
                    {standings.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground text-xs">
                        No matches completed
                      </div>
                    ) : (
                      standings.map((s, idx) => {
                        const team = getTeamByName(s.name) || { name: s.name, flag: '🏳️', id: s.name };
                        const qualified = idx < 2 || (grp === "B" && idx === 2) || (grp === "D" && idx === 2) ||
                          (grp === "E" && idx === 2) || (grp === "F" && idx === 2) || (grp === "I" && idx === 2) ||
                          (grp === "J" && idx === 2) || (grp === "K" && idx === 2) || (grp === "L" && idx === 2);
                        return (
                          <div key={s.name}
                            className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${
                              idx === 0 ? "bg-primary/10 ring-1 ring-primary/20" :
                              idx === 1 ? "bg-accent/60" :
                              qualified ? "bg-accent/30" : "opacity-40"
                            }`}>
                            <span className="w-4 text-center text-xs font-bold text-muted-foreground">{idx + 1}</span>
                            <span className="text-lg">{team.flag}</span>
                            <span className={`flex-1 font-medium text-xs truncate ${idx === 0 ? "text-primary" : ""}`}>{team.name}</span>
                            <span className="font-black text-sm">{s.points}</span>
                            <span className="text-xs text-muted-foreground w-8 text-right">
                              {s.gd > 0 ? "+" : ""}{s.gd}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* ── Quick links ────────────────────────────────────── */}
        <div className="grid sm:grid-cols-3 gap-4 pb-4">
          {[
            { href: "/predict", icon: LayoutGrid, label: "Group Stage Predictions", desc: "Review all 12 group standings & predict upcoming matches", color: "text-blue-400" },
            { href: "/bracket", icon: GitBranch, label: "Build Your Bracket",       desc: "Pick winners through R32 → R16 → QF → SF → Final",    color: "text-emerald-400" },
            { href: "/leagues", icon: Users,     label: "Create a League",          desc: "Challenge friends with a private league code",          color: "text-purple-400" },
          ].map(({ href, icon: Icon, label, desc, color }) => (
            <Link key={href} href={href}>
              <Card className="h-full border-border/60 hover:border-primary/40 hover:bg-accent/30 transition-all group">
                <CardContent className="py-5 px-5">
                  <Icon className={`h-7 w-7 mb-3 ${color} group-hover:scale-110 transition-transform`} />
                  <div className="font-bold text-sm mb-1">{label}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{desc}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
