"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid, GitBranch, Users, MapPin, CheckCircle2, Clock, Radio } from "lucide-react";
import { TEAMS, GROUPS, GROUP_STANDINGS, R32_MATCHES, getTeamById } from "@/lib/tournament-data";
import { syncTournamentWithFootballData, getLiveTournamentMatches, getCompletedTournamentMatches, getUpcomingTournamentMatches } from "@/lib/football-data-sync";
import { FootballDataScores } from "@/components/FootballDataScores";
import { useFootballData } from "@/hooks/useFootballData";

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
  const { matches: footballMatches, fetchLiveMatches } = useFootballData();
  
  // Use dynamic sync system to get real-time match data
  const syncedTournament = syncTournamentWithFootballData(footballMatches);
  const completedMatches = getCompletedTournamentMatches(footballMatches).filter(m => m.id.startsWith('r32_'));
  const liveMatches = getLiveTournamentMatches(footballMatches).filter(m => m.id.startsWith('r32_'));
  const upcomingMatches = getUpcomingTournamentMatches(footballMatches).filter(m => m.id.startsWith('r32_'));
  const featuredGroups    = ["I", "J", "C", "L"]; // France, Argentina, Brazil, England groups

  return (
    <div className="min-h-screen">

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8"
        style={{ background: "linear-gradient(135deg, oklch(0.08 0.025 160) 0%, oklch(0.13 0.04 155) 50%, oklch(0.10 0.020 145) 100%)" }}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20rem] opacity-[0.03] select-none">⚽</div>
        </div>

        <div className="relative mx-auto max-w-5xl">
          <div className="flex flex-col items-center text-center gap-6">
            <Badge className="bg-primary/15 text-primary border-primary/30 text-xs px-4 py-1.5 font-semibold tracking-wide uppercase">
              🔴 Round of 32 Underway · Jun 28 – Jul 4
            </Badge>

            <div className="flex items-center gap-5 sm:gap-8">
              <Image
                src="/2026_FIFA_World_Cup_emblem.svg.webp"
                alt="FIFA World Cup 2026"
                width={960}
                height={1482}
                priority
                className="h-28 w-auto sm:h-40 rounded-xl shrink-0"
              />
              <h1 className="text-left text-4xl font-black tracking-tight sm:text-6xl leading-none">
                Boom FIFA World Cup<br />
                <span className="text-primary">2026™</span>{" "}
                <span className="text-foreground/60 font-light">Predictor</span>
              </h1>
            </div>

            <p className="max-w-xl text-lg text-muted-foreground leading-relaxed">
              48 teams. 104 matches. 3 nations hosting. Predict every result, build your bracket, and compete with friends.
            </p>

            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/bracket" className={cn(buttonVariants({ size: "lg" }), "bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-8")}>
                Build My Bracket
              </Link>
              <Link href="/predict" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "border-border text-foreground hover:bg-accent px-8")}>
                Predict Matches
              </Link>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>🇺🇸 USA · 🇨🇦 Canada · 🇲🇽 Mexico · Final: Jul 19, New Jersey</span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-14">

        {/* ── Stats bar ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STATS.map((s) => (
            <Card key={s.label} className="text-center border-border/60">
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
                    <Card key={match.id} className="border-red-500/30 bg-red-500/5 ring-1 ring-red-500/20">
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
            {[...completedMatches, ...upcomingMatches.slice(0, 6)].map((m) => {
              const home = getTeamById(m.homeTeamId)!;
              const away = getTeamById(m.awayTeamId)!;
              const isCompleted = m.status === "completed";
              const homeWon = m.winner === m.homeTeamId;
              const awayWon = m.winner === m.awayTeamId;
              return (
                <Card key={m.id} className={`border-border/50 transition-all ${isCompleted ? "opacity-80" : "hover:border-primary/30"}`}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      {statusIcon[m.status]}
                      <span className={`font-semibold ${m.status === "live" ? "text-red-400" : m.status === "completed" ? "text-emerald-400" : ""}`}>
                        {statusLabel[m.status]}
                      </span>
                      <span>·</span>
                      <span>{m.date}</span>
                      <span>·</span>
                      <MapPin className="h-3 w-3" /><span>{m.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`flex-1 flex items-center gap-2 ${isCompleted && !homeWon ? "opacity-40" : ""}`}>
                        <span className="text-xl">{home.flag}</span>
                        <span className={`text-sm font-semibold ${homeWon ? "text-primary" : ""}`}>{home.name}</span>
                      </div>
                      <div className="shrink-0 text-center min-w-[3rem]">
                        {isCompleted ? (
                          <div className="font-black text-base">
                            <span className={homeWon ? "text-primary" : ""}>{m.homeScore}</span>
                            <span className="text-muted-foreground mx-1">–</span>
                            <span className={awayWon ? "text-primary" : ""}>{m.awayScore}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm font-bold">vs</span>
                        )}
                        {m.pens && <div className="text-[10px] text-muted-foreground">pens {m.pens}</div>}
                      </div>
                      <div className={`flex-1 flex items-center justify-end gap-2 ${isCompleted && !awayWon ? "opacity-40" : ""}`}>
                        <span className={`text-sm font-semibold ${awayWon ? "text-primary" : ""}`}>{away.name}</span>
                        <span className="text-xl">{away.flag}</span>
                      </div>
                    </div>
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
              const standings = GROUP_STANDINGS[grp];
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
                    {standings.map((s, idx) => {
                      const team = getTeamById(s.teamId)!;
                      const qualified = idx < 2 || (grp === "B" && idx === 2) || (grp === "D" && idx === 2) ||
                        (grp === "E" && idx === 2) || (grp === "F" && idx === 2) || (grp === "I" && idx === 2) ||
                        (grp === "J" && idx === 2) || (grp === "K" && idx === 2) || (grp === "L" && idx === 2);
                      return (
                        <div key={s.teamId}
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
                    })}
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
