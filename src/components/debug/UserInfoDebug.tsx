'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRole } from '@/context/RoleContext';

interface DebugInfo {
  status: string;
  isAuthenticated: boolean;
  clerk?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  database?: {
    id: string;
    clerkId: string;
    email: string;
    role: string;
    status: string;
    lastLogin: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  debug?: {
    userExists: boolean;
    isAdmin: boolean;
    mongoConnected: boolean;
  };
  error?: string;
}

export default function UserInfoDebug() {
  const { user, isLoaded } = useUser();
  const { isAdmin, role, loading } = useRole();
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDebugInfo = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/debug/user-info');
      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      console.error('Error fetching debug info:', error);
      setDebugInfo({
        status: 'error',
        isAuthenticated: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      fetchDebugInfo();
    }
  }, [isLoaded]);

  if (!isLoaded || isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">User Debug Info</h3>
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">User Debug Info</h3>
        <button
          onClick={fetchDebugInfo}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>

      {/* Clerk Info */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-800 mb-2">Clerk Context:</h4>
        <div className="bg-gray-50 p-3 rounded text-sm">
          <div>User ID: {user?.id || 'None'}</div>
          <div>Email: {user?.emailAddresses?.[0]?.emailAddress || 'None'}</div>
          <div>Is Loaded: {isLoaded ? 'Yes' : 'No'}</div>
        </div>
      </div>

      {/* Role Context */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-800 mb-2">Role Context:</h4>
        <div className="bg-gray-50 p-3 rounded text-sm">
          <div>Is Admin: <span className={isAdmin ? 'text-green-600' : 'text-red-600'}>{isAdmin ? 'Yes' : 'No'}</span></div>
          <div>Role: <span className="font-mono">{role || 'null'}</span></div>
          <div>Loading: {loading ? 'Yes' : 'No'}</div>
        </div>
      </div>

      {/* API Debug Info */}
      {debugInfo && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-800 mb-2">API Response:</h4>
          <div className="bg-gray-50 p-3 rounded text-sm">
            <div>Status: <span className="font-mono">{debugInfo.status}</span></div>
            <div>Authenticated: <span className={debugInfo.isAuthenticated ? 'text-green-600' : 'text-red-600'}>{debugInfo.isAuthenticated ? 'Yes' : 'No'}</span></div>
            
            {debugInfo.database && (
              <div className="mt-2">
                <div className="font-medium">Database User:</div>
                <div className="ml-2">
                  <div>Role: <span className="font-mono">{debugInfo.database.role}</span></div>
                  <div>Status: <span className="font-mono">{debugInfo.database.status}</span></div>
                  <div>Last Login: {debugInfo.database.lastLogin}</div>
                </div>
              </div>
            )}

            {debugInfo.debug && (
              <div className="mt-2">
                <div className="font-medium">Debug Flags:</div>
                <div className="ml-2">
                  <div>User Exists in DB: <span className={debugInfo.debug.userExists ? 'text-green-600' : 'text-red-600'}>{debugInfo.debug.userExists ? 'Yes' : 'No'}</span></div>
                  <div>Is Admin in DB: <span className={debugInfo.debug.isAdmin ? 'text-green-600' : 'text-red-600'}>{debugInfo.debug.isAdmin ? 'Yes' : 'No'}</span></div>
                  <div>Mongo Connected: <span className={debugInfo.debug.mongoConnected ? 'text-green-600' : 'text-red-600'}>{debugInfo.debug.mongoConnected ? 'Yes' : 'No'}</span></div>
                </div>
              </div>
            )}

            {debugInfo.error && (
              <div className="mt-2 text-red-600">
                Error: {debugInfo.error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Raw JSON */}
      <details className="mt-4">
        <summary className="cursor-pointer font-medium text-gray-800">Raw Debug Data</summary>
        <pre className="mt-2 bg-gray-100 p-3 rounded text-xs overflow-auto">
          {JSON.stringify({ debugInfo, user: user ? { id: user.id, email: user.emailAddresses?.[0]?.emailAddress } : null, role: { isAdmin, role, loading } }, null, 2)}
        </pre>
      </details>
    </div>
  );
}
