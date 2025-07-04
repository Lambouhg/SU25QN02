'use client';

import React from 'react';
import { BarChart3, Users, Clock, TrendingUp } from 'lucide-react';
import AdminRouteGuard from '@/components/auth/AdminRouteGuard';
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout';

export default function AdminAnalyticsPage() {
  return (
    <AdminRouteGuard>
      <AdminDashboardLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics & Reports</h1>
            <p className="text-gray-600">Comprehensive system analytics and performance reports</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-3xl font-bold text-gray-900">1,247</p>
                </div>
                <Users className="h-12 w-12 text-green-500" />
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

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Analytics Coming Soon</h2>
            <p className="text-gray-600">Detailed analytics and reporting features will be available here.</p>
          </div>
        </div>
      </AdminDashboardLayout>
    </AdminRouteGuard>
  );
}
