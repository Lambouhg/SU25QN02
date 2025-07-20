"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import ActivityTracker from "@/services/activityTracker";

export function useClerkActivity() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded || !user) {
      return;
    }

    const tracker = ActivityTracker.getInstance();
    
    // Start tracking if not already tracking this user
    if (!tracker.isCurrentlyTracking(user.id)) {
      tracker.startTracking(user.id);
    }

    // Cleanup on unmount
    return () => {
      // Don't stop tracking on component unmount as other components might need it
      // Only stop when user actually logs out or app closes
    };
  }, [user, isLoaded]);

  return {
    isTracking: isLoaded && !!user
  };
}
