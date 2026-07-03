"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { Prediction, UserPredictions, League, GROUP_MATCHES, KNOCKOUT_MATCHES, Match, Team } from "@/lib/tournament-data";
import { calculatePoints, calculatePointsWithBreakdown } from "@/lib/ai-predictor";
import { SupabaseService, Profile, GroupPrediction, KnockoutPrediction, UserPoints, PredictionPrediction } from "@/lib/supabase";
import { MOCK_USERS, MOCK_LEAGUE, generateMockPredictions } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";

type TournamentContextType = {
  currentUser: UserPredictions | null;
  predictions: Prediction[];
  knockoutPredictions: { [matchId: string]: string };
  predictionPredictions: PredictionPrediction[];
  leagues: League[];
  actualResults: { matchId: string; homeScore: number; awayScore: number }[];
  isLoading: boolean;
  isAuthenticated: boolean;
  setPrediction: (matchId: string, homeScore: number, awayScore: number) => void;
  setKnockoutPrediction: (matchId: string, winnerId: string) => void;
  setPredictionPrediction: (predictedUserId: string, matchId: string, homeScore: number, awayScore: number) => void;
  deletePredictionPrediction: (predictedUserId: string, matchId: string) => void;
  createLeague: (name: string) => Promise<League>;
  joinLeague: (code: string) => Promise<League | null>;
  updateUserName: (name: string) => void;
  getLeaderboard: (leagueId?: string) => Promise<UserPredictions[]>;
  getTotalPoints: () => number;
  getPointsBreakdown: () => { total: number; exact: number; margin: number; result: number; prediction: number };
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const TournamentContext = createContext<TournamentContextType | null>(null);

export function TournamentProviderSupabase({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserPredictions | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [knockoutPredictions, setKnockoutPredictions] = useState<{ [matchId: string]: string }>({});
  const [predictionPredictions, setPredictionPredictions] = useState<PredictionPrediction[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [actualResults] = useState<{ matchId: string; homeScore: number; awayScore: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (!supabase) {
          // Fallback to mock data if Supabase is not initialized
          setLeagues([MOCK_LEAGUE]);
          setCurrentUser({
            userId: "user_1",
            userName: "You",
            avatar: "⚽",
            predictions: [],
            totalPoints: 0,
          });
          setIsLoading(false);
          return;
        }
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setIsAuthenticated(true);
          await loadUserData(user.id);
        } else {
          // Use mock data as fallback
          setLeagues([MOCK_LEAGUE]);
          setCurrentUser({
            userId: "user_1",
            userName: "You",
            avatar: "⚽",
            predictions: [],
            totalPoints: 0,
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Fallback to mock data
        setLeagues([MOCK_LEAGUE]);
        setCurrentUser({
          userId: "user_1",
          userName: "You",
          avatar: "⚽",
          predictions: [],
          totalPoints: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase ? supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setIsAuthenticated(true);
        await loadUserData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setPredictions([]);
        setKnockoutPredictions({});
        setLeagues([]);
      }
    }) : { data: { subscription: null } };

    return () => subscription?.unsubscribe();
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      // Load user profile
      const profile = await SupabaseService.getProfile(userId);
      if (profile) {
        setCurrentUser({
          userId: profile.id,
          userName: profile.username,
          avatar: profile.avatar,
          predictions: [],
          totalPoints: 0,
        });
      }

      // Load user's leagues
      const userLeagues = await SupabaseService.getLeagues();
      const convertedLeagues: League[] = userLeagues.map(league => ({
        id: league.id,
        name: league.name,
        code: league.code,
        members: [], // Will be loaded separately
        createdBy: league.creator_id,
      }));
      setLeagues(convertedLeagues);

      // Load predictions
      const groupPreds = await SupabaseService.getGroupPredictions(userId);
      const formattedPredictions: Prediction[] = groupPreds.map(pred => ({
        matchId: pred.match_id,
        homeScore: pred.home_score,
        awayScore: pred.away_score,
        predictedWinner: pred.predicted_winner,
      }));
      setPredictions(formattedPredictions);

      const knockoutPreds = await SupabaseService.getKnockoutPredictions(userId);
      const formattedKnockout: { [matchId: string]: string } = {};
      knockoutPreds.forEach(pred => {
        formattedKnockout[pred.match_id] = pred.winner_team_id;
      });
      setKnockoutPredictions(formattedKnockout);

      // Load prediction predictions
      const predPreds = await SupabaseService.getPredictionPredictions(userId);
      setPredictionPredictions(predPreds);

    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const setPrediction = useCallback(async (matchId: string, homeScore: number, awayScore: number) => {
    if (!currentUser || !isAuthenticated) return;

    try {
      const match = [...GROUP_MATCHES, ...KNOCKOUT_MATCHES].find((m) => m.id === matchId);
      let predictedWinner: string | null = null;
      if (match?.homeTeam && match?.awayTeam) {
        if (homeScore > awayScore) predictedWinner = match.homeTeam.id;
        else if (awayScore > homeScore) predictedWinner = match.awayTeam.id;
        else predictedWinner = "draw";
      }

      // Update local state
      setPredictions((prev) => {
        const existing = prev.findIndex((p) => p.matchId === matchId);
        const newPred: Prediction = { matchId, homeScore, awayScore, predictedWinner: predictedWinner || null };
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = newPred;
          return updated;
        }
        return [...prev, newPred];
      });

      // Save to Supabase
      await SupabaseService.upsertGroupPrediction(
        currentUser.userId,
        matchId,
        homeScore,
        awayScore,
        predictedWinner || 'draw'
      );

    } catch (error) {
      console.error('Error saving prediction:', error);
    }
  }, [currentUser, isAuthenticated]);

  const setKnockoutPrediction = useCallback(async (matchId: string, winnerId: string) => {
    if (!currentUser || !isAuthenticated) return;

    try {
      // Update local state
      setKnockoutPredictions((prev) => ({ ...prev, [matchId]: winnerId }));

      // Save to Supabase
      await SupabaseService.upsertKnockoutPrediction(currentUser.userId, matchId, winnerId);

    } catch (error) {
      console.error('Error saving knockout prediction:', error);
    }
  }, [currentUser, isAuthenticated]);

  const setPredictionPrediction = useCallback(async (predictedUserId: string, matchId: string, homeScore: number, awayScore: number) => {
    if (!currentUser || !isAuthenticated || currentUser.userId === predictedUserId) return;

    try {
      // Save to Supabase
      const newPredPred = await SupabaseService.upsertPredictionPrediction(
        currentUser.userId,
        predictedUserId,
        matchId,
        homeScore,
        awayScore
      );

      // Update local state
      setPredictionPredictions(prev => {
        const existing = prev.findIndex(p => 
          p.predictor_user_id === currentUser.userId && 
          p.predicted_user_id === predictedUserId && 
          p.match_id === matchId
        );
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = newPredPred;
          return updated;
        }
        return [...prev, newPredPred];
      });

    } catch (error) {
      console.error('Error saving prediction prediction:', error);
    }
  }, [currentUser, isAuthenticated]);

  const deletePredictionPrediction = useCallback(async (predictedUserId: string, matchId: string) => {
    if (!currentUser || !isAuthenticated) return;

    try {
      // Delete from Supabase
      await SupabaseService.deletePredictionPrediction(currentUser.userId, predictedUserId, matchId);

      // Update local state
      setPredictionPredictions(prev => 
        prev.filter(p => 
          !(p.predictor_user_id === currentUser.userId && 
            p.predicted_user_id === predictedUserId && 
            p.match_id === matchId)
        )
      );

    } catch (error) {
      console.error('Error deleting prediction prediction:', error);
    }
  }, [currentUser, isAuthenticated]);

  const createLeague = useCallback(async (name: string): Promise<League> => {
    console.log('[Context.createLeague] Called with', { 
      name, 
      currentUser: currentUser?.userId, 
      isAuthenticated 
    });
    
    if (!currentUser || !isAuthenticated) {
      console.log('[Context.createLeague] Not authenticated, returning mock league');
      return MOCK_LEAGUE;
    }

    try {
      console.log('[Context.createLeague] Calling SupabaseService.createLeague');
      const newLeague = await SupabaseService.createLeague(name, currentUser.userId);
      console.log('[Context.createLeague] League created', newLeague);
      
      const convertedLeague: League = {
        id: newLeague.id,
        name: newLeague.name,
        code: newLeague.code,
        members: [], // Will be loaded separately
        createdBy: newLeague.creator_id,
      };
      setLeagues(prev => [convertedLeague, ...prev]);
      return convertedLeague;
    } catch (error: any) {
      console.error('[Context.createLeague] Error:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack
      });
      throw error;
    }
  }, [currentUser, isAuthenticated]);

  const joinLeague = useCallback(async (code: string): Promise<League | null> => {
    if (!currentUser || !isAuthenticated) {
      // Return mock league for demo
      return code.toUpperCase() === MOCK_LEAGUE.code ? MOCK_LEAGUE : null;
    }

    try {
      const league = await SupabaseService.getLeagueByCode(code);
      if (league) {
        await SupabaseService.joinLeague(league.id, currentUser.userId);
        const convertedLeague: League = {
          id: league.id,
          name: league.name,
          code: league.code,
          members: [], // Will be loaded separately
          createdBy: league.creator_id,
        };
        setLeagues(prev => [...prev.filter(l => l.id !== league.id), convertedLeague]);
        return convertedLeague;
      }
      return null;
    } catch (error) {
      console.error('Error joining league:', error);
      return null;
    }
  }, [currentUser, isAuthenticated]);

  const updateUserName = useCallback(async (name: string) => {
    if (!currentUser || !isAuthenticated) return;

    try {
      await SupabaseService.updateProfile(currentUser.userId, { username: name });
      setCurrentUser(prev => prev ? { ...prev, userName: name } : null);
    } catch (error) {
      console.error('Error updating username:', error);
    }
  }, [currentUser, isAuthenticated]);

  const getTotalPoints = useCallback(() => {
    return actualResults.reduce((total, result) => {
      const pred = predictions.find((p) => p.matchId === result.matchId);
      if (!pred) return total;
      return total + calculatePoints(pred, result);
    }, 0);
  }, [predictions, actualResults]);

  const getPointsBreakdown = useCallback(() => {
    if (!currentUser) return { total: 0, exact: 0, margin: 0, result: 0, prediction: 0 };
    
    // Calculate breakdown based on predictions and actual results
    let exact = 0, margin = 0, result = 0, prediction = 0;
    
    predictions.forEach(pred => {
      const actual = actualResults.find(r => r.matchId === pred.matchId);
      if (actual) {
        const breakdown = calculatePointsWithBreakdown(pred, actual);
        if (breakdown.breakdown.exactScore) exact++;
        else if (breakdown.breakdown.correctMargin) margin++;
        else if (breakdown.breakdown.correctResult) result++;
      }
    });
    
    // Count prediction predictions
    prediction = predictionPredictions.length;
    
    return {
      total: getTotalPoints(),
      exact,
      margin,
      result,
      prediction
    };
  }, [currentUser, predictions, actualResults, predictionPredictions, getTotalPoints]);

  const getLeaderboard = useCallback(async (leagueId?: string): Promise<UserPredictions[]> => {
    if (!isAuthenticated || !currentUser) {
      // Return mock data for demo
      return MOCK_USERS.sort((a, b) => b.totalPoints - a.totalPoints);
    }

    try {
      const targetLeagueId = leagueId || leagues[0]?.id;
      if (!targetLeagueId) return [];

      const userPoints = await SupabaseService.getUserPoints(targetLeagueId);
      
      return userPoints.map(up => ({
        userId: up.user_id,
        userName: up.profiles.username,
        avatar: up.profiles.avatar,
        predictions: [],
        totalPoints: up.total_points,
      })).sort((a, b) => b.totalPoints - a.totalPoints);

    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }, [isAuthenticated, currentUser, leagues]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      await SupabaseService.signIn(email, password);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, username: string) => {
    try {
      await SupabaseService.signUp(email, password, username);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await SupabaseService.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }, []);

  return (
    <TournamentContext.Provider
      value={{
        currentUser,
        predictions,
        knockoutPredictions,
        predictionPredictions,
        leagues,
        actualResults,
        isLoading,
        isAuthenticated,
        setPrediction,
        setKnockoutPrediction,
        setPredictionPrediction,
        deletePredictionPrediction,
        createLeague,
        joinLeague,
        updateUserName,
        getLeaderboard,
        getTotalPoints,
        getPointsBreakdown,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournamentSupabase() {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error("useTournamentSupabase must be used within TournamentProviderSupabase");
  }
  return context;
}
