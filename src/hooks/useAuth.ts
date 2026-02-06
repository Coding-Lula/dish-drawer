import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'manager' | 'cashier';

export interface UserStoreAccess {
  store_id: string | null;
  role: AppRole;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  accessibleStoreIds: string[];
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    accessibleStoreIds: [],
    loading: true,
  });

  const fetchUserRole = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
    
    return data?.role as AppRole | null;
  }, []);

  const fetchUserStoreAccess = useCallback(async (userId: string): Promise<string[]> => {
    // First check if user is a manager with NULL store_id (global access)
    const { data: managerCheck } = await supabase
      .from('user_roles')
      .select('role, store_id')
      .eq('user_id', userId)
      .eq('role', 'manager')
      .is('store_id', null)
      .maybeSingle();

    if (managerCheck) {
      // Manager with global access - return empty array to signal "all stores"
      return [];
    }

    // Otherwise, get specific store assignments
    const { data, error } = await supabase
      .from('user_roles')
      .select('store_id')
      .eq('user_id', userId)
      .not('store_id', 'is', null);

    if (error) {
      console.error('Error fetching user store access:', error);
      return [];
    }

    return data?.map(r => r.store_id as string).filter(Boolean) || [];
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
        }));
        
        // Defer role fetching with setTimeout to prevent deadlock
        if (session?.user) {
          setTimeout(async () => {
            const [role, storeIds] = await Promise.all([
              fetchUserRole(session.user.id),
              fetchUserStoreAccess(session.user.id)
            ]);
            setAuthState(prev => ({ 
              ...prev, 
              role, 
              accessibleStoreIds: storeIds,
              loading: false 
            }));
          }, 0);
        } else {
          setAuthState(prev => ({ ...prev, role: null, accessibleStoreIds: [], loading: false }));
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setAuthState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
      }));
      
      if (session?.user) {
        const [role, storeIds] = await Promise.all([
          fetchUserRole(session.user.id),
          fetchUserStoreAccess(session.user.id)
        ]);
        setAuthState(prev => ({ 
          ...prev, 
          role, 
          accessibleStoreIds: storeIds,
          loading: false 
        }));
      } else {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserRole, fetchUserStoreAccess]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, displayName: string, role: AppRole, storeIds?: string[]) => {
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

    // If signup successful, add the role(s)
    if (data.user) {
      if (role === 'manager' && (!storeIds || storeIds.length === 0)) {
        // Manager with global access
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: data.user.id, role, store_id: null });
        
        if (roleError) {
          console.error('Error setting user role:', roleError);
          return { error: roleError };
        }
      } else if (storeIds && storeIds.length > 0) {
        // User with specific store access
        const roleInserts = storeIds.map(storeId => ({
          user_id: data.user!.id,
          role,
          store_id: storeId
        }));
        
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert(roleInserts);
        
        if (roleError) {
          console.error('Error setting user roles:', roleError);
          return { error: roleError };
        }
      } else {
        // Fallback - cashier must have stores
        return { error: new Error('Cashier must be assigned to at least one store') };
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

  // Check if user has access to a specific store
  const hasStoreAccess = (storeId: string) => {
    if (authState.role === 'manager' && authState.accessibleStoreIds.length === 0) {
      // Manager with global access
      return true;
    }
    return authState.accessibleStoreIds.includes(storeId);
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    hasAccess,
    hasStoreAccess,
    isManager: authState.role === 'manager',
    isCashier: authState.role === 'cashier',
    hasGlobalAccess: authState.role === 'manager' && authState.accessibleStoreIds.length === 0,
  };
}
