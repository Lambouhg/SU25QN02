"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";

interface ActivityData {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  score?: number;
  duration?: number;
  details?: Record<string, unknown>;
}

interface ActivityHistoryProps {
  userId?: string;
}

export default function ActivityHistory({ }: ActivityHistoryProps) {
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchActivityHistory = useCallback(async () => {
    // Helper function to parse activity details
    const parseActivityDetails = (activity: Record<string, unknown>) => {
      const type = activity.type as string;
      const score = activity.score as number;
      const duration = activity.duration as number;
      
      let activityType = "Activity";
      let description = "User activity";
      
      switch (type) {
        case "quiz":
          activityType = "Quiz";
          description = `Completed quiz${score ? ` with ${score}% score` : ""}`;
          break;
        case "interview":
          activityType = "Interview";
          description = `Completed interview practice${score ? ` (Score: ${score}%)` : ""}`;
          break;
        case "study":
          activityType = "Study";
          description = `Study session${duration ? ` (${Math.round(duration / 60)} min)` : ""}`;
          break;
        case "practice":
          activityType = "Practice";
          description = `Practice session${score ? ` (Score: ${score}%)` : ""}`;
          break;
        case "assessment":
          activityType = "Assessment";
          description = `Assessment completed${score ? ` (Score: ${score}%)` : ""}`;
          break;
        default:
          if (activity.referenceId) {
            description = `Activity: ${type || "Unknown"}`;
          } else {
            description = "General activity";
          }
          break;
      }
      
      return {
        type: activityType,
        description,
        score,
        duration
      };
    };

    try {
      setIsLoading(true);
      const response = await fetch("/api/tracking");
      
      if (!response.ok) {
        throw new Error("Failed to fetch activity history");
      }
      
      const data = await response.json();
      
      // Transform the data to match our ActivityData interface
      const transformedActivities: ActivityData[] = [];
      
      // Add activities from the API response
      if (data.activities) {
        data.activities.forEach((activity: Record<string, unknown>, index: number) => {
          const activityDetails = parseActivityDetails(activity);
          transformedActivities.push({
            id: `activity-${index}`,
            type: activityDetails.type,
            description: activityDetails.description,
            timestamp: activity.timestamp as string,
            score: activityDetails.score,
            duration: activityDetails.duration,
            details: activity
          });
        });
      }
      
      // Add recent activities
      if (data.recentActivities) {
        data.recentActivities.forEach((activity: Record<string, unknown>, index: number) => {
          const activityDetails = parseActivityDetails(activity);
          transformedActivities.push({
            id: `recent-${index}`,
            type: activityDetails.type,
            description: activityDetails.description,
            timestamp: activity.timestamp as string,
            score: activityDetails.score,
            duration: activityDetails.duration,
            details: activity
          });
        });
      }
      
      // Sort by timestamp (newest first)
      transformedActivities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      setActivities(transformedActivities);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching activity history:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivityHistory();
  }, [fetchActivityHistory]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "Interview":
        return "🎤";
      case "Quiz":
        return "📝";
      case "Study":
        return "📚";
      case "Practice":
        return "🏋️";
      case "Assessment":
        return "📊";
      case "Activity":
        return "⚡";
      default:
        return "�";
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "Interview":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Quiz":
        return "bg-green-100 text-green-800 border-green-200";
      case "Study":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Practice":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Assessment":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "Activity":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Activity History</h3>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading activity history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Activity History</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-500 text-xl mr-3">⚠️</span>
            <div>
              <h4 className="text-red-800 font-medium">Error loading activity history</h4>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchActivityHistory}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(activities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentActivities = activities.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Activity History</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
          <span>{activities.length} total activities</span>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Activity Yet</h4>
          <p className="text-gray-600">Start using the platform to see your activity history here.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {currentActivities.map((activity) => (
              <div
                key={activity.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getActivityColor(
                            activity.type
                          )}`}
                        >
                          {activity.type}
                        </span>
                        <span className="text-sm text-gray-500">
                          {format(new Date(activity.timestamp), "MMM dd, yyyy 'at' HH:mm")}
                        </span>
                      </div>
                      <p className="text-gray-900 font-medium">{activity.description}</p>
                      {activity.score && (
                        <p className="text-sm text-gray-600 mt-1">Score: {activity.score}%</p>
                      )}
                      {activity.duration && (
                        <p className="text-sm text-gray-600 mt-1">
                          Duration: {Math.round(activity.duration / 60)} minutes
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <div className="text-sm text-gray-500">
                Showing {startIndex + 1} to {Math.min(endIndex, activities.length)} of{" "}
                {activities.length} activities
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
