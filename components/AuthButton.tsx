"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTournamentSupabase } from "@/context/TournamentContextSupabase";
import { LogIn, LogOut, User } from "lucide-react";

export function AuthButton() {
  const { 
    currentUser, 
    isAuthenticated, 
    isLoading, 
    accessDenied,
    signInWithGoogle,
    signOut 
  } = useTournamentSupabase();
  
  const [showAuth, setShowAuth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (isAuthenticated && currentUser) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full">
          <User className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-primary">{currentUser.userName}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => signOut()} className="text-muted-foreground hover:text-foreground">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Show access denied message
  if (accessDenied) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-400">
        <span>Access denied</span>
        <Button variant="outline" size="sm" onClick={() => setShowAuth(true)}>
          Try again
        </Button>
      </div>
    );
  }

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");

    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error?.message || "Authentication failed");
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <Button onClick={() => setShowAuth(!showAuth)} size="sm">
        <LogIn className="h-4 w-4 mr-2" />
        Sign In
      </Button>

      {showAuth && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden" 
            onClick={() => setShowAuth(false)}
          />
          {/* Auth card - fixed on mobile, absolute on desktop */}
          <div className="fixed inset-x-4 top-20 z-50 md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:w-80">
            <Card className="border-border shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <LogIn className="h-5 w-5" />
                    Sign In
                  </CardTitle>
                  <button 
                    onClick={() => setShowAuth(false)}
                    className="text-muted-foreground hover:text-foreground md:hidden"
                  >
                    ✕
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Sign in with your Google account to make predictions
                </p>
                
                {error && (
                  <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/30 p-3 rounded-lg">
                    {error}
                  </div>
                )}

                <Button 
                  onClick={handleGoogleSignIn} 
                  className="w-full gap-2" 
                  disabled={loading}
                  variant="outline"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {loading ? "Signing in..." : "Continue with Google"}
                </Button>

                <p className="text-xs text-muted-foreground text-center border-t border-border pt-3">
                  Only invited friends can access this app
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
