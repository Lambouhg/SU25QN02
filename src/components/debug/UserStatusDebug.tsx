'use client';

import { useUser } from '@clerk/nextjs';
import { useRole } from '@/context/RoleContext';
import { useEffect, useState, useRef, useMemo } from 'react';

// Cache for API responses to prevent duplicate calls
const roleCache = new Map<string, { role: string; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

function UserStatusDebug() {
  const { user } = useUser();
  const { role, loading } = useRole();
  const [dbRole, setDbRole] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  // Memoize the user ID to prevent unnecessary re-renders
  const userId = useMemo(() => user?.id || null, [user?.id]);

  useEffect(() => {
    const checkDbRole = async () => {
      if (!userId || fetchingRef.current) return;
      
      // Skip if this is the same user ID as before
      if (lastUserIdRef.current === userId) return;
      lastUserIdRef.current = userId;
      
      // Check cache first
      const cached = roleCache.get(userId);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        setDbRole(cached.role);
        return;
      }
      
      // Prevent concurrent requests
      fetchingRef.current = true;
      
      try {
        const response = await fetch(`/api/debug/user-role?clerkId=${userId}`);
        const data = await response.json();
        const roleData = data.role || 'not found';
        
        // Update cache
        roleCache.set(userId, { role: roleData, timestamp: now });
        setDbRole(roleData);
      } catch (error) {
        console.error('Error checking DB role:', error);
        setDbRole('error');
      } finally {
        fetchingRef.current = false;
      }
    };
    
    checkDbRole();
  }, [userId]);

  // Memoize the debug info to prevent unnecessary re-renders
  const debugInfo = useMemo(() => ({
    clerkId: userId || 'none',
    contextRole: loading ? 'loading...' : (role || 'none'),
    dbRole: dbRole || 'checking...',
    email: user?.emailAddresses?.[0]?.emailAddress || 'none'
  }), [userId, loading, role, dbRole, user?.emailAddresses]);

  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs z-50 max-w-sm">
      <div className="font-bold mb-2">🐛 Debug Info</div>
      <div>Clerk ID: {debugInfo.clerkId}</div>
      <div>Context Role: {debugInfo.contextRole}</div>
      <div>DB Role: {debugInfo.dbRole}</div>
      <div>Email: {debugInfo.email}</div>
    </div>
  );
}

export default UserStatusDebug;
