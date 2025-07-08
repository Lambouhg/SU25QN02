'use client';

import { useUser } from '@clerk/nextjs';
import { useRole } from '@/context/RoleContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminRedirect() {
  const { user, isLoaded } = useUser();
  const { role, loading } = useRole();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only run if Clerk is loaded and we have a user
    if (!isLoaded || !user || loading) {
      console.log('🔄 AdminRedirect waiting...', { isLoaded, hasUser: !!user, loading });
      return;
    }

    console.log('🔍 AdminRedirect checking...', { role, pathname });

    // Skip if we're already on an admin page or auth page
    if (pathname.startsWith('/admin') || pathname.startsWith('/sign-') || pathname.startsWith('/sso-callback')) {
      console.log('⏭️ Skipping redirect - already on admin/auth page');
      return;
    }

    // If user has admin role and is on dashboard, redirect to admin dashboard
    if (role === 'admin' && pathname === '/dashboard') {
      console.log('� Redirecting admin to admin dashboard');
      router.push('/admin/dashboard');
    }
  }, [isLoaded, user, role, loading, pathname, router]);

  return null; // This component doesn't render anything
}
