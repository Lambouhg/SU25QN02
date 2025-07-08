'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

interface UserRole {
  isAdmin: boolean;
  isUser: boolean;
  role: 'admin' | 'user' | null;
  loading: boolean;
}

const ROLE_CACHE_KEY = 'user_role_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface RoleCache {
  role: string;
  timestamp: number;
  userId: string;
}

export function useUserRoleWithCache(): UserRole {
  const { user, isLoaded } = useUser();
  const [userRole, setUserRole] = useState<UserRole>({
    isAdmin: false,
    isUser: false,
    role: null,
    loading: true
  });

  // Kiểm tra cache
  const getCachedRole = (userId: string): string | null => {
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

  // Lưu cache
  const setCachedRole = (userId: string, role: string) => {
    try {
      const cacheData: RoleCache = {
        role,
        timestamp: Date.now(),
        userId
      };
      localStorage.setItem(ROLE_CACHE_KEY, JSON.stringify(cacheData));
      console.log('💾 Cached role:', role);
    } catch (error) {
      console.error('Error caching role:', error);
    }
  };

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

      // Kiểm tra cache trước
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

      console.log('🔍 Fetching user role from API...');

      try {
        const response = await fetch(`/api/user/${user.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const userData = await response.json();
          const role = userData.role || 'user';
          
          // Cache the result
          setCachedRole(user.id, role);
          
          setUserRole({
            isAdmin: role === 'admin',
            isUser: role === 'user',
            role: role,
            loading: false
          });
        } else {
          console.log('❌ API error, defaulting to user');
          const defaultRole = 'user';
          setCachedRole(user.id, defaultRole);
          
          setUserRole({
            isAdmin: false,
            isUser: true,
            role: defaultRole,
            loading: false
          });
        }
      } catch (error) {
        console.error('💥 Network error:', error);
        const defaultRole = 'user';
        
        setUserRole({
          isAdmin: false,
          isUser: true,
          role: defaultRole,
          loading: false
        });
      }
    };

    checkUserRole();
  }, [user, isLoaded]);

  return userRole;

  // Clear cache function (có thể export nếu cần)
  // const clearRoleCache = () => {
  //   localStorage.removeItem(ROLE_CACHE_KEY);
  // };
}
