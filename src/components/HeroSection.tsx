"use client";

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import InterviewCard from '@/components/InterviewCard';

export default function HeroSection() {
  return (
    <section className="px-4 md:px-12 py-16 md:py-24 max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center min-h-[calc(100vh-160px)]">
        {/* Left Content */}
        <div className="space-y-8">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
            Smart Interviews with{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              F.AI Interview
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-white/90 max-w-2xl leading-relaxed">
            Advanced F.AI interview platform helping businesses recruit efficiently and candidates 
            prepare optimally for their interviews.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/sign-up"
              className="group inline-flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              Start Interview Now
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              href="/demo"
              className="inline-flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 text-lg"
            >
              Watch Demo
            </Link>
          </div>
        </div>

        {/* Right Content */}
        <div className="relative">
          <InterviewCard />
        </div>
      </div>
      
      {/* Statistics Section */}
      <div className="mt-16 md:mt-24 pt-12 md:pt-16 border-t border-white/10">
        <div className="text-center mb-12">
          <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Trusted by leading companies worldwide for efficient recruitment and candidate preparation
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center group">
            <div className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">
              50,000+
            </div>
            <p className="text-white/80 text-sm md:text-base font-medium">
              Successful Interviews
            </p>
          </div>
          
          <div className="text-center group">
            <div className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-green-400 to-green-300 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">
              95%
            </div>
            <p className="text-white/80 text-sm md:text-base font-medium">
              Accuracy Rate
            </p>
          </div>
          
          <div className="text-center group">
            <div className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">
              2,000+
            </div>
            <p className="text-white/80 text-sm md:text-base font-medium">
              Trusted Companies
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}