"use client";

import { Search, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="flex items-center justify-between px-4 md:px-12 py-4 md:py-6 relative z-50 max-w-[2100px] mx-auto">
      {/* Logo */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
              <path d="M8 12C8 9.79086 9.79086 8 12 8H14C16.2091 8 18 9.79086 18 12C18 14.2091 16.2091 16 14 16H12C9.79086 16 8 14.2091 8 12Z" fill="#7C3AED" />
            </svg>
          </div>
          <span className="text-white font-bold text-2xl ml-3">F.AI Interview</span>
        </div>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center space-x-10">
        <button 
          onClick={() => scrollToSection('home')}
          className="text-white font-medium hover:text-purple-300 transition-colors"
        >
          Home
        </button>
        <Link href="/dashboard" className="text-white font-medium hover:text-purple-300 transition-colors">
          Dashboard
        </Link>
        <button 
          onClick={() => scrollToSection('features')}
          className="text-white font-medium hover:text-purple-300 transition-colors"
        >
          Features
        </button>
        <button 
          onClick={() => scrollToSection('how-it-works')}
          className="text-white font-medium hover:text-purple-300 transition-colors"
        >
          How It Works
        </button>
        <button 
          onClick={() => scrollToSection('pricing')}
          className="text-white font-medium hover:text-purple-300 transition-colors"
        >
          Pricing
        </button>
        <Link href="/Pricing" className="text-white font-medium hover:text-purple-300 transition-colors">
          Full Pricing
        </Link>
      </div>

      {/* Search and Auth */}
      <div className="hidden md:flex items-center space-x-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search"
            className="pl-10 pr-4 py-2 rounded-full bg-gray-100 text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition-all w-48"
          />
        </div>
        <SignedIn>
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "w-10 h-10",
                userButtonTrigger: "hover:opacity-80 transition-opacity"
              }
            }}
          />
        </SignedIn>
        <SignedOut>
          <Link href="/sign-in" className="text-white font-medium hover:text-purple-300 transition-colors">
            Login
          </Link>
          <Link
            href="/sign-up"
            className="bg-purple-600 text-white px-6 py-2.5 rounded-full font-medium hover:bg-purple-700 transition-colors"
          >
            Sign-up
          </Link>
        </SignedOut>
      </div>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden text-white"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-14 inset-x-0 z-50 bg-white border-t border-gray-200 shadow-lg">
          <div className="p-4 space-y-4">
            <button 
              onClick={() => {
                scrollToSection('home');
                setIsMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-gray-700 font-medium hover:text-purple-600"
            >
              Home
            </button>
            <Link href="/dashboard" className="block py-2 text-gray-700 font-medium hover:text-purple-600">
              Dashboard
            </Link>
            <button 
              onClick={() => {
                scrollToSection('features');
                setIsMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-gray-700 font-medium hover:text-purple-600"
            >
              Features
            </button>
            <button 
              onClick={() => {
                scrollToSection('how-it-works');
                setIsMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-gray-700 font-medium hover:text-purple-600"
            >
              How It Works
            </button>
            <button 
              onClick={() => {
                scrollToSection('pricing');
                setIsMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-gray-700 font-medium hover:text-purple-600"
            >
              Pricing
            </button>
            <Link href="/Pricing" className="block py-2 text-gray-700 font-medium hover:text-purple-600">
              Full Pricing
            </Link>

            <div className="border-t border-gray-200 my-2"></div>
            
            <SignedIn>
              <div className="flex items-center justify-center py-2">
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
            <SignedOut>
              <Link href="/sign-in" className="block py-2 text-gray-700 font-medium hover:text-purple-600">
                Login
              </Link>
              <Link
                href="/sign-up"
                className="block py-2 text-gray-700 font-medium bg-purple-50 rounded-lg text-center mt-2"
              >
                Sign-up
              </Link>
            </SignedOut>
          </div>
        </div>
      )}
    </nav>
  );
}
