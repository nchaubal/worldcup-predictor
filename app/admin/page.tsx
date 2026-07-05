"use client";

import { useState, useEffect } from "react";
import { useTournamentSupabase } from "@/context/TournamentContextSupabase";
import { SupabaseService, Profile } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, Users, Mail, Plus, Trash2, Save, 
  AlertTriangle, CheckCircle2, Crown, Edit3 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { syncTournamentWithFootballData } from "@/lib/football-data-sync";
import { useFootballData } from "@/hooks/useFootballData";
import { getTeamById } from "@/lib/tournament-data";

export default function AdminPage() {
  const { currentUser, isAuthenticated, isAdmin } = useTournamentSupabase();
  const { matches: footballMatches, fetchWorldCupMatches } = useFootballData();
  
  const [users, setUsers] = useState<Profile[]>([]);
  const [allowedEmails, setAllowedEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Admin prediction for user
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [predictionMatch, setPredictionMatch] = useState<string | null>(null);
  const [predHome, setPredHome] = useState("");
  const [predAway, setPredAway] = useState("");

  useEffect(() => {
    fetchWorldCupMatches();
  }, [fetchWorldCupMatches]);

  useEffect(() => {
    loadData();
  }, [isAdmin]);

  const loadData = async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    
    try {
      const [profilesData, emailsData] = await Promise.all([
        SupabaseService.getAllProfiles(),
        SupabaseService.getAllowedEmails().catch(() => [])
      ]);
      setUsers(profilesData);
      setAllowedEmails(emailsData);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAddEmail = async () => {
    if (!newEmail.trim()) return;
    try {
      await SupabaseService.addAllowedEmail(newEmail.trim());
      setAllowedEmails(prev => [...prev, newEmail.trim().toLowerCase()]);
      setNewEmail("");
      showMessage('success', 'Email added to allowlist');
    } catch (error) {
      showMessage('error', 'Failed to add email');
    }
  };

  const handleRemoveEmail = async (email: string) => {
    try {
      await SupabaseService.removeAllowedEmail(email);
      setAllowedEmails(prev => prev.filter(e => e !== email));
      showMessage('success', 'Email removed from allowlist');
    } catch (error) {
      showMessage('error', 'Failed to remove email');
    }
  };

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      // This would need a new method in SupabaseService
      // For now, show instructions
      showMessage('error', 'Run SQL: UPDATE profiles SET is_admin = ' + (!currentStatus) + ' WHERE id = \'' + userId + '\'');
    } catch (error) {
      showMessage('error', 'Failed to update admin status');
    }
  };

  const handleAdminPrediction = async () => {
    if (!selectedUser || !predictionMatch || predHome === "" || predAway === "") return;
    
    const homeScore = parseInt(predHome);
    const awayScore = parseInt(predAway);
    
    if (isNaN(homeScore) || isNaN(awayScore)) {
      showMessage('error', 'Invalid scores');
      return;
    }
    
    try {
      await SupabaseService.adminAddPrediction(
        currentUser!.userId,
        selectedUser,
        predictionMatch,
        homeScore,
        awayScore,
        'Admin override - user missed deadline'
      );
      showMessage('success', 'Prediction added for user');
      setSelectedUser(null);
      setPredictionMatch(null);
      setPredHome("");
      setPredAway("");
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to add prediction');
    }
  };

  const syncedTournament = syncTournamentWithFootballData(footballMatches);
  // Only show upcoming matches for admin predictions (can't modify after game concludes)
  const upcomingMatches = syncedTournament.all.filter(m => m.status === "upcoming");

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">Admin Access Required</h2>
            <p className="text-muted-foreground">Please sign in to access the admin panel.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have admin privileges.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Manage users and add predictions for upcoming matches</p>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={cn(
            "p-3 rounded-lg flex items-center gap-2",
            message.type === 'success' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
          )}>
            {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {message.text}
          </div>
        )}

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users"><Users className="h-4 w-4 mr-2" />Users</TabsTrigger>
            <TabsTrigger value="emails"><Mail className="h-4 w-4 mr-2" />Allowlist</TabsTrigger>
            <TabsTrigger value="predictions"><Edit3 className="h-4 w-4 mr-2" />Predictions</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">All Users ({users.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {users.map(user => (
                    <div 
                      key={user.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{user.avatar || '⚽'}</span>
                        <div>
                          <div className="font-semibold flex items-center gap-2">
                            {user.username || 'Anonymous'}
                            {user.is_admin && <Crown className="h-4 w-4 text-yellow-500" />}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {user.total_points || 0} pts · {user.exact_scores || 0} exact · {user.correct_margins || 0} margin · {user.correct_results || 0} result
                          </div>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant={user.is_admin ? "destructive" : "outline"}
                        onClick={() => handleToggleAdmin(user.id, user.is_admin || false)}
                      >
                        {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Allowlist Tab */}
          <TabsContent value="emails">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Email Allowlist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input 
                    placeholder="email@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()}
                  />
                  <Button onClick={handleAddEmail}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {allowedEmails.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No emails in allowlist. All emails are currently allowed.
                    </p>
                  ) : (
                    allowedEmails.map(email => (
                      <div key={email} className="flex items-center justify-between p-2 rounded bg-muted/30">
                        <span className="text-sm">{email}</span>
                        <Button size="sm" variant="ghost" onClick={() => handleRemoveEmail(email)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Predictions Tab */}
          <TabsContent value="predictions">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add Prediction for User</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Add predictions for users who missed the deadline. Only upcoming matches can be modified - 
                  predictions cannot be changed after a game concludes.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select User</label>
                    <select 
                      className="w-full p-2 rounded border bg-background"
                      value={selectedUser || ""}
                      onChange={(e) => setSelectedUser(e.target.value || null)}
                    >
                      <option value="">Select a user...</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.avatar} {u.username || 'Anonymous'}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Match (Upcoming Only)</label>
                    <select 
                      className="w-full p-2 rounded border bg-background"
                      value={predictionMatch || ""}
                      onChange={(e) => setPredictionMatch(e.target.value || null)}
                    >
                      <option value="">Select a match...</option>
                      {upcomingMatches.map(m => {
                        const home = getTeamById(m.homeTeamId || '');
                        const away = getTeamById(m.awayTeamId || '');
                        return (
                          <option key={m.id} value={m.id}>
                            {home?.name || m.homeTeamId} vs {away?.name || m.awayTeamId} ({m.date})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                
                {selectedUser && predictionMatch && (
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-sm font-medium">Home Score</label>
                      <Input 
                        type="number" 
                        min="0"
                        value={predHome}
                        onChange={(e) => setPredHome(e.target.value)}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-medium">Away Score</label>
                      <Input 
                        type="number"
                        min="0"
                        value={predAway}
                        onChange={(e) => setPredAway(e.target.value)}
                      />
                    </div>
                    <Button 
                      className="mt-6"
                      onClick={handleAdminPrediction}
                      disabled={predHome === "" || predAway === ""}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Prediction
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
