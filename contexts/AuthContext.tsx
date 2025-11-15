
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
    // This effect is now definitive. It proactively fetches the session on startup
    // to guarantee the app doesn't freeze, and then listens for subsequent changes.

    const initializeSession = async () => {
      // 1. Proactively get the current session to avoid race conditions.
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Error fetching initial session:", error.message);
        setLoading(false); // Stop loading even if there's an error.
        return;
      }

      // 2. Process the session and profile.
      setSession(currentSession);
      if (currentSession?.user) {
        const profile = await fetchUserProfile(currentSession.user);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }

      // 3. Guarantee the loading screen is removed.
      setLoading(false);
    };

    initializeSession();

    // 4. Set up a listener for subsequent auth events (login, logout).
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, sessionState) => {
        // The listener just needs to update the state.
        // It doesn't control the initial loading anymore.
        setSession(sessionState);
        if (sessionState?.user) {
            const profile = await fetchUserProfile(sessionState.user);
            setUserProfile(profile);
        } else {
            setUserProfile(null);
        }
      }
    );
    
    // Proactive session refresh interval to prevent token expiration issues.
    const sessionRefreshInterval = setInterval(async () => {
        await supabase.auth.getSession();
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
    // onAuthStateChange will handle setting session and profile to null.
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
