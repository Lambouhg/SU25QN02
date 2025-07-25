'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { User, Clock, RefreshCw } from 'lucide-react';

interface OnlineUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  avatar?: string;
  lastActivity: string;
}

interface OnlineUsersListProps {
  maxUsers?: number;
  refreshInterval?: number;
}

export default function OnlineUsersList({ 
  maxUsers = 10, 
  refreshInterval = 30000 
}: OnlineUsersListProps) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [error, setError] = useState<string>('');

  const fetchOnlineUsers = async () => {
    try {
      setError('');
      const response = await fetch('/api/admin/online-users');
      if (response.ok) {
        const data = await response.json();
        setOnlineUsers(Array.isArray(data.users) ? data.users : []);
        setLastUpdate(data.timestamp || new Date().toISOString());
      } else {
        console.error('Failed to fetch online users:', response.status);
        setOnlineUsers([]);
        setError('Failed to load online users');
      }
    } catch (error) {
      console.error('Error fetching online users:', error);
      setOnlineUsers([]);
      setError('Network error occurred');
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      await fetchOnlineUsers();
      setLoading(false);
    };

    initializeData();

    // Auto refresh
    const interval = setInterval(fetchOnlineUsers, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date().getTime();
    const time = new Date(timestamp).getTime();
    const diffInSeconds = Math.floor((now - time) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    return `${Math.floor(diffInSeconds / 3600)}h ago`;
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Online Users</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-3 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Currently Online ({(onlineUsers || []).length})
        </h3>
        <button
          onClick={fetchOnlineUsers}
          className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {!onlineUsers || onlineUsers.length === 0 ? (
        <div className="text-center py-8">
          <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          {error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <p className="text-gray-500">No users currently online</p>
          )}
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {(onlineUsers || []).slice(0, maxUsers).map((user) => (
            <div key={user._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  {user.avatar ? (
                    <Image
                      src={user.avatar}
                      alt={`${user.firstName} ${user.lastName}`}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {getInitials(user.firstName, user.lastName)}
                    </div>
                  )}
                  {/* Online indicator */}
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user.email.split('@')[0]
                    }
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
              
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="h-3 w-3 mr-1" />
                {formatTimeAgo(user.lastActivity)}
              </div>
            </div>
          ))}
        </div>
      )}

      {lastUpdate && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            Last updated: {new Date(lastUpdate).toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
}
