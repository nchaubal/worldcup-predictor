"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { Prediction, UserPredictions, League, GROUP_MATCHES, KNOCKOUT_MATCHES, Match, Team } from "@/lib/tournament-data";
import { calculatePoints } from "@/lib/ai-predictor";
import { createClient } from "@/lib/supabase/client";

// Note: KNOCKOUT_MATCHES only covers QF/SF/Final; the bracket UI also
// predicts Round of 32/16 winners under ids like "r16_1" that aren't in
// that list. Rows are classified by shape instead: setKnockoutPrediction
// always writes null scores, setPrediction always writes real scores.

type ActualResult = {
  matchId: string;
  homeScore: number;
  awayScore: number;
};

type TournamentContextType = {
  currentUser: UserPredictions;
  authUser: User | null;
  authLoading: boolean;
  predictions: Prediction[];
  knockoutPredictions: { [matchId: string]: string };
  leagues: League[];
  actualResults: ActualResult[];
  setPrediction: (matchId: string, homeScore: number, awayScore: number) => void;
  setKnockoutPrediction: (matchId: string, winnerId: string) => void;
  createLeague: (name: string) => League;
  joinLeague: (code: string) => League | null;
  logout: () => Promise<void>;
  updateUserName: (name: string) => void;
  getLeaderboard: (leagueId?: string) => UserPredictions[];
  getTotalPoints: () => number;
};

const defaultUser: UserPredictions = {
  userId: "user_1",
  userName: "You",
  avatar: "⚽",
  predictions: [],
  totalPoints: 0,
};

const MOCK_OPPONENTS: UserPredictions[] = [
  { userId: "u2", userName: "Alex M.", avatar: "🏆", predictions: [], totalPoints: 47 },
  { userId: "u3", userName: "Sara K.", avatar: "🎯", predictions: [], totalPoints: 38 },
  { userId: "u4", userName: "Luca P.", avatar: "🌟", predictions: [], totalPoints: 55 },
  { userId: "u5", userName: "Maya R.", avatar: "🔥", predictions: [], totalPoints: 29 },
];

const TournamentContext = createContext<TournamentContextType | null>(null);

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserPredictions>(defaultUser);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [knockoutPredictions, setKnockoutPredictions] = useState<{ [matchId: string]: string }>({});
  const [leagues, setLeagues] = useState<League[]>([
    {
      id: "global",
      name: "Global League",
      code: "GLOBAL",
      members: [defaultUser, ...MOCK_OPPONENTS],
      createdBy: "system",
    },
  ]);
  const [actualResults] = useState<ActualResult[]>([]);

  // Track the logged-in Supabase user and load their saved predictions.
  useEffect(() => {
    const loadForUser = async (user: User | null) => {
      setAuthUser(user);
      if (!user) {
        setCurrentUser(defaultUser);
        setPredictions([]);
        setKnockoutPredictions({});
        setAuthLoading(false);
        return;
      }

      setCurrentUser({
        userId: user.id,
        userName: (user.user_metadata?.user_name as string) || user.email || "You",
        avatar: (user.user_metadata?.avatar as string) || "⚽",
        predictions: [],
        totalPoints: 0,
      });

      const { data, error } = await supabase
        .from("predictions")
        .select("match_id, home_score, away_score, predicted_winner")
        .eq("user_id", user.id);

      if (!error && data) {
        const groupPreds: Prediction[] = [];
        const knockoutPicks: { [matchId: string]: string } = {};
        for (const row of data) {
          if (row.home_score !== null && row.away_score !== null) {
            groupPreds.push({
              matchId: row.match_id,
              homeScore: row.home_score,
              awayScore: row.away_score,
              predictedWinner: row.predicted_winner,
            });
          } else if (row.predicted_winner) {
            knockoutPicks[row.match_id] = row.predicted_winner;
          }
        }
        setPredictions(groupPreds);
        setKnockoutPredictions(knockoutPicks);
      }
      setAuthLoading(false);
    };

    supabase.auth.getUser().then(({ data }) => loadForUser(data.user));

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      loadForUser(session?.user ?? null);
    });

    return () => subscription.subscription.unsubscribe();
  }, [supabase]);

  const setPrediction = useCallback((matchId: string, homeScore: number, awayScore: number) => {
    const match = [...GROUP_MATCHES, ...KNOCKOUT_MATCHES].find((m) => m.id === matchId);
    let predictedWinner: string | null = null;
    if (match?.homeTeam && match?.awayTeam) {
      if (homeScore > awayScore) predictedWinner = match.homeTeam.id;
      else if (awayScore > homeScore) predictedWinner = match.awayTeam.id;
      else predictedWinner = "draw";
    }
    const newPred: Prediction = { matchId, homeScore, awayScore, predictedWinner };

    setPredictions((prev) => {
      const existing = prev.findIndex((p) => p.matchId === matchId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newPred;
        return updated;
      }
      return [...prev, newPred];
    });

    if (authUser) {
      supabase
        .from("predictions")
        .upsert(
          {
            user_id: authUser.id,
            match_id: matchId,
            home_score: homeScore,
            away_score: awayScore,
            predicted_winner: predictedWinner,
          },
          { onConflict: "user_id,match_id" }
        )
        .then(({ error }) => {
          if (error) console.error("Failed to save prediction", error);
        });
    }
  }, [authUser, supabase]);

  const setKnockoutPrediction = useCallback((matchId: string, winnerId: string) => {
    setKnockoutPredictions((prev) => ({ ...prev, [matchId]: winnerId }));

    if (authUser) {
      supabase
        .from("predictions")
        .upsert(
          {
            user_id: authUser.id,
            match_id: matchId,
            home_score: null,
            away_score: null,
            predicted_winner: winnerId,
          },
          { onConflict: "user_id,match_id" }
        )
        .then(({ error }) => {
          if (error) console.error("Failed to save prediction", error);
        });
    }
  }, [authUser, supabase]);

  const createLeague = useCallback((name: string): League => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newLeague: League = {
      id: `league_${Date.now()}`,
      name,
      code,
      members: [currentUser],
      createdBy: currentUser.userId,
    };
    setLeagues((prev) => [...prev, newLeague]);
    return newLeague;
  }, [currentUser]);

  const joinLeague = useCallback((code: string): League | null => {
    const league = leagues.find((l) => l.code.toUpperCase() === code.toUpperCase());
    if (!league) return null;
    setLeagues((prev) =>
      prev.map((l) =>
        l.id === league.id
          ? { ...l, members: l.members.some((m) => m.userId === currentUser.userId) ? l.members : [...l.members, currentUser] }
          : l
      )
    );
    return league;
  }, [leagues, currentUser]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  const updateUserName = useCallback((name: string) => {
    setCurrentUser((prev) => ({ ...prev, userName: name }));
    if (authUser) {
      supabase.auth.updateUser({ data: { user_name: name } }).then(({ error }) => {
        if (error) console.error("Failed to update name", error);
      });
    }
  }, [authUser, supabase]);

  const getTotalPoints = useCallback(() => {
    return actualResults.reduce((total, result) => {
      const pred = predictions.find((p) => p.matchId === result.matchId);
      if (!pred) return total;
      return total + calculatePoints(pred, result);
    }, 0);
  }, [predictions, actualResults]);

  const getLeaderboard = useCallback((leagueId?: string) => {
    const league = leagues.find((l) => l.id === (leagueId ?? "global"));
    if (!league) return [];
    const userWithPoints: UserPredictions = { ...currentUser, totalPoints: getTotalPoints() };
    return league.members
      .map((m) => (m.userId === currentUser.userId ? userWithPoints : m))
      .sort((a, b) => b.totalPoints - a.totalPoints);
  }, [leagues, currentUser, getTotalPoints]);

  return (
    <TournamentContext.Provider
      value={{
        currentUser,
        authUser,
        authLoading,
        predictions,
        knockoutPredictions,
        leagues,
        actualResults,
        setPrediction,
        setKnockoutPrediction,
        createLeague,
        joinLeague,
        logout,
        updateUserName,
        getLeaderboard,
        getTotalPoints,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  const ctx = useContext(TournamentContext);
  if (!ctx) throw new Error("useTournament must be used within TournamentProvider");
  return ctx;
}
