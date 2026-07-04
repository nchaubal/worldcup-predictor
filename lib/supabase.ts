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
  is_admin?: boolean;
  total_points?: number;
  exact_scores?: number;
  correct_margins?: number;
  correct_results?: number;
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
  knockout_winner?: string | null; // DEPRECATED
  et_result?: string | null; // 'home', 'away', or 'draw' - required if 90min is draw
  penalty_winner?: string | null; // 'home' or 'away' - required if ET is draw
  created_at: string;
  updated_at: string;
}

export interface KnockoutPrediction {
  id: string;
  user_id: string;
  match_id: string;
  winner_team_id: string;
  home_score?: number | null;
  away_score?: number | null;
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
    return ((data as unknown as { leagues: League }[]) || []).map((row) => row.leagues).filter(Boolean);
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
    // Avoid PostgREST's automatic FK-based embedding here: the live
    // league_members.user_id -> profiles relationship isn't detected in the
    // schema cache (even though league_members.league_id -> leagues is), so
    // fetch member ids and profiles as two plain queries instead.
    const { data: members, error: membersError } = await supabase!
      .from('league_members')
      .select('user_id')
      .eq('league_id', leagueId);

    if (membersError) throw membersError;
    const userIds = ((members as { user_id: string }[]) || []).map((m) => m.user_id);
    if (userIds.length === 0) return [];

    const { data: profiles, error: profilesError } = await supabase!
      .from('profiles')
      .select('*')
      .in('id', userIds);

    if (profilesError) throw profilesError;
    return profiles || [];
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

  static async getUserGroupPredictions(userId: string): Promise<GroupPrediction[]> {
    this.checkSupabase();
    const { data, error } = await supabase!
      .from('group_predictions')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data || [];
  }

  static async getUserKnockoutPredictions(userId: string): Promise<KnockoutPrediction[]> {
    this.checkSupabase();
    const { data, error } = await supabase!
      .from('knockout_predictions')
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
    predictedWinner: string,
    etResult?: string | null, // 'home', 'away', or 'draw' - required if 90min is draw
    penaltyWinner?: string | null // 'home' or 'away' - required if ET is draw
  ): Promise<GroupPrediction | null> {
    this.checkSupabase();

    // Check if prediction exists
    const { data: existing } = await supabase!
      .from('group_predictions')
      .select('id')
      .eq('user_id', userId)
      .eq('match_id', matchId)
      .maybeSingle();

    if (existing) {
      // Update existing prediction
      const { data, error, status, statusText } = await supabase!
        .from('group_predictions')
        .update({
          home_score: homeScore,
          away_score: awayScore,
          predicted_winner: predictedWinner,
          et_result: etResult || null,
          penalty_winner: penaltyWinner || null
        })
        .eq('user_id', userId)
        .eq('match_id', matchId)
        .select()
        .single();

      if (error) {
        console.error('Error updating prediction:', { error, status, statusText, code: error.code, message: error.message, details: error.details });
        throw error;
      }
      return data;
    } else {
      // Insert new prediction
      const { data, error, status, statusText } = await supabase!
        .from('group_predictions')
        .insert({
          user_id: userId,
          match_id: matchId,
          home_score: homeScore,
          away_score: awayScore,
          predicted_winner: predictedWinner,
          et_result: etResult || null,
          penalty_winner: penaltyWinner || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting prediction:', { error, status, statusText, code: error.code, message: error.message, details: error.details });
        throw error;
      }
      return data;
    }
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
    winnerTeamId: string,
    homeScore?: number | null,
    awayScore?: number | null
  ): Promise<KnockoutPrediction> {
    this.checkSupabase();
    const { data, error } = await supabase!
      .from('knockout_predictions')
      .upsert({
        user_id: userId,
        match_id: matchId,
        winner_team_id: winnerTeamId,
        home_score: homeScore ?? null,
        away_score: awayScore ?? null
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

  static onAuthStateChange(callback: (event: string, session: { user?: { id: string; email?: string; user_metadata?: { username?: string } } } | null) => void) {
    this.checkSupabase();
    return supabase!.auth.onAuthStateChange(callback);
  }

  // Email allowlist operations
  static async isEmailAllowed(email: string): Promise<boolean> {
    this.checkSupabase();
    
    // First check if the allowed_emails table exists
    const { data, error } = await supabase!
      .from('allowed_emails')
      .select('email')
      .eq('email', email.toLowerCase())
      .single();
    
    // If table doesn't exist (42P01) or any other error, allow all emails for now
    // This makes the allowlist optional until it's set up
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - email not in allowlist
        // For now, return true to allow all emails until allowlist is configured
        console.log('Email not in allowlist, but allowing for now:', email);
        return true;
      }
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        // Table doesn't exist - allow all emails
        console.log('allowed_emails table not found, allowing all emails');
        return true;
      }
      // For any other error, log and allow (fail open for now)
      console.warn('Error checking allowlist, allowing email:', error);
      return true;
    }
    
    return !!data;
  }

  // Get all profiles for global leaderboard (ordered by points)
  static async getAllProfiles(): Promise<Profile[]> {
    this.checkSupabase();
    
    // First try with total_points ordering (if column exists)
    const { data, error } = await supabase!
      .from('profiles')
      .select('id, username, avatar, is_admin, total_points, exact_scores, correct_margins, correct_results, created_at, updated_at')
      .not('username', 'is', null);
    
    if (error) {
      // If error (e.g., column doesn't exist), try basic query
      console.warn('Error fetching profiles with points, trying basic query:', error.message);
      const { data: basicData, error: basicError } = await supabase!
        .from('profiles')
        .select('id, username, avatar, created_at, updated_at')
        .not('username', 'is', null);
      
      if (basicError) throw basicError;
      return (basicData || []).map(p => ({ ...p, total_points: 0 })) as Profile[];
    }
    
    // Sort by total_points (handle null values)
    const sorted = (data || []).sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
    return sorted as Profile[];
  }

  // Check if user is admin
  static async isUserAdmin(userId: string): Promise<boolean> {
    this.checkSupabase();
    const { data, error } = await supabase!
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();
    
    if (error) return false;
    return data?.is_admin === true;
  }

  // Admin: Add allowed email
  static async addAllowedEmail(email: string): Promise<void> {
    this.checkSupabase();
    const { error } = await supabase!
      .from('allowed_emails')
      .insert({ email: email.toLowerCase() });
    
    if (error && error.code !== '23505') { // Ignore duplicate key error
      throw error;
    }
  }

  // Admin: Get all allowed emails
  static async getAllowedEmails(): Promise<string[]> {
    this.checkSupabase();
    const { data, error } = await supabase!
      .from('allowed_emails')
      .select('email')
      .order('email');
    
    if (error) throw error;
    return (data || []).map(d => d.email);
  }

  // Admin: Remove allowed email
  static async removeAllowedEmail(email: string): Promise<void> {
    this.checkSupabase();
    const { error } = await supabase!
      .from('allowed_emails')
      .delete()
      .eq('email', email.toLowerCase());
    
    if (error) throw error;
  }

  // Admin: Add prediction for another user
  static async adminAddPrediction(
    adminId: string,
    targetUserId: string,
    matchId: string,
    homeScore: number,
    awayScore: number,
    reason?: string
  ): Promise<void> {
    this.checkSupabase();
    
    // First verify admin status
    const isAdmin = await this.isUserAdmin(adminId);
    if (!isAdmin) {
      throw new Error('Unauthorized: User is not an admin');
    }

    // Determine predicted winner
    const predictedWinner = homeScore > awayScore ? 'home' : 
                           awayScore > homeScore ? 'away' : 'draw';

    // Add/update the prediction
    const { data: existing } = await supabase!
      .from('group_predictions')
      .select('id')
      .eq('user_id', targetUserId)
      .eq('match_id', matchId)
      .single();

    if (existing) {
      await supabase!
        .from('group_predictions')
        .update({
          home_score: homeScore,
          away_score: awayScore,
          predicted_winner: predictedWinner
        })
        .eq('user_id', targetUserId)
        .eq('match_id', matchId);
    } else {
      await supabase!
        .from('group_predictions')
        .insert({
          user_id: targetUserId,
          match_id: matchId,
          home_score: homeScore,
          away_score: awayScore,
          predicted_winner: predictedWinner
        });
    }

    // Log the admin action
    await supabase!
      .from('admin_prediction_logs')
      .insert({
        admin_id: adminId,
        target_user_id: targetUserId,
        match_id: matchId,
        home_score: homeScore,
        away_score: awayScore,
        reason: reason || 'Admin override'
      });
  }

  // Admin: Add match result (triggers points update via database trigger)
  static async addMatchResult(
    matchId: string,
    homeScore: number,
    awayScore: number
  ): Promise<void> {
    this.checkSupabase();
    
    const actualWinner = homeScore > awayScore ? 'home' : 
                        awayScore > homeScore ? 'away' : 'draw';

    const { error } = await supabase!
      .from('match_results')
      .insert({
        match_id: matchId,
        home_score: homeScore,
        away_score: awayScore,
        actual_winner: actualWinner,
        completed_at: new Date().toISOString()
      });
    
    if (error) throw error;
  }

  // Get all match results
  static async getMatchResults(): Promise<MatchResult[]> {
    this.checkSupabase();
    const { data, error } = await supabase!
      .from('match_results')
      .select('*');
    
    if (error) throw error;
    return data || [];
  }
}
