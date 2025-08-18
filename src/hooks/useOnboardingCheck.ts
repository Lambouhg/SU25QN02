import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

interface OnboardingStatus {
  needsOnboarding: boolean;
  isNewUser: boolean;
  onboardingCompleted: boolean;
  user: any;
}

export const useOnboardingCheck = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    checkOnboardingStatus();
  }, [isSignedIn, isLoaded]);

  const checkOnboardingStatus = async () => {
    try {
      const response = await fetch('/api/user/onboarding-status');
      if (response.ok) {
        const data = await response.json();
        setOnboardingStatus(data);
        
        // Nếu user cần onboarding và không đang ở trang onboarding, redirect
        if (data.needsOnboarding && !window.location.pathname.includes('/onboarding')) {
          router.push('/onboarding');
        }
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const refreshOnboardingStatus = () => {
    checkOnboardingStatus();
  };

  return {
    loading,
    onboardingStatus,
    needsOnboarding: onboardingStatus?.needsOnboarding || false,
    isNewUser: onboardingStatus?.isNewUser || false,
    onboardingCompleted: onboardingStatus?.onboardingCompleted || false,
    refreshOnboardingStatus
  };
};
