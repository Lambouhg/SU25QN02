"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminAnalytics from '@/components/admin/AdminAnalytics';
import UserActivitiesList from '@/components/admin/UserActivitiesList';
import UserActivityDetailView from '@/components/admin/UserActivityDetailView';
import AdminActivityDashboard from '@/components/admin/AdminActivityDashboard';
import { 
  BarChart3, 
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
        <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-gray-100 rounded-lg">
          <TabsTrigger 
            value="realtime" 
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Activity className="h-6 w-4" />
            <span className="font-medium">Real-time Activity</span>
          </TabsTrigger>
          <TabsTrigger 
            value="overview" 
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <BarChart3 className="h-6 w-4" />
            <span className="font-medium">Analytics Overview</span>
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

      </Tabs>
    </div>
  );
}
