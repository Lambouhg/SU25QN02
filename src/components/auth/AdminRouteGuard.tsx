'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRole } from '@/context/RoleContext';

interface AdminRouteGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AdminRouteGuard({ children, fallback }: AdminRouteGuardProps) {
  const { isAdmin, loading, role, refreshRole } = useRole();
  const router = useRouter();
  const [retryCount, setRetryCount] = useState(0);
  const [lastRoleCheck, setLastRoleCheck] = useState(Date.now());

  const handleRedirect = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  // Periodic role checking để đảm bảo role luôn up-to-date
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      // Check role every 30 seconds nếu là admin để đảm bảo still admin
      if (isAdmin && (now - lastRoleCheck) > 30000) {
        refreshRole();
        setLastRoleCheck(now);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isAdmin, lastRoleCheck, refreshRole]);

  useEffect(() => {
    // Still loading - wait
    if (loading) return;

    // Admin access granted - reset retry count
    if (isAdmin && role === 'admin') {
      setRetryCount(0);
      return;
    }

    // Role is null and haven't retried enough - try again
    if (role === null && retryCount < 2) {
      const timer = setTimeout(() => {
        refreshRole();
        setRetryCount(prev => prev + 1);
      }, 1000);
      return () => clearTimeout(timer);
    }

    // Not admin after retries - redirect
    if (!isAdmin || role === 'user') {
      const timer = setTimeout(handleRedirect, 1500);
      return () => clearTimeout(timer);
    }
  }, [loading, isAdmin, role, retryCount, handleRedirect, refreshRole]);

  // Show loading while checking permissions or retrying
  if (loading || (role === null && retryCount < 2)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {retryCount > 0 ? `Verifying access... (${retryCount + 1}/3)` : 'Checking permissions...'}
          </p>
        </div>
      </div>
    );
  }

  // Show content if admin
  if (isAdmin) {
    return <>{children}</>;
  }

  // Show fallback if not admin
  return fallback || (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="text-6xl text-red-500 mb-4">🚫</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-2">You don&apos;t have permission to access this page.</p>
        <p className="text-sm text-gray-500 mb-6">Current role: {role || 'Unknown'}</p>
        <div className="space-y-3">
          <button
            onClick={handleRedirect}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
}
