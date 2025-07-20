"use client";

import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import PricingSection from '@/components/PricingSection';
import Footer from '@/components/Footer';

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/dashboard');
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading while checking auth status
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Don't render the landing page if user is signed in (will redirect)
  if (isSignedIn) {
    return null;
  }
  return (
    <div className="bg-gray-50">
    <div className="flex flex-col min-h-screen">
      <div className="bg-black -to-br from-purple-700 via-purple-600 to-purple-500 md:m-3 md:rounded-[20px]">
        <Navbar />
        <HeroSection />
      </div>
      <div className="flex-1 bg-white">
        <PricingSection />
      </div>
      
    </div>
    <Footer />
     </div>
  );
}
