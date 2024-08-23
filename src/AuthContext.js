import React, { createContext, useState, useEffect, useContext } from 'react';
import supabase from './supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (username, password) => {
    const { data: user, error } = await supabase
      .from('uptimeusers')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();
    if (error) throw error;
    setUser(user);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // Remove the Google logout function since we no longer support it
    // const googleLogout = async () => {
    //   if (window.gapi && window.gapi.auth2) {
    //     const auth2 = window.gapi.auth2.getAuthInstance();
    //     if (auth2 != null) {
    //       await auth2.signOut();
    //       await auth2.disconnect();
    //     }
    //   }
    // };

    // await googleLogout();

    setUser(null);
  };

  const value = {
    user,
    signIn,
    signOut,
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
