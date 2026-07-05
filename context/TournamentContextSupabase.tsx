"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { Prediction, UserPredictions, GROUP_MATCHES, KNOCKOUT_MATCHES } from "@/lib/tournament-data";
import { SupabaseService, Profile } from "@/lib/supabase";
import { MOCK_USERS } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";
import { 
  calculateTotalPoints, 
  type UserPrediction as PointsUserPrediction,
  type MatchResult as PointsMatchResult 
} from "@/lib/points-calculator";

// Extended result type that includes ET and penalty data
type ExtendedMatchResult = {
  matchId: string;
  homeScore: number;
  awayScore: number;
  etResult?: string | null;
  penaltyWinner?: string | null;
};

// Calculate points using the new weighted system
const calculatePoints = (predictions: Prediction[], results: ExtendedMatchResult[]) => {
  const predictionInputs: PointsUserPrediction[] = predictions.map(p => ({
    matchId: p.matchId,
    homeScore: p.homeScore,
    awayScore: p.awayScore,
    etResult: p.etResult,
    penaltyWinner: p.penaltyWinner,
  }));
  
  const resultInputs: PointsMatchResult[] = results.map(r => ({
    matchId: r.matchId,
    homeScore: r.homeScore,
    awayScore: r.awayScore,
    etResult: r.etResult || null,
    penaltyWinner: r.penaltyWinner || null,
  }));
  
  const totals = calculateTotalPoints(predictionInputs, resultInputs);
  return totals.total;
};

const calculatePointsWithBreakdown = (predictions: Prediction[], results: ExtendedMatchResult[]) => {
  const predictionInputs: PointsUserPrediction[] = predictions.map(p => ({
    matchId: p.matchId,
    homeScore: p.homeScore,
    awayScore: p.awayScore,
    etResult: p.etResult,
    penaltyWinner: p.penaltyWinner,
  }));
  
  const resultInputs: PointsMatchResult[] = results.map(r => ({
    matchId: r.matchId,
    homeScore: r.homeScore,
    awayScore: r.awayScore,
    etResult: r.etResult || null,
    penaltyWinner: r.penaltyWinner || null,
  }));
  
  const totals = calculateTotalPoints(predictionInputs, resultInputs);
  return { 
    exact: totals.exactScores, 
    margin: totals.correctMargins, 
    result: totals.correctResults,
    etResults: totals.correctEtResults,
    penaltyWinners: totals.correctPenaltyWinners,
    winners: totals.correctWinners,
  };
};

type TournamentContextType = {
  currentUser: UserPredictions | null;
  predictions: Prediction[];
  knockoutPredictions: { [matchId: string]: string };
  knockoutScores: { [matchId: string]: { home: number; away: number } };
  actualResults: { matchId: string; homeScore: number; awayScore: number }[];
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  accessDenied: boolean;
  setPrediction: (matchId: string, homeScore: number, awayScore: number, etResult?: string | null, penaltyWinner?: string | null) => void;
  setKnockoutPrediction: (matchId: string, winnerId: string, homeScore?: number, awayScore?: number) => void;
  updateUserName: (name: string) => void;
  getLeaderboard: () => Promise<UserPredictions[]>;
  getTotalPoints: () => number;
  getPointsBreakdown: () => { total: number; exact: number; margin: number; result: number };
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const TournamentContext = createContext<TournamentContextType | null>(null);

export function TournamentProviderSupabase({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserPredictions | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [knockoutPredictions, setKnockoutPredictions] = useState<{ [matchId: string]: string }>({});
  const [knockoutScores, setKnockoutScores] = useState<{ [matchId: string]: { home: number; away: number } }>({});
  const [actualResults] = useState<{ matchId: string; homeScore: number; awayScore: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // Check if email is in allowlist
  const checkEmailAllowed = async (email: string): Promise<boolean> => {
    try {
      const allowed = await SupabaseService.isEmailAllowed(email);
      return allowed;
    } catch (error) {
      console.error('Error checking email allowlist:', error);
      return false;
    }
  };

  // Define loadUserData before useEffect that uses it
  const loadUserData = async (userId: string, username?: string) => {
    try {
      // Load or create user profile
      const profile = username 
        ? await SupabaseService.getOrCreateProfile(userId, username)
        : await SupabaseService.getProfile(userId);
      
      if (profile) {
        setCurrentUser({
          userId: profile.id,
          userName: profile.username,
          avatar: profile.avatar,
          predictions: [],
          totalPoints: profile.total_points || 0,
        });
        
        // Check admin status
        setIsAdmin(profile.is_admin === true);
      } else {
        console.warn('[loadUserData] No profile found and no username provided to create one');
      }

      // Load predictions
      const groupPreds = await SupabaseService.getGroupPredictions(userId);
      const formattedPredictions: Prediction[] = groupPreds.map(pred => ({
        matchId: pred.match_id,
        homeScore: pred.home_score,
        awayScore: pred.away_score,
        predictedWinner: pred.predicted_winner,
        etResult: pred.et_result || null,
        penaltyWinner: pred.penalty_winner || null,
      }));
      setPredictions(formattedPredictions);

      const knockoutPreds = await SupabaseService.getKnockoutPredictions(userId);
      const formattedKnockout: { [matchId: string]: string } = {};
      const formattedScores: { [matchId: string]: { home: number; away: number } } = {};
      knockoutPreds.forEach(pred => {
        formattedKnockout[pred.match_id] = pred.winner_team_id;
        if (pred.home_score !== null && pred.away_score !== null) {
          formattedScores[pred.match_id] = { home: pred.home_score!, away: pred.away_score! };
        }
      });
      setKnockoutPredictions(formattedKnockout);
      setKnockoutScores(formattedScores);

    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (!supabase) {
          // Fallback to mock data if Supabase is not initialized
          setCurrentUser({
            userId: "user_1",
            userName: "Guest",
            avatar: "⚽",
            predictions: [],
            totalPoints: 0,
          });
          setIsLoading(false);
          return;
        }
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Check if email is allowed
          const isAllowed = await checkEmailAllowed(user.email || '');
          if (!isAllowed) {
            setAccessDenied(true);
            await supabase.auth.signOut();
            setIsLoading(false);
            return;
          }
          
          setIsAuthenticated(true);
          setAccessDenied(false);
          loadUserData(user.id, user.email?.split('@')[0]);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase ? supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Check if email is allowed
        const isAllowed = await checkEmailAllowed(session.user.email || '');
        if (!isAllowed) {
          setAccessDenied(true);
          await supabase!.auth.signOut();
          return;
        }
        
        setIsAuthenticated(true);
        setAccessDenied(false);
        const username = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User';
        loadUserData(session.user.id, username);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setPredictions([]);
        setKnockoutPredictions({});
      }
    }) : { data: { subscription: null } };

    return () => subscription?.unsubscribe();
  }, []);

  const setPrediction = useCallback(async (matchId: string, homeScore: number, awayScore: number, etResult?: string | null, penaltyWinner?: string | null) => {
    console.log('[setPrediction] called', { matchId, homeScore, awayScore, etResult, penaltyWinner, currentUser: currentUser?.userId, isAuthenticated });
    if (!currentUser || !isAuthenticated) {
      console.warn('[setPrediction] bailing out: currentUser=', currentUser, 'isAuthenticated=', isAuthenticated);
      return;
    }

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
        const newPred: Prediction = { 
          matchId, 
          homeScore, 
          awayScore, 
          predictedWinner: predictedWinner || null,
          etResult: etResult || null,
          penaltyWinner: penaltyWinner || null
        };
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
        predictedWinner || 'draw',
        etResult,
        penaltyWinner
      );

    } catch (error) {
      console.error('Error saving prediction:', error);
    }
  }, [currentUser, isAuthenticated]);

  const setKnockoutPrediction = useCallback(async (matchId: string, winnerId: string, homeScore?: number, awayScore?: number) => {
    if (!currentUser || !isAuthenticated) return;

    try {
      // Update local state
      setKnockoutPredictions((prev) => ({ ...prev, [matchId]: winnerId }));
      if (homeScore !== undefined && awayScore !== undefined) {
        setKnockoutScores((prev) => ({ ...prev, [matchId]: { home: homeScore, away: awayScore } }));
      }

      // Save to Supabase
      await SupabaseService.upsertKnockoutPrediction(currentUser.userId, matchId, winnerId, homeScore, awayScore);

    } catch (error) {
      console.error('Error saving knockout prediction:', error);
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
    return calculatePoints(predictions, actualResults);
  }, [predictions, actualResults]);

  const getPointsBreakdown = useCallback(() => {
    if (!currentUser) return { total: 0, exact: 0, margin: 0, result: 0 };
    
    const breakdown = calculatePointsWithBreakdown(predictions, actualResults);
    
    return {
      total: getTotalPoints(),
      exact: breakdown.exact,
      margin: breakdown.margin,
      result: breakdown.result
    };
  }, [currentUser, predictions, actualResults, getTotalPoints]);

  const getLeaderboard = useCallback(async (): Promise<UserPredictions[]> => {
    try {
      // Get all profiles for global leaderboard (already ordered by total_points)
      const profiles = await SupabaseService.getAllProfiles();
      
      // Map profiles to UserPredictions format
      const leaderboard: UserPredictions[] = profiles.map((profile: Profile) => ({
        userId: profile.id,
        userName: profile.username || 'Anonymous',
        avatar: profile.avatar || '⚽',
        predictions: [],
        totalPoints: profile.total_points || 0,
      }));
      
      return leaderboard;

    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
      },
    });
    
    if (error) {
      console.error('Google sign in error:', error);
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
        knockoutScores,
        actualResults,
        isLoading,
        isAuthenticated,
        isAdmin,
        accessDenied,
        setPrediction,
        setKnockoutPrediction,
        updateUserName,
        getLeaderboard,
        getTotalPoints,
        getPointsBreakdown,
        signInWithGoogle,
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
