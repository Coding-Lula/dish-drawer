import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SESSION_START_KEY = 'app_session_start_time';
const LAST_ACTIVITY_KEY = 'app_last_activity_time';

export const IDLE_TIMEOUT_MS = 25 * 60 * 1000; // 25 minutes
export const IDLE_WARNING_MS = 20 * 60 * 1000; // 20 minutes (5 min warning)

export const MAX_SESSION_MS = 8 * 60 * 60 * 1000; // 8 hours
export const MAX_SESSION_WARNING_MS = (8 * 60 - 5) * 60 * 1000; // 7 hours 55 minutes (5 min warning)

export interface TimeoutWarningState {
  type: 'idle' | 'max_session' | null;
  secondsRemaining: number;
}

export function useSessionTimeout(isLoggedIn: boolean) {
  const [warningState, setWarningState] = useState<TimeoutWarningState>({
    type: null,
    secondsRemaining: 0,
  });

  const lastActivityRef = useRef<number>(Date.now());

  const logout = useCallback(async () => {
    localStorage.removeItem(SESSION_START_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    setWarningState({ type: null, secondsRemaining: 0 });
    await supabase.auth.signOut();
  }, []);

  const updateLastActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
  }, []);

  const extendSession = useCallback(() => {
    updateLastActivity();
    setWarningState({ type: null, secondsRemaining: 0 });
  }, [updateLastActivity]);

  useEffect(() => {
    if (!isLoggedIn) {
      localStorage.removeItem(SESSION_START_KEY);
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      setWarningState({ type: null, secondsRemaining: 0 });
      return;
    }

    const now = Date.now();

    // Initialize or read session start time
    let sessionStartStr = localStorage.getItem(SESSION_START_KEY);
    if (!sessionStartStr) {
      localStorage.setItem(SESSION_START_KEY, now.toString());
      sessionStartStr = now.toString();
    }
    const sessionStart = parseInt(sessionStartStr, 10);

    // Initialize or read last activity time
    let lastActivityStr = localStorage.getItem(LAST_ACTIVITY_KEY);
    if (!lastActivityStr) {
      localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
      lastActivityStr = now.toString();
    }
    const initialLastActivity = parseInt(lastActivityStr, 10);
    lastActivityRef.current = initialLastActivity;

    // Check immediately on load if session expired while away/tab closed
    const idleElapsed = now - initialLastActivity;
    const sessionElapsed = now - sessionStart;

    if (idleElapsed >= IDLE_TIMEOUT_MS || sessionElapsed >= MAX_SESSION_MS) {
      logout();
      return;
    }

    // Activity listener to update last activity timestamp (throttled)
    let throttleTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleUserActivity = () => {
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          throttleTimeout = null;
          updateLastActivity();
        }, 1000); // Throttle activity updates to at most once per second
      }
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Storage event listener to sync state across multiple open tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LAST_ACTIVITY_KEY && e.newValue) {
        lastActivityRef.current = parseInt(e.newValue, 10);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Interval checker (runs every 1 second)
    const checkInterval = setInterval(() => {
      const currentNow = Date.now();
      const currentLastActivityStr = localStorage.getItem(LAST_ACTIVITY_KEY);
      const currentLastActivity = currentLastActivityStr
        ? parseInt(currentLastActivityStr, 10)
        : lastActivityRef.current;

      const currentSessionStartStr = localStorage.getItem(SESSION_START_KEY);
      const currentSessionStart = currentSessionStartStr
        ? parseInt(currentSessionStartStr, 10)
        : sessionStart;

      const currentIdleElapsed = currentNow - currentLastActivity;
      const currentSessionElapsed = currentNow - currentSessionStart;

      // 1. Check if hard expired
      if (currentIdleElapsed >= IDLE_TIMEOUT_MS || currentSessionElapsed >= MAX_SESSION_MS) {
        logout();
        return;
      }

      // 2. Check 8-hour Max Session Warning (takes precedence or idle warning)
      if (currentSessionElapsed >= MAX_SESSION_WARNING_MS) {
        const remainingMs = MAX_SESSION_MS - currentSessionElapsed;
        setWarningState({
          type: 'max_session',
          secondsRemaining: Math.max(0, Math.ceil(remainingMs / 1000)),
        });
      } else if (currentIdleElapsed >= IDLE_WARNING_MS) {
        // 3. Check Idle Warning
        const remainingMs = IDLE_TIMEOUT_MS - currentIdleElapsed;
        setWarningState({
          type: 'idle',
          secondsRemaining: Math.max(0, Math.ceil(remainingMs / 1000)),
        });
      } else {
        setWarningState({ type: null, secondsRemaining: 0 });
      }
    }, 1000);

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(checkInterval);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [isLoggedIn, logout, updateLastActivity]);

  return {
    warningState,
    extendSession,
    logout,
  };
}
