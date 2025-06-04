"use client";

import { ArrowRight, Star } from 'lucide-react';
import Link from 'next/link';
import InterviewCard from '@/components/InterviewCard';

export default function HeroSection() {
  return (
    <div className="px-12 py-24 max-w-[2100px] mx-auto">
      <div className="grid lg:grid-cols-2 gap-24 items-center min-h-[calc(100vh-160px)]">
        {/* Left Content */}
        <div>
          <h3 className="text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight">
            The Intelligent Solution for Talent Acquisition
          </h3>
          <p className="text-xl text-white/90 mb-10 max-w-2xl">
            Interview platform that combines the power of artificial intelligence with
            cutting-edge technology to revolutionize your hiring process.
          </p>
          <div className="flex flex-col sm:flex-row gap-6">
            <Link
              href="/get-started"
              className="inline-flex items-center bg-white text-black px-8 py-4 rounded-full font-medium hover:bg-white/90 transition-colors text-lg shadow-lg hover:shadow-xl"
            >
              Get Started Free <ArrowRight className="ml-2 w-4 h-6" />
            </Link>
            {/* Rating */}
            <div className="flex items-center">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="ml-3 text-white/90">Based on 100+ reviews on <span className="font-medium">G2</span></span>
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="relative">
          <InterviewCard />
        </div>
      </div>
    </div>
  );
}
