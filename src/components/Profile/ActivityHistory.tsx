"use client";

import { useState, useEffect, useCallback, useRef, memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Clock, MessageSquare, TrendingUp, BookOpen, Target, Search, Filter, ChevronDown, ChevronUp } from "lucide-react";

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

function ActivityHistory({ }: ActivityHistoryProps) {
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showSummary, setShowSummary] = useState(true);
  const hasFetchedRef = useRef(false);
  const itemsPerPage = 10;

  const fetchActivityHistory = useCallback(async () => {
    // Prevent multiple calls
    if (hasFetchedRef.current) {
      return;
    }
    
    console.log('🔄 Fetching activity history...'); // Debug log
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
      setError(null);
      
      // Fetch from API
      const response = await fetch("/api/tracking");
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform the data to match our ActivityData interface
      const transformedActivities: ActivityData[] = [];
      
      // Add activities from the API response
      if (data.activities && Array.isArray(data.activities)) {
        data.activities.forEach((activity: Record<string, unknown>, index: number) => {
          const activityDetails = parseActivityDetails(activity);
          transformedActivities.push({
            id: `activity-${index}`,
            type: activityDetails.type,
            description: activityDetails.description,
            timestamp: activity.timestamp as string || new Date().toISOString(),
            score: activityDetails.score,
            duration: activityDetails.duration,
            details: activity
          });
        });
      }
      
      // Add recent activities if available
      if (data.recentActivities && Array.isArray(data.recentActivities)) {
        data.recentActivities.forEach((activity: Record<string, unknown>, index: number) => {
          const activityDetails = parseActivityDetails(activity);
          transformedActivities.push({
            id: `recent-${index}`,
            type: activityDetails.type,
            description: activityDetails.description,
            timestamp: activity.timestamp as string || new Date().toISOString(),
            score: activityDetails.score,
            duration: activityDetails.duration,
            details: activity
          });
        });
      }
      
      // Handle different data structures from API
      if (data.stats && typeof data.stats === 'object') {
        // If we have stats but no activities, create activity entries from stats
        const stats = data.stats as Record<string, unknown>;
        if (stats.totalInterviews && Number(stats.totalInterviews) > 0) {
          transformedActivities.push({
            id: 'stats-interviews',
            type: 'Interview',
            description: `Completed ${stats.totalInterviews} interview practices`,
            timestamp: new Date().toISOString(),
            score: stats.averageScore ? Number(stats.averageScore) : undefined,
            details: stats
          });
        }
        
        if (stats.totalStudyTime && Number(stats.totalStudyTime) > 0) {
          transformedActivities.push({
            id: 'stats-study',
            type: 'Study',
            description: `Total study time: ${Math.round(Number(stats.totalStudyTime) / 60)} minutes`,
            timestamp: new Date().toISOString(),
            duration: Number(stats.totalStudyTime),
            details: stats
          });
        }
      }
      
      // Sort by timestamp (newest first)
      transformedActivities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      setActivities(transformedActivities);
      
    } catch (error) {
      console.error("Error fetching activity history:", error);
      setError("Không thể tải lịch sử hoạt động. Vui lòng thử lại sau.");
      setActivities([]);
    } finally {
      setIsLoading(false);
      hasFetchedRef.current = true; // Mark as fetched
    }
  }, []);

  useEffect(() => {
    if (!hasFetchedRef.current) {
      fetchActivityHistory();
    }
  }, [fetchActivityHistory]); // Include fetchActivityHistory in dependency array

  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "quiz":
        return Target;
      case "interview":
        return MessageSquare;
      case "study":
        return BookOpen;
      case "practice":
        return TrendingUp;
      case "assessment":
        return Activity;
      default:
        return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "quiz":
        return "text-blue-500 bg-blue-100";
      case "interview":
        return "text-green-500 bg-green-100";
      case "study":
        return "text-purple-500 bg-purple-100";
      case "practice":
        return "text-orange-500 bg-orange-100";
      case "assessment":
        return "text-red-500 bg-red-100";
      default:
        return "text-gray-500 bg-gray-100";
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) {
        return "Vừa xong";
      } else if (diffInHours < 24) {
        return `${diffInHours} giờ trước`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays} ngày trước`;
      }
    } catch {
      return "Unknown time";
    }
  };

  // Filter and sort activities
  const filteredAndSortedActivities = activities
    .filter(activity => {
      // Filter by search term
      if (searchTerm && !activity.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      // Filter by type
      if (filterType !== "all" && activity.type.toLowerCase() !== filterType.toLowerCase()) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case "oldest":
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        case "score":
          return (b.score || 0) - (a.score || 0);
        case "type":
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, sortBy]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Lịch sử hoạt động
          </CardTitle>
          <CardDescription>Theo dõi tất cả hoạt động gần đây của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Đang tải...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Lịch sử hoạt động
          </CardTitle>
          <CardDescription>Theo dõi tất cả hoạt động gần đây của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchActivityHistory} variant="outline">
              Thử lại
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const paginatedActivities = filteredAndSortedActivities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Lịch sử hoạt động
        </CardTitle>
        <CardDescription>Theo dõi tất cả hoạt động gần đây của bạn</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Controls */}
        {activities.length > 0 && (
          <div className="mb-6 space-y-4">
            {/* Search and Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Tìm kiếm hoạt động..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Lọc theo loại" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="study">Study</SelectItem>
                    <SelectItem value="practice">Practice</SelectItem>
                    <SelectItem value="assessment">Assessment</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sắp xếp" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Mới nhất</SelectItem>
                    <SelectItem value="oldest">Cũ nhất</SelectItem>
                    <SelectItem value="score">Điểm cao nhất</SelectItem>
                    <SelectItem value="type">Theo loại</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Hiển thị {filteredAndSortedActivities.length} / {activities.length} hoạt động
                {searchTerm && ` với từ khóa "${searchTerm}"`}
                {filterType !== "all" && ` - ${filterType}`}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSummary(!showSummary)}
                className="text-gray-600"
              >
                {showSummary ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {showSummary ? "Ẩn thống kê" : "Hiện thống kê"}
              </Button>
            </div>
          </div>
        )}

        {/* Activity Summary */}
        {activities.length > 0 && showSummary && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {activities.filter(a => a.type === 'Quiz').length}
                </div>
                <div className="text-sm text-gray-600">Quiz</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {activities.filter(a => a.type === 'Interview').length}
                </div>
                <div className="text-sm text-gray-600">Interviews</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {activities.filter(a => a.type === 'Study').length}
                </div>
                <div className="text-sm text-gray-600">Study Sessions</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {activities.filter(a => a.type === 'Practice').length}
                </div>
                <div className="text-sm text-gray-600">Practice</div>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          {filteredAndSortedActivities.length === 0 ? (
            <div className="text-center py-8">
              {activities.length === 0 ? (
                <>
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">No activities yet</p>
                    <p className="text-sm text-gray-500">Start using the system to see your activity history</p>
                  </>
                  ) : (
                  <>
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">No activities found</p>
                    <p className="text-sm text-gray-500">Try changing the filters or search keywords</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => {
                      setSearchTerm("");
                      setFilterType("all");
                      setSortBy("newest");
                    }}
                  >
                    Xóa bộ lọc
                  </Button>
                </>
              )}
            </div>
          ) : (
            paginatedActivities.map((activity, index) => {
              const IconComponent = getActivityIcon(activity.type);
              const colorClasses = getActivityColor(activity.type);
              
              return (
                <div key={activity.id}>
                  <div className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className={`p-2 rounded-full ${colorClasses}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{activity.description}</p>
                      {activity.score && (
                        <p className="text-sm text-gray-600 mt-1">
                          Điểm số: <span className="font-semibold text-green-600">{activity.score}%</span>
                        </p>
                      )}
                      {activity.duration && (
                        <p className="text-sm text-gray-600 mt-1">
                          Thời gian: <span className="font-semibold text-blue-600">{activity.duration} phút</span>
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                  {index < paginatedActivities.length - 1 && <Separator className="my-2" />}
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {filteredAndSortedActivities.length > itemsPerPage && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <p className="text-sm text-gray-600">
              Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredAndSortedActivities.length)} của {filteredAndSortedActivities.length} hoạt động
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage * itemsPerPage >= filteredAndSortedActivities.length}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default memo(ActivityHistory, (prevProps, nextProps) => {
  // Only re-render if userId changes
  return prevProps.userId === nextProps.userId;
});
