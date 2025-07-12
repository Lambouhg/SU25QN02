'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { settingsService } from '@/services/settingsService';

interface MaintenancePageProps {
  siteName?: string;
  adminEmail?: string;
}

function MaintenancePage({ siteName = 'Interview Platform', adminEmail = 'admin@example.com' }: MaintenancePageProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Maintenance Mode</h1>
          <p className="text-gray-600">
            {siteName} is currently undergoing scheduled maintenance. We&apos;ll be back shortly.
          </p>
        </div>
        
        <div className="text-sm text-gray-500">
          <p className="mb-2">Thank you for your patience.</p>
          <p>
            If you have any urgent inquiries, please contact{' '}
            <a href={`mailto:${adminEmail}`} className="text-blue-600 hover:underline">
              {adminEmail}
            </a>
          </p>
        </div>
        
        <div className="mt-6">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Check Again
          </button>
        </div>
      </div>
    </div>
  );
}

interface MaintenanceCheckProps {
  children: React.ReactNode;
}

export default function MaintenanceCheck({ children }: MaintenanceCheckProps) {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean | null>(null);
  const [siteName, setSiteName] = useState('Interview Platform');
  const [adminEmail, setAdminEmail] = useState('admin@example.com');
  const { user, isLoaded } = useUser();

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const settings = await settingsService.getSettings();
        setIsMaintenanceMode(settings.maintenanceMode);
        setSiteName(settings.siteName);
        setAdminEmail(settings.adminEmail);
      } catch (error) {
        console.error('Error checking maintenance mode:', error);
        // If we can't check settings, assume no maintenance mode
        setIsMaintenanceMode(false);
      }
    };

    // Only check maintenance mode after Clerk has loaded
    if (isLoaded) {
      checkMaintenanceMode();
    }
  }, [isLoaded]);

  // Show loading while checking maintenance mode
  if (isMaintenanceMode === null || !isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check if user is admin - admins can bypass maintenance mode
  const isAdmin = user?.publicMetadata?.role === 'admin';

  // Show maintenance page if maintenance mode is enabled and user is not admin
  if (isMaintenanceMode && !isAdmin) {
    return <MaintenancePage siteName={siteName} adminEmail={adminEmail} />;
  }

  // Normal operation
  return <>{children}</>;
}
