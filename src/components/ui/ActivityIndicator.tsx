"use client";

import { useClerkActivityOptimized } from '@/hooks/useClerkActivity-optimized';
import { useState } from 'react';

export default function ActivityIndicator() {
  const { isOnline, sessionDuration, isActiveSession, lastActivity, getSessionInfo } = useClerkActivityOptimized();
  const [showDebug, setShowDebug] = useState(false);

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString();
  };

  const sessionInfo = getSessionInfo();

  return (
    <div className="relative">
      <div 
        className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
        onClick={() => setShowDebug(!showDebug)}
        title="Click to show debug info"
      >
        <div className={`w-2 h-2 rounded-full ${
          isOnline && isActiveSession() ? 'bg-green-500' : 'bg-gray-400'
        }`} />
        <span className="hidden sm:inline">
          Session: {formatDuration(sessionDuration)}
        </span>
      </div>

      {/* Debug Panel */}
      {showDebug && (
        <div className="absolute top-full right-0 mt-2 p-4 bg-white border rounded-lg shadow-lg z-50 w-80 text-xs">
          <h4 className="font-bold mb-2 text-gray-800">Activity Debug Info</h4>
          <div className="space-y-1">
            <div><strong>Status:</strong> <span className={isOnline ? 'text-green-600' : 'text-red-600'}>{isOnline ? 'Online' : 'Offline'}</span></div>
            <div><strong>Active Session:</strong> <span className={isActiveSession() ? 'text-green-600' : 'text-orange-600'}>{isActiveSession() ? 'Yes' : 'No'}</span></div>
            <div><strong>Session Duration:</strong> {formatDuration(sessionDuration)}</div>
            <div><strong>Last Activity:</strong> {formatTime(lastActivity)}</div>
            <div><strong>User ID:</strong> {sessionInfo.userId || 'Not available'}</div>
            <div><strong>Email:</strong> {sessionInfo.email || 'Not available'}</div>
            <div><strong>Session ID:</strong> {sessionInfo.sessionId || 'Not available'}</div>
          </div>
          <button 
            onClick={() => {
              console.log('🔍 Activity Debug Info:', {
                isOnline,
                isActiveSession: isActiveSession(),
                sessionDuration,
                lastActivity,
                sessionInfo,
                localStorage: localStorage.getItem('lastActivity')
              });
            }}
            className="mt-3 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
          >
            Log to Console
          </button>
        </div>
      )}
    </div>
  );
}
