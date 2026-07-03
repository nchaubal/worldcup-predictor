import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Database types
export interface Profile {
  id: string;
  username: string;
  avatar: string;
  created_at: string;
  updated_at: string;
}

export interface League {
  id: string;
  name: string;
  code: string;
  creator_id: string;
  created_at: string;
  updated_at: string;
}

export interface LeagueMember {
  id: string;
  league_id: string;
  user_id: string;
  joined_at: string;
}

export interface GroupPrediction {
  id: string;
  user_id: string;
  match_id: string;
  home_score: number;
  away_score: number;
  predicted_winner: string;
  created_at: string;
  updated_at: string;
}

export interface KnockoutPrediction {
  id: string;
  user_id: string;
  match_id: string;
  winner_team_id: string;
  created_at: string;
  updated_at: string;
}

export interface MatchResult {
  id: string;
  match_id: string;
  home_score: number;
  away_score: number;
  actual_winner: string;
  completed_at: string | null;
  created_at: string;
}

export interface UserPoints {
  id: string;
  user_id: string;
  league_id: string;
  total_points: number;
  exact_predictions: number;
  margin_predictions: number;
  result_predictions: number;
  prediction_predictions: number;
  last_calculated_at: string;
  profiles: {
    id: string;
    username: string;
    avatar: string;
  };
}

export interface PredictionPrediction {
  id: string;
  predictor_user_id: string;
  predicted_user_id: string;
  match_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
  created_at: string;
  updated_at: string;
}

// Helper functions for database operations
export class SupabaseService {
  private static checkSupabase() {
    if (!supabase) {
      throw new Error('Supabase client not initialized. Please check environment variables.');
    }
  }

  // Profile operations
  static async getProfile(userId: string): Promise<Profile | null> {
    this.checkSupabase();
    const { data, error } = await supabase!
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    // PGRST116 = no rows found, which is fine for getProfile
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async createProfile(userId: string, username: string, avatar: string = '⚽'): Promise<Profile> {
    this.checkSupabase();
    console.log('[createProfile] Creating profile', { userId, username, avatar });
    
    const { data, error } = await supabase!
      .from('profiles')
      .insert({ id: userId, username, avatar })
      .select()
      .single();
    
    if (error) {
      console.error('[createProfile] Failed', { code: error.code, message: error.message, details: error.details });
      throw error;
    }
    
    console.log('[createProfile] Success', data);
    return data;
  }

  static async getOrCreateProfile(userId: string, username: string, avatar: string = '⚽'): Promise<Profile> {
    this.checkSupabase();
    
    // Try to get existing profile
    const existing = await this.getProfile(userId);
    if (existing) {
      console.log('[getOrCreateProfile] Found existing profile', existing);
      return existing;
    }
    
    // Create new profile
    console.log('[getOrCreateProfile] No profile found, creating new one');
    return this.createProfile(userId, username, avatar);
  }

  static async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    this.checkSupabase();
    const { data, error } = await supabase!
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // League operations
  static async getLeagues(userId: string): Promise<League[]> {
    this.checkSupabase();
    // "Anyone can view leagues" RLS is intentionally permissive (so a league
    // code can be looked up to join), but that means an unfiltered `leagues`
    // select returns every league in the system, not just the user's own.
    // Scope to leagues this user is actually a member of via league_members.
    const { data, error } = await supabase!
      .from('league_members')
      .select('leagues(*)')
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });

    if (error) throw error;
    return ((data as any[]) || []).map((row) => row.leagues).filter(Boolean);
  }

  static async createLeague(name: string, createdBy: string): Promise<League> {
    this.checkSupabase();
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    console.log('[createLeague] Starting league creation', { name, code, createdBy });
    
    const { data, error } = await supabase!
      .from('leagues')
      .insert({ name, code, creator_id: createdBy })
      .select()
      .single();
    
    if (error) {
      console.error('[createLeague] Failed to insert league', { 
        errorCode: error.code, 
        errorMessage: error.message, 
        errorDetails: error.details,
        errorHint: error.hint 
      });
      throw error;
    }
    
    console.log('[createLeague] League created successfully', { leagueId: data.id, code: data.code });
    
    // Add creator as member
    try {
      await this.joinLeague(data.id, createdBy);
      console.log('[createLeague] Creator added as member');
    } catch (joinError) {
      console.error('[createLeague] Failed to add creator as member', joinError);
      throw joinError;
    }
    
    return data;
  }

  static async joinLeague(leagueId: string, userId: string): Promise<void> {
    this.checkSupabase();
    console.log('[joinLeague] Joining league', { leagueId, userId });
    
    const { error } = await supabase!
      .from('league_members')
      .insert({ league_id: leagueId, user_id: userId });
    
    if (error) {
      console.error('[joinLeague] Failed to join league', {
        errorCode: error.code,
        errorMessage: error.message,
        errorDetails: error.details,
        errorHint: error.hint
      });
      throw error;
    }
    console.log('[joinLeague] Successfully joined league');
  }

  static async getLeagueByCode(code: string): Promise<League | null> {
    this.checkSupabase();
    const { data, error } = await supabase!
      .from('leagues')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async getLeagueMembers(leagueId: string): Promise<Profile[]> {
    this.checkSupabase();
    const { data, error } = await supabase!
      .from('league_members')
      .select('profiles!inner(*)')
      .eq('league_id', leagueId);
    
    if (error) throw error;
    return (data as any[])?.map(member => member.profiles) || [];
  }

  // Prediction operations
  static async getGroupPredictions(userId: string): Promise<GroupPrediction[]> {
    this.checkSupabase();
    const { data, error } = await supabase!
      .from('group_predictions')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data || [];
  }

  static async upsertGroupPrediction(
    userId: string, 
    matchId: string, 
    homeScore: number, 
    awayScore: number, 
    predictedWinner: string
  ): Promise<GroupPrediction> {
    this.checkSupabase();
    const { data, error } = await supabase!
      .from('group_predictions')
      .upsert({
        user_id: userId,
        match_id: matchId,
        home_score: homeScore,
        away_score: awayScore,
        predicted_winner: predictedWinner
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getKnockoutPredictions(userId: string): Promise<KnockoutPrediction[]> {
    this.checkSupabase();
    const { data, error } = await supabase!
      .from('knockout_predictions')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data || [];
  }

  static async upsertKnockoutPrediction(
    userId: string, 
    matchId: string, 
    winnerTeamId: string
  ): Promise<KnockoutPrediction> {
    this.checkSupabase();
    const { data, error } = await supabase!
      .from('knockout_predictions')
      .upsert({
        user_id: userId,
        match_id: matchId,
        winner_team_id: winnerTeamId
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Analytics operations
  static async getUserPoints(leagueId: string): Promise<UserPoints[]> {
    this.checkSupabase();
    const { data, error } = await supabase!
      .from('user_points')
      .select(`
        *,
        profiles!inner (
          id,
          username,
          avatar
        )
      `)
      .eq('league_id', leagueId)
      .order('total_points', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async calculateUserPoints(userId: string, leagueId: string): Promise<number> {
    this.checkSupabase();
    const { data, error } = await supabase!
      .rpc('calculate_user_points', { 
        p_user_id: userId, 
        p_league_id: leagueId 
      });
    
    if (error) throw error;
    return data || 0;
  }

  // Auth helpers
  static async signIn(email: string, password: string) {
    this.checkSupabase();
    const { data, error } = await supabase!.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  }

  static async signUp(email: string, password: string, username: string) {
    this.checkSupabase();
    console.log('[signUp] Starting signup', { email, username });
    
    const { data, error } = await supabase!.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });
    
    if (error) {
      console.error('[signUp] Auth signup failed', error);
      throw error;
    }
    
    // The on_auth_user_created DB trigger already creates a matching profiles
    // row (via SECURITY DEFINER, bypassing RLS) as part of the signup
    // transaction. getOrCreateProfile checks for that row first (a plain
    // SELECT, permitted by RLS) instead of blindly re-inserting, since a
    // direct INSERT here has no RLS policy allowing it and would always fail.
    if (data.user) {
      console.log('[signUp] Auth user created, ensuring profile exists', { userId: data.user.id });
      await this.getOrCreateProfile(data.user.id, username);
      console.log('[signUp] Profile ready');
    }
    
    return data;
  }

  static async signOut() {
    this.checkSupabase();
    const { error } = await supabase!.auth.signOut();
    if (error) throw error;
  }

  static async getCurrentUser() {
    this.checkSupabase();
    const { data: { user } } = await supabase!.auth.getUser();
    return user;
  }

  static onAuthStateChange(callback: (event: string, session: any) => void) {
    this.checkSupabase();
    return supabase!.auth.onAuthStateChange(callback);
  }

  // Prediction predictions operations
  static async getPredictionPredictions(predictorUserId: string): Promise<PredictionPrediction[]> {
    this.checkSupabase();
    const { data, error } = await supabase!
      .from('prediction_predictions')
      .select('*')
      .eq('predictor_user_id', predictorUserId);
    
    if (error) throw error;
    return data || [];
  }

  static async upsertPredictionPrediction(
    predictorUserId: string,
    predictedUserId: string,
    matchId: string,
    homeScore: number,
    awayScore: number
  ): Promise<PredictionPrediction> {
    this.checkSupabase();
    const { data, error } = await supabase!
      .from('prediction_predictions')
      .upsert({
        predictor_user_id: predictorUserId,
        predicted_user_id: predictedUserId,
        match_id: matchId,
        predicted_home_score: homeScore,
        predicted_away_score: awayScore
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deletePredictionPrediction(
    predictorUserId: string,
    predictedUserId: string,
    matchId: string
  ): Promise<void> {
    this.checkSupabase();
    const { error } = await supabase!
      .from('prediction_predictions')
      .delete()
      .eq('predictor_user_id', predictorUserId)
      .eq('predicted_user_id', predictedUserId)
      .eq('match_id', matchId);
    
    if (error) throw error;
  }

  static async getPredictionsForUser(predictedUserId: string): Promise<PredictionPrediction[]> {
    this.checkSupabase();
    const { data, error } = await supabase!
      .from('prediction_predictions')
      .select('*')
      .eq('predicted_user_id', predictedUserId);
    
    if (error) throw error;
    return data || [];
  }
}
