'use client';

import { useUser } from '@clerk/nextjs';
import { useRole } from '@/context/RoleContext';
import { useEffect, useState } from 'react';

export default function UserStatusDebug() {
  const { user } = useUser();
  const { role, loading } = useRole();
  const [dbRole, setDbRole] = useState<string | null>(null);

  useEffect(() => {
    const checkDbRole = async () => {
      if (user?.id) {
        try {
          const response = await fetch(`/api/debug/user-role?clerkId=${user.id}`);
          const data = await response.json();
          setDbRole(data.role || 'not found');
        } catch (error) {
          console.error('Error checking DB role:', error);
          setDbRole('error');
        }
      }
    };
    checkDbRole();
  }, [user?.id]);

  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs z-50 max-w-sm">
      <div className="font-bold mb-2">🐛 Debug Info</div>
      <div>Clerk ID: {user?.id || 'none'}</div>
      <div>Context Role: {loading ? 'loading...' : (role || 'none')}</div>
      <div>DB Role: {dbRole || 'checking...'}</div>
      <div>Email: {user?.emailAddresses?.[0]?.emailAddress || 'none'}</div>
    </div>
  );
}
