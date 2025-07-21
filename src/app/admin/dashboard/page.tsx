'use client';

import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, Brain, FileDown, TrendingUp, Award, Clock, Target, Plus, Edit2, Trash2 } from 'lucide-react';
import AdminUserModal from '@/components/admin/AdminUserModal';
import StatisticsChart from '@/components/admin/StatisticsChart';
import AdminRouteGuard from '@/components/auth/AdminRouteGuard';

// Types
interface UserStats {
  id: string;
  name: string;
  email: string;
  totalInterviews: number;
  averageScore: number;
  lastActivity: string;
  status: 'active' | 'inactive';
  role: 'admin' | 'user';
}

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
        const adminCount = users.filter((user: { role: string }) => user.role === 'admin').length;
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
  }, []);

  const [users, setUsers] = useState<UserStats[]>([
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@mail.com',
      totalInterviews: 5,
      averageScore: 8.5,
      lastActivity: '2 days ago',
      status: 'active',
      role: 'user'
    },
    {
      id: '2', 
      name: 'Sarah Johnson',
      email: 'sarah.johnson@mail.com',
      totalInterviews: 3,
      averageScore: 7.8,
      lastActivity: '1 day ago',
      status: 'active',
      role: 'user'
    },
    {
      id: '3',
      name: 'Michael Brown',
      email: 'michael.brown@mail.com',
      totalInterviews: 8,
      averageScore: 9.2,
      lastActivity: '3 hours ago',
      status: 'active',
      role: 'admin'
    },
    {
      id: '4',
      name: 'Emily Davis',
      email: 'emily.davis@mail.com',
      totalInterviews: 2,
      averageScore: 6.9,
      lastActivity: '1 week ago',
      status: 'inactive',
      role: 'user'
    }
  ]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<UserStats | null>(null);

  // Functions
  const handleAddUser = () => {
    setModalMode('create');
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: UserStats) => {
    setModalMode('edit');
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(user => user.id !== userId));
      // Refresh metrics from database
      fetchUserMetrics();
    }
  };

  const handleSaveUser = (userData: Partial<UserStats>) => {
    if (modalMode === 'create') {
      const newUser: UserStats = {
        id: Date.now().toString(),
        name: userData.name || '',
        email: userData.email || '',
        totalInterviews: 0,
        averageScore: 0,
        lastActivity: 'Just now',
        status: userData.status || 'active',
        role: userData.role || 'user'
      };
      setUsers([...users, newUser]);
      
      // Refresh metrics from database
      fetchUserMetrics();
    } else if (selectedUser) {
      setUsers(users.map(user => 
        user.id === selectedUser.id 
          ? { ...user, ...userData }
          : user
      ));
    }
  };


  const testNotification = async () => {
    try {
      const response = await fetch('/api/admin/test-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'test_user_' + Date.now(),
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com'
        }),
      });

      if (response.ok) {
        alert('Test notification created successfully!');
      } else {
        alert('Failed to create test notification');
      }
    } catch (error) {
      console.error('Error creating test notification:', error);
      alert('Error creating test notification');
    }
  };

  const quickActions = [
    {
      icon: Users,
      title: 'Add New User',
      description: 'Create account for new user',
      color: 'bg-blue-500',
      action: handleAddUser
    },
    {
      icon: Users,
      title: 'Manage Users',
      description: 'View and manage user roles',
      color: 'bg-indigo-500',
      action: () => window.location.href = '/admin/users'
    },
    {
      icon: MessageSquare,
      title: 'Create Interview Questions',
      description: 'Create new question set for interviews',
      color: 'bg-purple-500',
      action: () => console.log('Create question')
    },
    {
      icon: Brain,
      title: 'AI Model Questions',
      description: 'Optimize evaluation algorithm',
      color: 'bg-green-500',
      action: () => console.log('AI Model')
    },
    {
      icon: FileDown,
      title: 'Export Report',
      description: 'Download detailed report',
      color: 'bg-orange-500',
      action: () => console.log('Export report')
    },
    {
      icon: MessageSquare,
      title: 'Test Notification',
      description: 'Create test notification',
      color: 'bg-red-500',
      action: testNotification
    }
  ];

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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
            {/* Left Sidebar - Quick Actions */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-4">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={action.action}
                      className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 group"
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`${action.color} rounded-lg p-2 group-hover:scale-110 transition-transform`}>
                          <action.icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">{action.title}</h4>
                          <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Center - User List */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Recent Users</h3>
                      <p className="text-sm text-gray-500 mt-1">List of users who have used the system recently</p>
                    </div>
                    <button
                      onClick={handleAddUser}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Add New
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900">{user.name}</h4>
                              {user.role === 'admin' && (
                                <span className="inline-flex px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                  Admin
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            <p className="text-xs text-gray-400">Activity: {user.lastActivity}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">{user.averageScore}/10</p>
                              <p className="text-xs text-gray-500">{user.totalInterviews} interviews</p>
                              <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                                user.status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {user.status === 'active' ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleEditUser(user)}
                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                              <button className="p-2 text-gray-400 hover:text-green-600 transition-colors" title="Export Report">
                                <FileDown className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Modal */}
        <AdminUserModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveUser}
          user={selectedUser}
          mode={modalMode}
        />
      </div>
    </AdminRouteGuard>
  );
}
