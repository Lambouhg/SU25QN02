"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminAnalytics from '@/components/admin/AdminAnalytics';
import UserActivitiesList from '@/components/admin/UserActivitiesList';
import UserActivityDetailView from '@/components/admin/UserActivityDetailView';
import AdminActivityDashboard from '@/components/admin/AdminActivityDashboard';
import { 
  BarChart3, 
  Users, 
  Settings,
  Eye,
  Edit,
  Trash2,
  Activity
} from 'lucide-react';

export default function AdminUserActivitiesPage() {
  const [activeTab, setActiveTab] = useState('realtime');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

  const showToast = (title: string, description: string) => {
    // Simple alert for now - you can replace this with a proper toast component
    alert(`${title}: ${description}`);
  };

  const handleViewDetails = (userId: string) => {
    setSelectedUserId(userId);
    setViewMode('detail');
  };

  const handleEditUser = async (userId: string) => {
    // For now, just show a toast. In a real app, you'd open an edit modal
    showToast(
      "Edit User Activity",
      "Opening user activity editor..."
    );
    
    // Placeholder: You could open a modal or navigate to an edit page
    console.log('Edit user activity for userId:', userId);
  };

  const handleDeleteUser = async (userId: string) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      'Are you sure you want to delete this user\'s activity data? This action cannot be undone.'
    );
    
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/user-activities/${userId}/manage?type=all&confirm=true`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        showToast(
          "Success",
          "User activity data deleted successfully."
        );
        
        // Refresh the list or update state as needed
        window.location.reload(); // Simple refresh for now
      } else {
        showToast(
          "Error",
          result.error || "Failed to delete user activity data."
        );
      }
    } catch (error) {
      console.error('Error deleting user activity:', error);
      showToast(
        "Error",
        "An unexpected error occurred."
      );
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedUserId(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">User Activity Management</h1>
        <p className="text-gray-600 mt-2">
          Monitor, analyze, and manage user activities and learning progress across the platform.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="realtime" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Real-time Activity
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Activities
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Activity Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="realtime" className="space-y-6">
          <AdminActivityDashboard />
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <AdminAnalytics />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {viewMode === 'list' ? (
            <UserActivitiesList
              onViewDetails={handleViewDetails}
              onEditUser={handleEditUser}
              onDeleteUser={handleDeleteUser}
            />
          ) : selectedUserId ? (
            <UserActivityDetailView
              userId={selectedUserId}
              onBack={handleBackToList}
            />
          ) : null}
        </TabsContent>

        <TabsContent value="management" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button 
                  onClick={() => setActiveTab('users')}
                  className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium">View All User Activities</div>
                  <div className="text-sm text-gray-600">Browse and search user activities</div>
                </button>
                
                <button 
                  onClick={() => setActiveTab('overview')}
                  className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium">Analytics Dashboard</div>
                  <div className="text-sm text-gray-600">View platform-wide statistics</div>
                </button>
              </div>
            </div>

            {/* Bulk Operations */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Edit className="h-5 w-5 text-green-600" />
                Bulk Operations
              </h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                  <div className="font-medium">Export All Data</div>
                  <div className="text-sm text-gray-600">Download comprehensive activity reports</div>
                </button>
                
                <button className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                  <div className="font-medium">Reset Inactive Users</div>
                  <div className="text-sm text-gray-600">Clear data for inactive accounts</div>
                </button>
              </div>
            </div>

            {/* System Health */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                System Health
              </h3>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="font-medium text-green-800">Activity Tracking</div>
                  <div className="text-sm text-green-600">All systems operational</div>
                </div>
                
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="font-medium text-blue-800">Data Sync</div>
                  <div className="text-sm text-blue-600">Last sync: 2 minutes ago</div>
                </div>
                
                <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <div className="font-medium text-yellow-800">Storage Usage</div>
                  <div className="text-sm text-yellow-600">78% of allocated space</div>
                </div>
              </div>
            </div>
          </div>

          {/* Management Tools */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Data Management Tools</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">User Activity Controls</h4>
                <div className="space-y-2">
                  <button className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <div className="font-medium">Archive Old Activities</div>
                    <div className="text-sm text-gray-600">Move activities older than 1 year to archive</div>
                  </button>
                  
                  <button className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <div className="font-medium">Recalculate Statistics</div>
                    <div className="text-sm text-gray-600">Refresh all user statistics and scores</div>
                  </button>
                  
                  <button className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <div className="font-medium">Generate Reports</div>
                    <div className="text-sm text-gray-600">Create detailed analytics reports</div>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">System Maintenance</h4>
                <div className="space-y-2">
                  <button className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <div className="font-medium">Clean Up Orphaned Data</div>
                    <div className="text-sm text-gray-600">Remove activities without valid user references</div>
                  </button>
                  
                  <button className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <div className="font-medium">Optimize Database</div>
                    <div className="text-sm text-gray-600">Rebuild indexes and optimize queries</div>
                  </button>
                  
                  <button className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <div className="font-medium">Backup Activity Data</div>
                    <div className="text-sm text-gray-600">Create full backup of all activity data</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
