"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useUser } from "@clerk/nextjs";

interface UserRole {
  isAdmin: boolean;
  isUser: boolean;
  role: 'admin' | 'user' | null;
  loading: boolean;
}

interface RoleContextType extends UserRole {
  refreshRole: () => Promise<void>;
  invalidateRoleCache: () => void;
}

const ROLE_CACHE_KEY = 'user_role_cache_v3';
const ROLE_INVALIDATION_KEY = 'role_invalidation_signal';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

interface RoleCache {
  role: string;
  timestamp: number;
  userId: string;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const { user, isLoaded } = useUser();
  const [userRole, setUserRole] = useState<UserRole>({
    isAdmin: false,
    isUser: false,
    role: null,
    loading: true
  });

  // Memoized cache functions
  const getCachedRole = useCallback((userId: string): string | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const cached = localStorage.getItem(ROLE_CACHE_KEY);
      if (!cached) return null;
      
      const parsedCache: RoleCache = JSON.parse(cached);
      const isExpired = (Date.now() - parsedCache.timestamp) >= CACHE_DURATION;
      
      if (parsedCache.userId === userId && !isExpired) {
        return parsedCache.role;
      }
    } catch (error) {
      console.error('Error reading role cache:', error);
    }
    return null;
  }, []);

  const setCachedRole = useCallback((userId: string, role: string) => {
    if (typeof window === 'undefined') return;
    
    try {
      const cacheData: RoleCache = {
        role,
        timestamp: Date.now(),
        userId
      };
      localStorage.setItem(ROLE_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching role:', error);
    }
  }, []);

  const invalidateRoleCache = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(ROLE_CACHE_KEY);
    } catch (error) {
      console.error('Error invalidating role cache:', error);
    }
  }, []);

  // Optimized fetch role function with faster endpoint
  const fetchRole = useCallback(async (userId: string): Promise<string> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // Increase to 8s timeout
    
    try {
      // Use the faster role-only endpoint
      const response = await fetch(`/api/user/${userId}/role`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const userData = await response.json();
        return userData.role || 'user';
      } else if (response.status === 404) {
        // User not found, they might be new - default to user
        console.warn('User not found in database, defaulting to user role');
        return 'user';
      }
      
      console.warn(`Role API returned ${response.status}, defaulting to user role`);
      return 'user';
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('Role fetch timeout - defaulting to user role');
      } else {
        console.warn('Role fetch error:', error);
      }
      return 'user'; // Always return a default instead of throwing
    }
  }, []);

  // Optimized refresh role function with fallback
  const refreshRole = useCallback(async () => {
    if (!user?.id) return;
    
    setUserRole(prev => ({ ...prev, loading: true }));
    
    try {
      // First try the fast role endpoint
      let role = await fetchRole(user.id);
      
      // If that fails, try to get from cache or use default
      if (!role || role === 'user') {
        const cachedRole = getCachedRole(user.id);
        if (cachedRole && cachedRole !== 'user') {
          role = cachedRole;
          console.log('Using cached role due to API issues:', role);
        }
      }
      
      setCachedRole(user.id, role);
      
      setUserRole({
        isAdmin: role === 'admin',
        isUser: role === 'user',
        role: role as 'admin' | 'user',
        loading: false
      });
    } catch (error) {
      console.error('Error refreshing role:', error);
      
      // Try to use cached role as fallback
      const cachedRole = getCachedRole(user.id);
      if (cachedRole) {
        console.log('Using cached role as fallback:', cachedRole);
        setUserRole({
          isAdmin: cachedRole === 'admin',
          isUser: cachedRole === 'user',
          role: cachedRole as 'admin' | 'user',
          loading: false
        });
      } else {
        // Final fallback to user role
        setUserRole({
          isAdmin: false,
          isUser: true,
          role: 'user',
          loading: false
        });
      }
    }
  }, [user?.id, fetchRole, setCachedRole, getCachedRole]);

  // Main effect to check user role with improved error handling
  useEffect(() => {
    const checkUserRole = async () => {
      if (!isLoaded) return;

      if (!user) {
        setUserRole({
          isAdmin: false,
          isUser: false,
          role: null,
          loading: false
        });
        return;
      }

      // Try cache first
      const cachedRole = getCachedRole(user.id);
      if (cachedRole) {
        setUserRole({
          isAdmin: cachedRole === 'admin',
          isUser: cachedRole === 'user',
          role: cachedRole as 'admin' | 'user',
          loading: false
        });
        
        // Still fetch in background to update cache, but don't wait
        fetchRole(user.id).then(freshRole => {
          if (freshRole !== cachedRole) {
            setCachedRole(user.id, freshRole);
            setUserRole({
              isAdmin: freshRole === 'admin',
              isUser: freshRole === 'user',
              role: freshRole as 'admin' | 'user',
              loading: false
            });
          }
        }).catch(error => {
          console.log('Background role fetch failed, keeping cached role:', error.message);
        });
        
        return;
      }

      // No cache, fetch from API with timeout protection
      setUserRole(prev => ({ ...prev, loading: true }));
      
      try {
        // Use fetchRole which already has proper timeout handling
        const role = await fetchRole(user.id);
        
        setCachedRole(user.id, role);
        
        setUserRole({
          isAdmin: role === 'admin',
          isUser: role === 'user',
          role: role as 'admin' | 'user',
          loading: false
        });
      } catch (error) {
        console.error('Error checking role:', error);
        
        // Default to user role but don't show loading forever
        setUserRole({
          isAdmin: false,
          isUser: true,
          role: 'user',
          loading: false
        });
      }
    };

    checkUserRole();
  }, [user, isLoaded, getCachedRole, fetchRole, setCachedRole]);

  // Listen to storage events for role updates and invalidation signals
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!user) return;
      
      // Handle role cache updates from other tabs
      if (e.key === ROLE_CACHE_KEY) {
        const cachedRole = getCachedRole(user.id);
        if (cachedRole) {
          setUserRole({
            isAdmin: cachedRole === 'admin',
            isUser: cachedRole === 'user',
            role: cachedRole as 'admin' | 'user',
            loading: false
          });
        }
      }
      
      // Handle role invalidation signals
      if (e.key === ROLE_INVALIDATION_KEY && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          
          // If this signal is for current user, refresh role immediately
          if (data.clerkId === user.id) {
            // Immediately invalidate cache
            invalidateRoleCache();
            
            // Force refresh role without delay
            refreshRole().then(() => {
              // Role refresh completed
            });
          }
        } catch (error) {
          console.error('Error parsing role invalidation signal:', error);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [user, getCachedRole, invalidateRoleCache, refreshRole]);

  return (
    <RoleContext.Provider 
      value={{
        ...userRole,
        refreshRole,
        invalidateRoleCache
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
