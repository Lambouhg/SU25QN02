'use client';

import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Award, Clock, Target} from 'lucide-react';
import StatisticsChart from '@/components/admin/StatisticsChart';
import AdminRouteGuard from '@/components/auth/AdminRouteGuard';


interface DashboardMetrics {
  totalUsers: number;
  averageScore: number;
  averageTime: number;
  completionRate: number;
}

interface RoleStats {
  totalUsers: number;
  adminUsers: number;
  regularUsers: number;
  adminPercentage: number;
  userPercentage: number;
}

export default function AdminDashboard() {
  // Helper function to get role name
  const getRoleName = (role: unknown): string => {
    if (typeof role === 'string') return role;
    if (role && typeof role === 'object' && 'name' in role) {
      return (role as { name: string }).name;
    }
    return 'user';
  };

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalUsers: 0, // Will be fetched from API
    averageScore: 8.2,
    averageTime: 25,
    completionRate: 78
  });
  
  const [loading, setLoading] = useState(true);
  const [roleStats, setRoleStats] = useState<RoleStats>({
    totalUsers: 0,
    adminUsers: 0,
    regularUsers: 0,
    adminPercentage: 0,
    userPercentage: 0
  });

  // Fetch total users from API
  const fetchUserMetrics = async () => {
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const data = await response.json();
        const users = data.users || [];
        
        setMetrics(prev => ({
          ...prev,
          totalUsers: users.length
        }));
        
        // Calculate role statistics
        const adminCount = users.filter((user: { role: string | { name: string } }) => {
          return getRoleName(user.role) === 'admin';
        }).length;
        const userCount = users.length - adminCount;
        const total = users.length || 1; // Avoid division by zero
        
        setRoleStats({
          totalUsers: users.length,
          adminUsers: adminCount,
          regularUsers: userCount,
          adminPercentage: Math.round((adminCount / total) * 100),
          userPercentage: Math.round((userCount / total) * 100)
        });
      }
    } catch (error) {
      console.error('Error fetching user metrics:', error);
    }
  };

  useEffect(() => {
    const initializeMetrics = async () => {
      await fetchUserMetrics();
      setLoading(false);
    };

    initializeMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
                <p className="text-gray-600">Manage and monitor AI interview system performance</p>
              </div>
              <button
                onClick={fetchUserMetrics}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                title="Refresh user metrics"
              >
                <TrendingUp className="w-4 h-4" />
                Refresh Data
              </button>
            </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  {loading ? (
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="text-xl font-bold text-gray-400">Loading...</span>
                    </div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{metrics.totalUsers.toLocaleString()}</p>
                  )}
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">Real-time data</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Score</p>
                  <p className="text-3xl font-bold text-gray-900">{metrics.averageScore}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Award className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+0.3 from last month</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Time</p>
                  <p className="text-3xl font-bold text-gray-900">{metrics.averageTime} min</p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-sm text-gray-500">Average interview time</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-3xl font-bold text-gray-900">{metrics.completionRate}%</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+5% from last month</span>
              </div>
            </div>
          </div>

          {/* Statistics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <StatisticsChart
              type="bar"
              title="Monthly Interview Trends"
              data={[
                { name: 'Jan', value: 120 },
                { name: 'Feb', value: 95 },
                { name: 'Mar', value: 180 },
                { name: 'Apr', value: 220 },
                { name: 'May', value: 190 },
                { name: 'Jun', value: 250 }
              ]}
            />
            {loading ? (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Role Distribution</h3>
                <div className="flex items-center justify-center h-[250px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-500">Loading chart...</span>
                </div>
              </div>
            ) : (
              <StatisticsChart
                type="pie"
                title="User Role Distribution"
                data={roleStats.totalUsers > 0 ? [
                  { name: 'Regular Users', value: roleStats.regularUsers },
                  { name: 'Admins', value: roleStats.adminUsers }
                ] : [
                  { name: 'No data', value: 1 }
                ]}
                height={250}
              />
            )}
           
          </div>
        </div>

        {/* User Modal */}
        {/* <AdminUserModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveUser}
          user={selectedUser}
          mode={modalMode}
        /> */}
      </div>
    </AdminRouteGuard>
  );
}
