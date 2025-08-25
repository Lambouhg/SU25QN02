'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, TrendingUp, Users, Clock, Package, DollarSign, Activity } from 'lucide-react';
import AdminRouteGuard from '@/components/auth/AdminRouteGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Toast from '@/components/ui/Toast';

interface PackageAnalytics {
  totalPackages: number;
  activePackages: number;
  totalRevenue: number;
  totalUsers: number;
  packageUsage: {
    packageId: string;
    packageName: string;
    userCount: number;
    revenue: number;
    isActive: boolean;
  }[];
  expiringPackages: {
    packageId: string;
    packageName: string;
    userCount: number;
    daysUntilExpiry: number;
  }[];
  monthlyRevenue: {
    month: string;
    revenue: number;
  }[];
}

export default function PackageAnalyticsPage() {
  const [analytics, setAnalytics] = useState<PackageAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [toast, setToast] = useState<{ 
    show: boolean; 
    message: string; 
    type: 'success' | 'error' | 'info' | 'warning' 
  }>({ 
    show: false, 
    message: '', 
    type: 'info' 
  });

    const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/packages/analytics?timeRange=${timeRange}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        showToast('Failed to fetch analytics data', 'error');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      showToast('Error fetching analytics data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setToast({ show: true, message, type });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  if (isLoading) {
    return (
      <AdminRouteGuard>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </AdminRouteGuard>
    );
  }

  if (!analytics) {
    return (
      <AdminRouteGuard>
        <div className="text-center py-12">
          <p className="text-gray-500">No analytics data available</p>
        </div>
      </AdminRouteGuard>
    );
  }

  return (
    <AdminRouteGuard>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Package Analytics</h1>
              <p className="text-gray-600">Comprehensive insights into package performance and usage</p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchAnalytics} variant="outline">
                <Activity className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(analytics.totalPackages)}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.activePackages} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                {timeRange} period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(analytics.totalUsers)}</div>
              <p className="text-xs text-muted-foreground">
                Active subscribers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.totalUsers > 0 
                  ? formatCurrency(analytics.totalRevenue / analytics.totalUsers)
                  : formatCurrency(0)
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Per user
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Package Usage Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Package Usage Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.packageUsage.map((pkg) => (
                  <div key={pkg.packageId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <div>
                        <p className="font-medium text-sm">{pkg.packageName}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant={pkg.isActive ? "default" : "secondary"}>
                            {pkg.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {pkg.userCount} users
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatCurrency(pkg.revenue)}</p>
                      <p className="text-xs text-gray-500">
                        {pkg.userCount > 0 ? formatCurrency(pkg.revenue / pkg.userCount) : formatCurrency(0)} per user
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Expiring Packages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Expiring Packages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.expiringPackages.length > 0 ? (
                  analytics.expiringPackages.map((pkg) => (
                    <div key={pkg.packageId} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <div>
                          <p className="font-medium text-sm">{pkg.packageName}</p>
                          <p className="text-xs text-orange-600">
                            {pkg.daysUntilExpiry} days until expiry
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive">
                          {pkg.daysUntilExpiry <= 7 ? 'Critical' : 
                           pkg.daysUntilExpiry <= 30 ? 'Warning' : 'Info'}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {pkg.userCount} users affected
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No packages expiring soon</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Revenue Chart */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2">
              {analytics.monthlyRevenue.map((month, index) => {
                const maxRevenue = Math.max(...analytics.monthlyRevenue.map(m => m.revenue));
                const height = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                      style={{ height: `${height}%` }}
                    ></div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      {month.month}
                    </p>
                    <p className="text-xs font-medium mt-1">
                      {formatCurrency(month.revenue)}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Toast
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      </div>
    </AdminRouteGuard>
  );
}
