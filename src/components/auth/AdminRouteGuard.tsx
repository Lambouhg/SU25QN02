'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRole } from '@/context/RoleContext';

interface AdminRouteGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AdminRouteGuard({ children, fallback }: AdminRouteGuardProps) {
  const { isAdmin, loading, role } = useRole();
  const router = useRouter();
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    console.log('🛡️ AdminRouteGuard - Status:', { loading, isAdmin, role, retryCount });
    
    // Nếu đang loading, đợi
    if (loading) {
      return;
    }

    // Nếu là admin, không cần làm gì thêm - sẽ render children bên dưới
    if (isAdmin) {
      console.log('✅ Admin access granted');
      return;
    }

    // Nếu role là null và chưa retry nhiều, thử lại
    if (role === null && retryCount < 3) {
      console.log('🔄 Retrying role check...', retryCount + 1);
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 1000);
      return;
    }

    // Nếu không phải admin sau khi retry, redirect
    if (!isAdmin && role !== null) {
      console.log('❌ Access denied, redirecting...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    }
  }, [loading, isAdmin, role, retryCount, router]);

  // Show loading while checking permissions hoặc đang retry
  if (loading || (role === null && retryCount < 3)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {retryCount > 0 ? `Retrying... (${retryCount}/3)` : 'Checking permissions...'}
          </p>
        </div>
      </div>
    );
  }

  // Show content if admin - ngay lập tức không cần showContent state
  if (isAdmin) {
    return <>{children}</>;
  }

  // Show fallback if not admin
  return fallback || (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl text-red-500 mb-4">🚫</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-2">You don&apos;t have permission to access this page.</p>
        <p className="text-sm text-gray-500 mb-4">Current role: {role || 'Unknown'}</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Dashboard
        </button>
        <div className="mt-4">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
}
