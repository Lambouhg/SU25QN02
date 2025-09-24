'use client';

import React from 'react';
import DetailedProgressDashboard from '@/components/dashboard/DetailedProgressDashboard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function DetailedAnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Detailed Progress Analytics</h1>
              <p className="text-lg text-gray-600">
                Comprehensive analysis and insights into your learning journey
              </p>
            </div>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Link href="/avatar-interview">
            <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer border-2 hover:border-blue-200">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <div className="h-5 w-5 bg-green-600 rounded-full"></div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Start Interview</h4>
                  <p className="text-sm text-gray-600">Practice with AI</p>
                </div>
              </div>
            </Card>
          </Link>
          
          <Link href="/review">
            <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer border-2 hover:border-blue-200">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Review Questions</h4>
                  <p className="text-sm text-gray-600">Study materials</p>
                </div>
              </div>
            </Card>
          </Link>
          
          <Link href="/profile">
            <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer border-2 hover:border-blue-200">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <div className="h-5 w-5 bg-purple-600 rounded"></div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Profile Settings</h4>
                  <p className="text-sm text-gray-600">Preferences</p>
                </div>
              </div>
            </Card>
          </Link>
          
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900">Analytics</h4>
                <p className="text-sm text-blue-700">Current page</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Dashboard */}
        <DetailedProgressDashboard />

        {/* Tips and Help */}
        <Card className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200">
          <div className="text-center mb-6">
            <h4 className="text-xl font-semibold text-gray-900 mb-2">
              💡 Tips for Better Progress Tracking
            </h4>
            <p className="text-gray-600">Make the most of your analytics dashboard</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-green-100 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <span className="text-green-600 font-bold">1</span>
              </div>
              <h5 className="font-semibold text-gray-900 mb-2">Practice Regularly</h5>
              <p className="text-sm text-gray-600">
                Maintain consistency in your learning to see meaningful trends and improvements in your analytics.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <h5 className="font-semibold text-gray-900 mb-2">Review Insights</h5>
              <p className="text-sm text-gray-600">
                Check the Insights tab regularly for personalized recommendations and achievement updates.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <h5 className="font-semibold text-gray-900 mb-2">Set Goals</h5>
              <p className="text-sm text-gray-600">
                Use the performance comparison to set realistic goals and track your progress toward them.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}