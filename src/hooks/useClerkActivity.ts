"use client";

import { useUser, useSession } from "@clerk/nextjs";
import { useEffect, useCallback, useRef } from "react";

const SYNC_INTERVAL = 60000; // 1 minute
const MIN_SYNC_DELAY = 30000; // 30 seconds

export function useClerkActivity() {
  const { user, isLoaded } = useUser();
  const { session } = useSession();
  const lastSyncRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const syncActivity = useCallback(async (options?: { forceOnline?: boolean; setOffline?: boolean }) => {
    if (!isLoaded || !user) return false;

    const now = Date.now();
    // Rate limiting - skip if too recent (unless forced)
    if (!options?.forceOnline && !options?.setOffline && (now - lastSyncRef.current < MIN_SYNC_DELAY)) {
      return false;
    }

    try {
      interface ActivityPayload {
        clerkId: string;
        forceOnline?: boolean;
        setOffline?: boolean;
        sessionId?: string;
        lastActiveAt?: Date;
        createdAt?: Date;
      }
      
      const payload: ActivityPayload = { clerkId: user.id };
      
      if (options?.forceOnline) {
        payload.forceOnline = true;
      } else if (options?.setOffline) {
        payload.setOffline = true;
      } else if (session) {
        payload.sessionId = session.id;
        payload.lastActiveAt = session.lastActiveAt;
        payload.createdAt = session.createdAt;
      }

      const response = await fetch('/api/user/clerk-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        lastSyncRef.current = now;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to sync Clerk activity:', error);
      return false;
    }
  }, [user, session, isLoaded]);

  // Setup activity tracking
  useEffect(() => {
    if (!isLoaded || !user) return;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Force online on mount
    syncActivity({ forceOnline: true });

    // Setup periodic sync
    intervalRef.current = setInterval(() => {
      syncActivity();
    }, SYNC_INTERVAL);

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncActivity();
      }
    };

    // Handle beforeunload - set offline
    const handleBeforeUnload = () => {
      navigator.sendBeacon('/api/user/clerk-activity', JSON.stringify({
        clerkId: user.id,
        setOffline: true
      }));
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, isLoaded, syncActivity]);

  // Sync when session changes
  useEffect(() => {
    if (session?.lastActiveAt) {
      syncActivity();
    }
  }, [session?.lastActiveAt, syncActivity]);

  return {
    isTracking: isLoaded && !!user,
    syncActivity: useCallback((options?: { forceOnline?: boolean; setOffline?: boolean }) => 
      syncActivity(options), [syncActivity])
  };
}
