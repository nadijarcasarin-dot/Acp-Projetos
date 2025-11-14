
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string;
  job_titles: {
    name: string;
  } | null;
}

interface AuthContextType {
  session: Session | null;
  userProfile: UserProfile | null;
  login: (email: string, pass: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  session: null,
  userProfile: null,
  login: async () => ({ error: null }),
  logout: async () => {},
  loading: true,
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (user: User): Promise<UserProfile | null> => {
      try {
          const { data, error } = await supabase
              .from('users')
              .select('id, full_name, avatar_url, job_titles(name)')
              .eq('id', user.id)
              .single();
          if (error) throw error;
          return data;
      } catch (error) {
          console.error("Error fetching user profile:", error);
          return null;
      }
  };

  useEffect(() => {
    // Proactively fetch session on mount to resolve loading state.
    const getInitialSession = async () => {
        try {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            setSession(currentSession);
            if (currentSession?.user) {
                const profile = await fetchUserProfile(currentSession.user);
                setUserProfile(profile);
            } else {
                setUserProfile(null);
            }
        } catch (error) {
            console.error("Error fetching initial session:", error);
            setUserProfile(null);
            setSession(null);
        } finally {
            setLoading(false);
        }
    };
    
    getInitialSession();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, sessionState: Session | null) => {
        setSession(sessionState);
        if (sessionState?.user) {
          const profile = await fetchUserProfile(sessionState.user);
          setUserProfile(profile);
        } else {
          setUserProfile(null);
        }
      }
    );

    // Proactive session refresh interval
    // In some serverless environments (like Vercel), Supabase's default background
    // token refresh can be unreliable, leading to the session expiring and API calls hanging.
    // This timer ensures the session token is refreshed well before it expires, preventing freezes.
    const sessionRefreshInterval = setInterval(async () => {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) {
            console.error('Error proactively refreshing session:', error.message);
        }
        // If the session becomes null (e.g., due to an invalid refresh token),
        // the onAuthStateChange listener will automatically handle the logout flow.
    }, 1 * 60 * 1000); // Refresh every 1 minute.

    return () => {
      authListener.subscription.unsubscribe();
      clearInterval(sessionRefreshInterval);
    };
  }, []);

  const login = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    return { error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUserProfile(null);
  };

  const value = {
    session,
    userProfile,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
