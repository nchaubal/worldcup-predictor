"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Prediction, UserPredictions, League, GROUP_MATCHES, KNOCKOUT_MATCHES, Match, Team } from "@/lib/tournament-data";
import { calculatePoints } from "@/lib/ai-predictor";

type ActualResult = {
  matchId: string;
  homeScore: number;
  awayScore: number;
};

type TournamentContextType = {
  currentUser: UserPredictions;
  predictions: Prediction[];
  knockoutPredictions: { [matchId: string]: string };
  leagues: League[];
  actualResults: ActualResult[];
  setPrediction: (matchId: string, homeScore: number, awayScore: number) => void;
  setKnockoutPrediction: (matchId: string, winnerId: string) => void;
  createLeague: (name: string) => League;
  joinLeague: (code: string) => League | null;
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

  const setPrediction = useCallback((matchId: string, homeScore: number, awayScore: number) => {
    setPredictions((prev) => {
      const existing = prev.findIndex((p) => p.matchId === matchId);
      const match = [...GROUP_MATCHES, ...KNOCKOUT_MATCHES].find((m) => m.id === matchId);
      let predictedWinner: string | null = null;
      if (match?.homeTeam && match?.awayTeam) {
        if (homeScore > awayScore) predictedWinner = match.homeTeam.id;
        else if (awayScore > homeScore) predictedWinner = match.awayTeam.id;
        else predictedWinner = "draw";
      }
      const newPred: Prediction = { matchId, homeScore, awayScore, predictedWinner };
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newPred;
        return updated;
      }
      return [...prev, newPred];
    });
  }, []);

  const setKnockoutPrediction = useCallback((matchId: string, winnerId: string) => {
    setKnockoutPredictions((prev) => ({ ...prev, [matchId]: winnerId }));
  }, []);

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

  const updateUserName = useCallback((name: string) => {
    setCurrentUser((prev) => ({ ...prev, userName: name }));
  }, []);

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
        predictions,
        knockoutPredictions,
        leagues,
        actualResults,
        setPrediction,
        setKnockoutPrediction,
        createLeague,
        joinLeague,
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
