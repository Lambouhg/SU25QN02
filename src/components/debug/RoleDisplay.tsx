'use client';

import { useUser } from '@clerk/nextjs';
import { useRole } from '@/context/RoleContext';
import { useState, useEffect } from 'react';

export default function RoleDisplay() {
  const { user } = useUser();
  const { role, isAdmin, loading, refreshRole } = useRole();
  const [dbRole, setDbRole] = useState<string | null>(null);
  const [dbLoading, setDbLoading] = useState(false);

  const checkDbRole = async () => {
    if (!user) return;
    
    setDbLoading(true);
    try {
      const response = await fetch(`/api/debug/role/${user.id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDbRole(data.role);
      } else {
        setDbRole('Error fetching role');
      }
    } catch (error) {
      setDbRole('Error: ' + (error as Error).message);
    } finally {
      setDbLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkDbRole();
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null;

  return (
    <div className="fixed top-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg z-50 text-sm max-w-xs">
      <h3 className="font-bold mb-2">Debug: Role Info</h3>
      <div className="space-y-1">
        <div><strong>User:</strong> {user.firstName} {user.lastName}</div>
        <div><strong>Email:</strong> {user.emailAddresses[0]?.emailAddress}</div>
        <div><strong>Clerk ID:</strong> {user.id}</div>
        <hr className="my-2" />
        <div><strong>Context Role:</strong> {loading ? 'Loading...' : (role || 'null')}</div>
        <div><strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}</div>
        <div><strong>Context Loading:</strong> {loading ? 'Yes' : 'No'}</div>
        <hr className="my-2" />
        <div><strong>DB Role:</strong> {dbLoading ? 'Loading...' : (dbRole || 'null')}</div>
        <div className="flex gap-2 mt-2">
          <button 
            onClick={refreshRole}
            className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
          >
            Refresh Context
          </button>
          <button 
            onClick={checkDbRole}
            className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs"
          >
            Check DB
          </button>
        </div>
      </div>
    </div>
  );
}
