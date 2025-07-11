"use client";

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { 
  Home, Brain, FileQuestion, LineChart, History, 
  Star, Users, Settings, Menu, X, Search, Bell
} from 'lucide-react';
import Link from 'next/link';
import { UserButton, useUser } from '@clerk/nextjs';
import Image from 'next/image';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useUser();
  
  // Function to check if a route is active
  const isActiveRoute = (href: string) => {
    if (href === '/dashboard' && pathname === '/dashboard') return true;
    if (href !== '/dashboard' && pathname.startsWith(href)) return true;
    return false;
  };

  // Function to check if any subroute is active
  const hasActiveSubItem = (subItems: { href: string }[]) => {
    return subItems.some(subItem => pathname.startsWith(subItem.href));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase() || 'U';
  };  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: Brain, label: 'Practice Modes', href: '/practice', subItems: [
      { label: 'Mock Interview (AI)', href: '/interview' },
      { label: 'Avatar Interview', href: '/avatar-interview' },
      { label: 'Quiz Mode', href: '/practice/quiz' },
      { label: 'Test Mode', href: '/test' },
      { label: 'EQ Test Mode', href: '/practice/eq' },
    ]},
    { icon: FileQuestion, label: 'JD to Questions', href: '/jd' },
    { icon: LineChart, label: 'Progress & Analytics', href: '/analytics' },
    { icon: History, label: 'Practice History', href: '/history' },
    { icon: Star, label: 'Saved Questions', href: '/saved' },
    { icon: Users, label: 'Community', href: '/community' },
    // { icon: Settings, label: 'Settings', href: '/profile' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200">
        <div className="px-4 py-3 lg:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-lg lg:hidden hover:bg-gray-100"
              >
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <Link href="/dashboard" className="flex items-center ml-2 lg:ml-0">
                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                    <path d="M8 12C8 9.79086 9.79086 8 12 8H14C16.2091 8 18 9.79086 18 12C18 14.2091 16.2091 16 14 16H12C9.79086 16 8 14.2091 8 12Z" fill="currentColor"/>
                  </svg>
                </div>
                <span className="ml-3 text-xl font-bold text-gray-900">InterviewAI</span>
              </Link>
            </div>

            <div className="flex-1 max-w-lg mx-4 hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="search"
                  placeholder="Search questions, exercises..."
                  className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 rounded-lg hover:bg-gray-100">
                <Bell className="w-6 h-6 text-gray-600" />
              </button>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </nav>      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-[61px] left-0 z-40 w-64 transition-transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`} style={{ height: 'calc(100vh - 61px)' }}>
        <div className="h-full bg-white border-r border-gray-200 flex flex-col">
          {/* Navigation Menu - Scrollable */}
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="space-y-2">
              {menuItems.map((item, index) => {
              const isActive = isActiveRoute(item.href);
              const hasActiveSub = item.subItems ? hasActiveSubItem(item.subItems) : false;
              const shouldHighlight = isActive || hasActiveSub;
              
              return (
                <li key={index}>                  <Link
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center p-3 rounded-lg group transition-colors ${
                      shouldHighlight 
                        ? 'bg-purple-50 text-purple-700 border-r-2 border-purple-600' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 transition-colors ${
                      shouldHighlight 
                        ? 'text-purple-600' 
                        : 'text-gray-500 group-hover:text-purple-600'
                    }`} />
                    <span className={`ml-3 text-sm font-medium ${
                      shouldHighlight ? 'font-semibold' : ''
                    }`}>
                      {item.label}
                    </span>
                  </Link>

                  {item.subItems && (
                    <ul className="pl-11 mt-2 space-y-2">
                      {item.subItems.map((subItem, subIndex) => {
                        const isSubActive = pathname.startsWith(subItem.href);
                        
                        return (
                          <li key={subIndex}>                            <Link
                              href={subItem.href}
                              onClick={() => setIsSidebarOpen(false)}
                              className={`flex items-center p-2 text-sm rounded-lg transition-colors ${
                                isSubActive 
                                  ? 'bg-purple-100 text-purple-700 font-medium' 
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {subItem.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
          </div>

          {/* User Profile Section - Fixed at Bottom */}
          <div className="flex-shrink-0 p-3 border-t border-gray-200 bg-white">
            <Link 
              href="/profile" 
              onClick={() => setIsSidebarOpen(false)}
              className="block"
            >
              <div className="p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 ring-2 ring-white shadow-sm">
                    {user?.imageUrl ? (
                      <Image
                        src={user.imageUrl}
                        alt="Profile"
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                        {getInitials(user?.fullName || 'User')}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.fullName || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      Manage your account
                    </p>
                  </div>
                  <Settings className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64 mt-[61px]">
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
