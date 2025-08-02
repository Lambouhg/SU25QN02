"use client";

import { useState, useEffect } from 'react';
import { Activity, Users, Clock, Zap } from 'lucide-react';

interface UserActivityData {
  id: string;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    realTimeActivity: {
      isCurrentlyActive: boolean;
      isCurrentlyOnline: boolean;
      lastActivityText: string;
      lastActivityTimestamp: string;
    };
  };
  stats: {
    totalActivities: number;
    averageScore: number;
  };
}

interface ActivitySummary {
  totalUsers: number;
  currentlyActiveUsers: number;
  currentlyOnlineUsers: number;
  activeUsers: number;
}

export default function AdminActivityDashboard() {
  const [activities, setActivities] = useState<UserActivityData[]>([]);
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchActivityData = async () => {
    try {
      const response = await fetch('/api/admin/user-activities?limit=20');
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities);
        setSummary(data.summary);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchActivityData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Currently Active</p>
                <p className="text-2xl font-bold text-green-600">{summary.currentlyActiveUsers}</p>
                <p className="text-xs text-gray-500">Last 5 minutes</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Currently Online</p>
                <p className="text-2xl font-bold text-yellow-600">{summary.currentlyOnlineUsers}</p>
                <p className="text-xs text-gray-500">Last 15 minutes</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Weekly Active</p>
                <p className="text-2xl font-bold text-purple-600">{summary.activeUsers}</p>
                <p className="text-xs text-gray-500">Last 7 days</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Activity Table */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Real-time User Activity</h3>
            <div className="text-sm text-gray-500">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Activities
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Score
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activities.map((activity) => (
                <tr key={activity.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {activity.user.firstName} {activity.user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {activity.user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      activity.user.realTimeActivity.isCurrentlyActive
                        ? 'bg-green-100 text-green-800'
                        : activity.user.realTimeActivity.isCurrentlyOnline
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                        activity.user.realTimeActivity.isCurrentlyActive
                          ? 'bg-green-400'
                          : activity.user.realTimeActivity.isCurrentlyOnline
                          ? 'bg-yellow-400'
                          : 'bg-gray-400'
                      }`} />
                      {activity.user.realTimeActivity.isCurrentlyActive
                        ? 'Active'
                        : activity.user.realTimeActivity.isCurrentlyOnline
                        ? 'Online'
                        : 'Offline'
                      }
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {activity.user.realTimeActivity.lastActivityText}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {activity.stats.totalActivities}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {activity.stats.averageScore.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
