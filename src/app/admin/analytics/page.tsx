'use client';

import React from 'react';
import AdminRouteGuard from '@/components/auth/AdminRouteGuard';
import ActiveUsersMetrics from '@/components/admin/ActiveUsersMetrics';

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
          </div>
        </div>
    </AdminRouteGuard>
  );
}
