"use client";

// Singleton activity tracker to prevent multiple instances
class ActivityTracker {
  private static instance: ActivityTracker | null = null;
  private isTracking = false;
  private lastSync = 0;
  private intervalId: NodeJS.Timeout | null = null;
  private currentUser: string | null = null;
  private visibilityHandler: (() => void) | null = null;
  private beforeUnloadHandler: (() => void) | null = null;
  
  private readonly SYNC_INTERVAL = 900000; // 15 minutes
  private readonly MIN_SYNC_DELAY = 300000; // 5 minutes
  
  static getInstance(): ActivityTracker {
    if (!ActivityTracker.instance) {
      ActivityTracker.instance = new ActivityTracker();
    }
    return ActivityTracker.instance;
  }
  
  private constructor() {
    // Private constructor for singleton
  }
  
  async startTracking(userId: string) {
    if (this.isTracking && this.currentUser === userId) {
      return; // Already tracking this user
    }
    
    this.stopTracking(); // Stop any existing tracking
    this.currentUser = userId;
    this.isTracking = true;
    
    // Initial sync
    await this.syncActivity(userId, { forceOnline: true });
    
    // Set up periodic sync
    this.intervalId = setInterval(() => {
      this.syncActivity(userId);
    }, this.SYNC_INTERVAL);
    
    // Set up visibility change handler
    this.visibilityHandler = () => {
      if (document.visibilityState === 'visible' && this.currentUser === userId) {
        this.syncActivity(userId);
      }
    };
    
    // Set up beforeunload handler
    this.beforeUnloadHandler = () => {
      if (this.currentUser === userId) {
        navigator.sendBeacon('/api/user/clerk-activity', JSON.stringify({
          clerkId: userId,
          setOffline: true
        }));
      }
    };
    
    document.addEventListener('visibilitychange', this.visibilityHandler);
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }
  
  stopTracking() {
    // Clear interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    // Remove event listeners
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
    
    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }
    
    // Set user offline
    if (this.currentUser) {
      this.syncActivity(this.currentUser, { setOffline: true });
    }
    
    this.isTracking = false;
    this.currentUser = null;
  }
  
  private async syncActivity(userId: string, options?: { forceOnline?: boolean; setOffline?: boolean }) {
    const now = Date.now();
    
    // Rate limiting
    if (!options?.forceOnline && !options?.setOffline && (now - this.lastSync < this.MIN_SYNC_DELAY)) {
      return false;
    }
    
    try {
      interface ActivityPayload {
        clerkId: string;
        forceOnline?: boolean;
        setOffline?: boolean;
      }
      
      const payload: ActivityPayload = { clerkId: userId };
      
      if (options?.forceOnline) {
        payload.forceOnline = true;
      } else if (options?.setOffline) {
        payload.setOffline = true;
      }
      
      const response = await fetch('/api/user/clerk-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        this.lastSync = now;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to sync activity:', error);
      return false;
    }
  }
  
  isCurrentlyTracking(userId: string): boolean {
    return this.isTracking && this.currentUser === userId;
  }
}

export default ActivityTracker;
