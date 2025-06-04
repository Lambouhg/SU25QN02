"use client";

import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import PricingSection from '@/components/PricingSection';
import Footer from '@/components/Footer';

export default function Home() {
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
