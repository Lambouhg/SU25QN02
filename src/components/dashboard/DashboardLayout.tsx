"use client";

import { useState, useMemo, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { 
  Home, Brain, FileQuestion, LineChart, History, 
  Star, Settings, Menu, X, Search, Bell, LogOut, Shield,
  ChevronRight, ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { UserButton, useUser, useClerk } from '@clerk/nextjs';
import Image from 'next/image';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Toast from '@/components/ui/Toast';
import { useRole } from '@/context/RoleContext';
import { useRoleInvalidation } from '@/hooks/useRoleInvalidation';
import ActivityIndicator from '@/components/ui/ActivityIndicator';
import ActivityTestPanel from '@/components/debug/ActivityTestPanel';


export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['practice']); // Mặc định mở Practice Modes
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [toast, setToast] = useState<{ 
    show: boolean; 
    message: string; 
    type: 'success' | 'error' | 'info' | 'warning' 
  }>({ show: false, message: '', type: 'info' });
  
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { isAdmin } = useRole();
  
  // Listen for role invalidation signals
  useRoleInvalidation();
  
  // Memoize menu items để tránh re-render không cần thiết
  const menuItems = useMemo(() => [
    { 
      icon: Home, 
      label: 'Dashboard', 
      href: '/dashboard',
      key: 'dashboard'
    },
    { 
      icon: Brain, 
      label: 'Practice Modes', 
      key: 'practice',
      subItems: [
        { label: 'Avatar Interview', href: '/avatar-interview' },
        { label: 'Quiz Mode', href: '/quiz' },
        { label: 'Test Mode', href: '/test' },
        { label: 'EQ Test Mode', href: '/eq' },
      ]
    },
    { 
      icon: FileQuestion, 
      label: 'JD to Questions', 
      href: '/jd',
      key: 'jd'
    },
    { 
      icon: LineChart, 
      label: 'Progress & Analytics', 
      href: '/tracking',
      key: 'tracking'
    },
    { 
      icon: History, 
      label: 'History Quiz', 
      href: '/history',
      key: 'history'
    },
    { 
      icon: Star, 
      label: 'Saved Questions', 
      href: '/saved',
      key: 'saved'
    },

  ], []);

  // Optimized logout function
  const confirmLogout = useCallback(async () => {
    try {
      setShowLogoutConfirm(false);
      setToast({ show: true, message: 'Signing out...', type: 'info' });
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      setToast({ show: true, message: 'Sign out failed.', type: 'error' });
    }
  }, [signOut]);
  
  // Optimized route checking functions
  const isActiveRoute = useCallback((href: string) => {
    if (!pathname) return false;
    if (href === '/dashboard' && pathname === '/dashboard') return true;
    if (href !== '/dashboard' && pathname.startsWith(href)) return true;
    return false;
  }, [pathname]);

  const hasActiveSubItem = useCallback((subItems: { href: string }[]) => {
    if (!pathname) return false;
    return subItems.some(subItem => pathname.startsWith(subItem.href));
  }, [pathname]);

  // Optimized menu toggle function
  const toggleMenu = useCallback((menuKey: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuKey) 
        ? prev.filter(key => key !== menuKey)
        : [...prev, menuKey]
    );
  }, []);

  // Optimized initials function
  const getInitials = useCallback((name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase() || 'U';
  }, []);

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
              
              {/* Admin Panel Access - Only show for admins */}
              {isAdmin && (
                <Link
                  href="/admin/dashboard"
                  className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg"
                >
                  <Shield className="w-4 h-4" />
                  Admin Panel
                </Link>
              )}
              {/* Activity Indicator */}
              <ActivityIndicator />
              
              {/* Sign Out Button */}
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
              
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Overlay */}
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
                const isActive = item.href ? isActiveRoute(item.href) : false;
                const hasActiveSub = item.subItems ? hasActiveSubItem(item.subItems) : false;
                const shouldHighlight = isActive || hasActiveSub;
                const isExpanded = item.subItems && expandedMenus.includes(item.key);
                
                return (
                  <li key={index}>
                    {item.subItems ? (
                      <>
                        <button
                          onClick={() => toggleMenu(item.key)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg group transition-colors ${
                            shouldHighlight 
                              ? 'bg-purple-50 text-purple-700 border-r-2 border-purple-600' 
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center">
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
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                        </button>

                        {isExpanded && (
                          <ul className="pl-11 mt-2 space-y-1">
                            {item.subItems.map((subItem, subIndex) => {
                              const isSubActive = pathname.startsWith(subItem.href);
                              
                              return (
                                <li key={subIndex}>
                                  <Link
                                    href={subItem.href}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={`flex items-center p-2 text-sm rounded-lg transition-colors ${
                                      isSubActive 
                                        ? 'bg-purple-100 text-purple-700 font-medium' 
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                                  >
                                    {subItem.label}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </>
                    ) : (
                      <Link
                        href={item.href || '#'}
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
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Premium Upgrade Card */}
          <div className="px-3 pb-4">
            <Link href="/payment" className="block">
              <div className="relative p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white overflow-hidden group cursor-pointer transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                
                {/* Content */}
                <div className="relative z-10">
                  {/* Crown Icon */}
                  <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-yellow-800" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732L14.146 12.8l-1.179 4.456a1 1 0 01-1.934 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732L9.854 7.2l1.179-4.456A1 1 0 0112 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  
                  {/* Text */}
                  <h3 className="text-sm font-bold mb-1">Upgrade to Premium</h3>
                  <p className="text-xs text-blue-100 mb-3 leading-relaxed">
                    Unlock unlimited interviews and advanced features
                  </p>
                  
                  {/* CTA Button */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">Upgrade Now</span>
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Separator */}
          <div className="px-3 pb-4">
            <div className="border-t border-gray-200"></div>
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
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500 truncate">
                        Manage your account
                      </p>
                    </div>
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

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Confirm Sign Out"
        message="Are you sure you want to sign out of your account? You will need to sign in again to continue using the service."
        confirmText="Sign Out"
        cancelText="Cancel"
        type="warning"
      />

      {/* Toast Notifications */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
        duration={3000}
      />

      {/* Activity Test Panel (Debug Only) */}
      {process.env.NODE_ENV === 'development' && <ActivityTestPanel />}
      
    </div>
  );
}
