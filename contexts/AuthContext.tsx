
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

  useEffect(() => {
    // The onAuthStateChange listener handles the initial session check as well as
    // any subsequent authentication events. This is a more robust way to handle
    // session state, avoiding race conditions between getSession() and the listener.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, sessionState: Session | null) => {
        setSession(sessionState);
        if (sessionState?.user) {
          const profile = await fetchUserProfile(sessionState.user);
          setUserProfile(profile);
        } else {
          setUserProfile(null);
        }
        // The first time the listener fires, the initial auth check is complete.
        setLoading(false);
      }
    );

    return () => {
      // Cleanup subscription on unmount
      authListener.subscription.unsubscribe();
    };
  }, []);
  
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
