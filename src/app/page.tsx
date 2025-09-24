"use client";

import { useUser } from '@clerk/nextjs';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import WhyChooseSection from '@/components/WhyChooseSection';
import CustomerReviews from '@/components/CustomerReviews';
import HowItWorksSection from '@/components/HowItWorksSection';
import PricingSection from '@/components/PricingSection';
// import OurTeamSection from '@/components/OurTeamSection';
import Footer from '@/components/Footer';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  // Redirect signed-in users to dashboard from home
  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
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

  // Prevent flashing home before redirect
  if (isSignedIn) return null;

  return (
    <div className="min-h-screen">
      {/* Hero Section with Dark Background */}
      <div id="home" className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 md:m-3 md:rounded-3xl overflow-hidden">
        <Navbar />
        <HeroSection />
      </div>
      
      {/* Main Content */}
      <main>
        <div id="features">
          <WhyChooseSection />
        </div>
        {/* <div id="ourteams">
          <OurTeamSection />
        </div> */}
        <div id="reviews">
          <CustomerReviews />
        </div>
        <div id="how-it-works">
          <HowItWorksSection />
        </div>
        <div id="pricing">
          <PricingSection />
        </div>
        {/* Team Section */}
      </main>
      <Footer />
    </div>
  );
}
