'use client';

import React from 'react';
import { BarChart3, Clock, TrendingUp } from 'lucide-react';
import AdminRouteGuard from '@/components/auth/AdminRouteGuard';
import ActiveUsersMetrics from '@/components/admin/ActiveUsersMetrics';
import OnlineUsersList from '@/components/admin/OnlineUsersList';

export default function AdminAnalyticsPage() {
  return (
    <AdminRouteGuard>
      <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics & Reports</h1>
            <p className="text-gray-600">Real-time analytics and performance reports with optimized activity tracking</p>
          </div>

          {/* Active Users Metrics - Real Data từ Clerk */}
          <ActiveUsersMetrics autoRefresh={true} refreshInterval={30000} />

          {/* Grid Layout for Additional Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Online Users List */}
            <div className="lg:col-span-1">
              <OnlineUsersList maxUsers={15} refreshInterval={30000} />
            </div>

            {/* Other Metrics */}
            <div className="lg:col-span-2 space-y-6">
              {/* Other Static Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                      <p className="text-3xl font-bold text-gray-900">2,847</p>
                    </div>
                    <BarChart3 className="h-12 w-12 text-blue-500" />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg Session Time</p>
                      <p className="text-3xl font-bold text-gray-900">18m</p>
                    </div>
                    <Clock className="h-12 w-12 text-orange-500" />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Growth Rate</p>
                      <p className="text-3xl font-bold text-gray-900">+23%</p>
                    </div>
                    <TrendingUp className="h-12 w-12 text-purple-500" />
                  </div>
                </div>
              </div>

              {/* Advanced Analytics Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Advanced Analytics Coming Soon</h2>
                <p className="text-gray-600">Detailed analytics features including user behavior tracking, session analysis, and comprehensive reporting will be available here.</p>
              </div>
            </div>
          </div>
        </div>
    </AdminRouteGuard>
  );
}
