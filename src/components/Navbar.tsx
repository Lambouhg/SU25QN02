"use client";

import { Search, ChevronDown, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
        <Link href="#" className="text-white font-medium hover:text-white/80 transition-colors">
          Home
        </Link>
        <Link href="/dashboard" className="text-white font-medium hover:text-white/80 transition-colors">
          Dashboard
        </Link>
        <div className="relative group">
          <button className="text-white font-medium flex items-center hover:text-white/80 transition-colors">
            Features <ChevronDown className="ml-1 w-4 h-4 transition-transform group-hover:rotate-180" />
          </button>
          <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
            <Link href="#" className="block px-4 py-2 text-gray-700 hover:bg-purple-50">Feature 1</Link>
            <Link href="#" className="block px-4 py-2 text-gray-700 hover:bg-purple-50">Feature 2</Link>
            <Link href="#" className="block px-4 py-2 text-gray-700 hover:bg-purple-50">Feature 3</Link>
          </div>
        </div>
        <Link href="#" className="text-white font-medium hover:text-white/80 transition-colors">
          Pricing
        </Link>
        <div className="relative group">
          <button className="text-white font-medium flex items-center hover:text-white/80 transition-colors">
            Resources <ChevronDown className="ml-1 w-4 h-4 transition-transform group-hover:rotate-180" />
          </button>
          <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
            <Link href="#" className="block px-4 py-2 text-gray-700 hover:bg-purple-50">Resource 1</Link>
            <Link href="#" className="block px-4 py-2 text-gray-700 hover:bg-purple-50">Resource 2</Link>
            <Link href="#" className="block px-4 py-2 text-gray-700 hover:bg-purple-50">Resource 3</Link>
          </div>
        </div>
      </div>

      {/* Search and Auth */}
      <div className="hidden md:flex items-center space-x-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white w-5 h-5" />
          <input
            type="text"
            placeholder="Search"
            className="pl-10 pr-4 py-2 rounded-full bg-white/10 text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20 transition-all w-48"
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
          <Link href="/sign-in" className="text-white font-medium hover:text-white/80 transition-colors">
            Login
          </Link>
          <Link
            href="/sign-up"
            className="bg-white text-purple-600 px-6 py-2.5 rounded-full font-medium hover:bg-white/90 transition-colors"
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
        <div className="md:hidden absolute top-14 inset-x-0 z-50 bg-purple-600 border-t border-purple-500/20">
          <div className="p-4">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 rounded-full bg-white/10 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>
            </div>
            <Link href="#" className="block py-2 text-white font-medium">Home</Link>
            <Link href="/dashboard" className="block py-2 text-white font-medium">Dashboard</Link>
            <Link href="#" className="block py-2 text-white font-medium">Features</Link>
            <Link href="#" className="block py-2 text-white font-medium">Pricing</Link>
            <Link href="#" className="block py-2 text-white font-medium">Resources</Link>
            <div className="border-t border-purple-500/20 my-2"></div>
            <SignedIn>
              <div className="flex items-center justify-center py-2">
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
            <SignedOut>
              <Link href="/sign-in" className="block py-2 text-white font-medium">Đăng nhập</Link>
              <Link
                href="/sign-up"
                className="block py-2 text-white font-medium bg-white/10 rounded-lg text-center mt-2"
              >
                Đăng ký
              </Link>
            </SignedOut>
          </div>
        </div>
      )}
    </nav>
  );
}
