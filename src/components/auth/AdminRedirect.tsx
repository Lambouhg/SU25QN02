'use client';

import { useUser } from '@clerk/nextjs';
import { useRole } from '@/context/RoleContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminRedirect() {
  const { user, isLoaded } = useUser();
  const { role, loading } = useRole();
  const router = useRouter();
  const pathname = usePathname();
  const [hasCheckedInitialRedirect, setHasCheckedInitialRedirect] = useState(false);

  useEffect(() => {
    // Only run if Clerk is loaded and we have a user
    if (!isLoaded || !user || loading) {
      return;
    }

    // Skip if we're on auth pages
    if (pathname.startsWith('/sign-') || pathname.startsWith('/sso-callback')) {
      return;
    }

    // If user has admin role and this is their first visit after login (on dashboard)
    // and they haven't been redirected yet, redirect to admin dashboard
    if (role === 'admin' && pathname === '/dashboard' && !hasCheckedInitialRedirect) {
      setHasCheckedInitialRedirect(true);
      router.push('/admin/dashboard');
      return;
    }

    // Mark that we've checked for initial redirect
    if (!hasCheckedInitialRedirect) {
      setHasCheckedInitialRedirect(true);
    }

  }, [isLoaded, user, role, loading, pathname, router, hasCheckedInitialRedirect]);

  return null; // This component doesn't render anything
}
