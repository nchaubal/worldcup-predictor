"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTournamentSupabase } from "@/context/TournamentContextSupabase";
import { UserPredictions } from "@/lib/tournament-data";
import { Users, Plus, LogIn, Trophy, Medal, Copy, CheckCheck } from "lucide-react";

export default function LeaguesPage() {
  const { leagues, currentUser, createLeague, joinLeague, getLeaderboard, isLoading, isAuthenticated } = useTournamentSupabase();
  const [newLeagueName, setNewLeagueName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [activeLeague, setActiveLeague] = useState("global");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleCreate = async () => {
    if (!newLeagueName.trim()) return;
    try {
      const league = await createLeague(newLeagueName.trim());
      setMessage({ type: "success", text: `League "${league.name}" created! Code: ${league.code}` });
      setNewLeagueName("");
      setActiveLeague(league.id);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to create league. Please try again." });
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    try {
      const league = await joinLeague(joinCode.trim());
      if (league) {
        setMessage({ type: "success", text: `Joined "${league.name}"!` });
        setJoinCode("");
        setActiveLeague(league.id);
      } else {
        setMessage({ type: "error", text: "League not found. Check the code and try again." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to join league. Please try again." });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const [leaderboard, setLeaderboard] = useState<UserPredictions[]>([]);
  const currentLeague = leagues.find((l) => l.id === activeLeague);

  useEffect(() => {
    const loadLeaderboard = async () => {
      if (activeLeague) {
        const data = await getLeaderboard(activeLeague);
        setLeaderboard(data);
      }
    };
    loadLeaderboard();
  }, [activeLeague, getLeaderboard]);

  const medalColors = [
    "text-yellow-500",
    "text-gray-400",
    "text-amber-600",
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Leagues</h1>
            <p className="text-muted-foreground text-sm">Compete with friends in private prediction leagues</p>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}
        >
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-3 text-xs underline opacity-70">
            Dismiss
          </button>
        </div>
      )}

      {!isAuthenticated ? (
        <Card className="mb-8 border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-6 text-center">
            <p className="text-amber-400 font-medium mb-2">Sign in to create or join leagues</p>
            <p className="text-sm text-muted-foreground">Use the Sign In button in the top navigation bar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" /> Create a League
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="League name..."
                value={newLeagueName}
                onChange={(e) => setNewLeagueName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
              <Button onClick={handleCreate} disabled={!newLeagueName.trim()} className="w-full">
                Create League
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <LogIn className="h-4 w-4 text-primary" /> Join a League
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Enter league code..."
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                className="uppercase tracking-widest"
              />
              <Button
                onClick={handleJoin}
                disabled={!joinCode.trim()}
                variant="outline"
                className="w-full"
              >
                Join League
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {leagues.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3">Your Leagues</h2>
          <div className="flex flex-wrap gap-2">
            {leagues.map((league) => (
              <button
                key={league.id}
                onClick={() => setActiveLeague(league.id)}
                className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                  activeLeague === league.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {league.name}
                <Badge variant="secondary" className="text-xs">{league.members.length}</Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      {leagues.length === 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Your Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leaderboard.map((user, idx) => {
                const isMe = currentUser?.userId === user.userId;
                return (
                  <div
                    key={user.userId}
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 ${
                      isMe ? "bg-primary/8 ring-1 ring-primary/25" : "hover:bg-accent/40"
                    }`}
                  >
                    <div className={`w-8 text-center font-bold text-lg ${medalColors[idx] ?? "text-muted-foreground"}`}>
                      <Medal className="h-5 w-5 mx-auto" />
                    </div>
                    <div className="text-2xl">{user.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium flex items-center gap-2">
                        {user.userName}
                        {isMe && <Badge variant="secondary" className="text-xs">You</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.predictions?.length ?? 0} predictions made
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">{user.totalPoints}</div>
                      <div className="text-xs text-muted-foreground">pts</div>
                    </div>
                  </div>
                );
              })}
            </div>
            {leaderboard[0]?.predictions?.length === 0 && (
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Create or join a league to compete with friends!
              </div>
            )}
          </CardContent>
        </Card>
      ) : currentLeague && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                {currentLeague.name} — Leaderboard
              </CardTitle>
              {currentLeague.code !== "GLOBAL" && (
                <button
                  onClick={() => handleCopyCode(currentLeague.code)}
                  className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-mono hover:bg-muted transition-colors"
                >
                  {copiedCode === currentLeague.code ? (
                    <><CheckCheck className="h-3 w-3 text-emerald-500" /> Copied!</>
                  ) : (
                    <><Copy className="h-3 w-3" /> {currentLeague.code}</>
                  )}
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leaderboard.map((user, idx) => {
                const isMe = currentUser?.userId === user.userId;
                return (
                  <div
                    key={user.userId}
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 ${
                      isMe ? "bg-primary/8 ring-1 ring-primary/25" : "hover:bg-accent/40"
                    }`}
                  >
                    <div className={`w-8 text-center font-bold text-lg ${medalColors[idx] ?? "text-muted-foreground"}`}>
                      {idx < 3 ? <Medal className="h-5 w-5 mx-auto" /> : idx + 1}
                    </div>
                    <div className="text-2xl">{user.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium flex items-center gap-2">
                        {user.userName}
                        {isMe && <Badge variant="secondary" className="text-xs">You</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.predictions?.length ?? 0} predictions made
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">{user.totalPoints}</div>
                      <div className="text-xs text-muted-foreground">pts</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6 border-border/60 bg-muted/20">
        <CardContent className="pt-4 pb-4">
          <h3 className="font-semibold mb-3">Scoring System</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Exact score correct</span>
              <Badge className="bg-primary/15 text-primary border-primary/30">+3 points</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Correct result (W/D/L)</span>
              <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30">+1 point</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Wrong result</span>
              <Badge variant="secondary">0 points</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
