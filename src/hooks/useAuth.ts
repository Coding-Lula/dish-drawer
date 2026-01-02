import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'manager' | 'cashier';

interface AuthState {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    loading: true,
  });

  const fetchUserRole = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
    
    return data?.role as AppRole | null;
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const role = await fetchUserRole(session.user.id);
        setAuthState({ session, user: session.user, role, loading: false });
      } else {
        setAuthState({ session: null, user: null, role: null, loading: false });
      }
    };

    // Initial check
    checkSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Re-check session on auth events (e.g., login, logout)
        checkSession();
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchUserRole]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, displayName: string, role: AppRole) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { display_name: displayName }
      }
    });

    if (error) return { error };

    // If signup successful, add the role
    if (data.user) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: data.user.id, role });
      
      if (roleError) {
        console.error('Error setting user role:', roleError);
        return { error: roleError };
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const hasAccess = (allowedRoles: AppRole[]) => {
    if (!authState.role) return false;
    return allowedRoles.includes(authState.role);
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    hasAccess,
    isManager: authState.role === 'manager',
    isCashier: authState.role === 'cashier',
  };
}
