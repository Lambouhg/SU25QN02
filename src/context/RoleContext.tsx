"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
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

const ROLE_CACHE_KEY = 'user_role_cache_v2';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

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

  // Get cached role
  const getCachedRole = (userId: string): string | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const cached = localStorage.getItem(ROLE_CACHE_KEY);
      if (!cached) return null;
      
      const parsedCache: RoleCache = JSON.parse(cached);
      const now = Date.now();
      
      if (
        parsedCache.userId === userId &&
        (now - parsedCache.timestamp) < CACHE_DURATION
      ) {
        console.log('📦 Using cached role:', parsedCache.role);
        return parsedCache.role;
      }
    } catch (error) {
      console.error('Error reading role cache:', error);
    }
    return null;
  };

  // Set cached role
  const setCachedRole = (userId: string, role: string) => {
    if (typeof window === 'undefined') return;
    
    try {
      const cacheData: RoleCache = {
        role,
        timestamp: Date.now(),
        userId
      };
      localStorage.setItem(ROLE_CACHE_KEY, JSON.stringify(cacheData));
      console.log('💾 Cached role:', role, 'for user:', userId);
    } catch (error) {
      console.error('Error caching role:', error);
    }
  };

  // Invalidate cache
  const invalidateRoleCache = () => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(ROLE_CACHE_KEY);
      console.log('🗑️ Role cache invalidated');
    } catch (error) {
      console.error('Error invalidating role cache:', error);
    }
  };

  // Fetch role from API
  const fetchRole = async (userId: string): Promise<string> => {
    console.log('🔍 Fetching user role from API for:', userId);
    
    try {
      const response = await fetch(`/api/user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        const role = userData.role || 'user';
        console.log('✅ Role fetched:', role);
        return role;
      } else {
        console.log('❌ API error, defaulting to user');
        return 'user';
      }
    } catch (error) {
      console.error('💥 Network error:', error);
      return 'user';
    }
  };

  // Refresh role (force fetch)
  const refreshRole = async () => {
    if (!user) return;
    
    setUserRole(prev => ({ ...prev, loading: true }));
    
    try {
      const role = await fetchRole(user.id);
      setCachedRole(user.id, role);
      
      setUserRole({
        isAdmin: role === 'admin',
        isUser: role === 'user',
        role: role as 'admin' | 'user',
        loading: false
      });
    } catch (error) {
      console.error('Error refreshing role:', error);
      setUserRole({
        isAdmin: false,
        isUser: true,
        role: 'user',
        loading: false
      });
    }
  };

  // Main effect to check user role
  useEffect(() => {
    const checkUserRole = async () => {
      if (!isLoaded) {
        console.log('⏳ Clerk not loaded yet...');
        return;
      }

      if (!user) {
        console.log('❌ No user found');
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
        return;
      }

      // Fetch from API
      try {
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
        setUserRole({
          isAdmin: false,
          isUser: true,
          role: 'user',
          loading: false
        });
      }
    };

    checkUserRole();
  }, [user, isLoaded]);

  // Listen to storage events for role updates from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === ROLE_CACHE_KEY && user) {
        console.log('🔄 Role cache updated in another tab, refreshing...');
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
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [user]);

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
