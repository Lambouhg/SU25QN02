"use client";

import { useUser } from '@clerk/nextjs';
import { useEffect, useState, useRef, useCallback } from 'react';

export default function UserSync() {
  const { user, isLoaded } = useUser();
  const [synced, setSynced] = useState(false);
  const syncingRef = useRef(false);

  const syncUserToDatabase = useCallback(async () => {
    if (!isLoaded || !user || synced || syncingRef.current) {
      return;
    }

    syncingRef.current = true;

    // Add a small delay to ensure authentication is fully processed
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.emailAddresses[0]?.emailAddress || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          clerkId: user.id,
          avatar: user.imageUrl || ''
        }),
      });

      if (response.ok) {
        setSynced(true);
      } else {
        console.error('Failed to sync user to database:', response.statusText);
      }
    } catch (error) {
      console.error('Error syncing user to database:', error);
    } finally {
      syncingRef.current = false;
    }
  }, [isLoaded, user, synced]);

  useEffect(() => {
    syncUserToDatabase();
  }, [syncUserToDatabase]);

  return null; // This component doesn't render anything
}
