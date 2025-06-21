"use client";

import { 
  Brain, FileText,
  TestTube, FileQuestion, TrendingUp,
  Clock, Award, Users, Play
} from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here&apos;s an overview of your interview activities.</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">              <div>
                <p className="text-sm text-gray-600 mb-1">Total Interviews</p>
                <p className="text-2xl font-bold text-gray-900">24</p>
                <p className="text-sm text-green-600">+2% vs last month</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">              <div>
                <p className="text-sm text-gray-600 mb-1">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">8.2</p>
                <p className="text-sm text-green-600">+0.5 points improvement</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Award className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">              <div>
                <p className="text-sm text-gray-600 mb-1">Avg Duration</p>
                <p className="text-2xl font-bold text-gray-900">25 min</p>
                <p className="text-sm text-green-600">-3 min interview time</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">              <div>
                <p className="text-sm text-gray-600 mb-1">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">78%</p>
                <p className="text-sm text-green-600">+5% pass rate</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Quick Actions */}
          <div className="space-y-6">            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <p className="text-sm text-gray-600 mb-6">Frequently used features</p>
              
              <div className="grid grid-cols-2 gap-4">
                <Link href="/avatar-interview" 
                  className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all group">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <Brain className="w-6 h-6 text-blue-600" />
                  </div>                  <span className="text-sm font-medium text-gray-900 text-center">AI Avatar Interview</span>
                  <span className="text-xs text-gray-500 mt-1">Interview with AI Avatar</span>
                  <button className="mt-3 px-4 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors">
                    Start Now
                  </button>
                </Link>

                <Link href="/practice/quiz" 
                  className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-pink-500 hover:shadow-md transition-all group">
                  <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-3">
                    <FileQuestion className="w-6 h-6 text-pink-600" />
                  </div>                  <span className="text-sm font-medium text-gray-900 text-center">Practice Quiz</span>
                  <span className="text-xs text-gray-500 mt-1">Learn technical concepts</span>
                  <button className="mt-3 px-4 py-2 bg-pink-600 text-white text-xs rounded-lg hover:bg-pink-700 transition-colors">
                    View Now
                  </button>
                </Link>

                <Link href="/test" 
                  className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-purple-500 hover:shadow-md transition-all group">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                    <TestTube className="w-6 h-6 text-purple-600" />
                  </div>                  <span className="text-sm font-medium text-gray-900 text-center">Test Mode</span>
                  <span className="text-xs text-gray-500 mt-1">Check your Test score</span>
                  <button className="mt-3 px-4 py-2 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors">
                    Take Test
                  </button>
                </Link>

                <Link href="/jd" 
                  className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-orange-500 hover:shadow-md transition-all group">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                    <FileText className="w-6 h-6 text-orange-600" />
                  </div>                  <span className="text-sm font-medium text-gray-900 text-center">AI with JD</span>
                  <span className="text-xs text-gray-500 mt-1">Assess professional skills</span>
                  <button className="mt-3 px-4 py-2 bg-orange-600 text-white text-xs rounded-lg hover:bg-orange-700 transition-colors">
                    Get Started
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column - Progress */}
          <div className="space-y-6">            {/* Skill Analysis */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Skill Analysis</h3>
              <p className="text-sm text-gray-600 mb-6">Competency scores by skill area</p>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-700">Communication</span>
                    <span className="text-gray-900 font-medium">85%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className="h-2 bg-blue-500 rounded-full" style={{width: "85%"}}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-700">Technical Skills</span>
                    <span className="text-gray-900 font-medium">92%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className="h-2 bg-green-500 rounded-full" style={{width: "92%"}}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-700">Problem Solving</span>
                    <span className="text-gray-900 font-medium">78%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className="h-2 bg-purple-500 rounded-full" style={{width: "78%"}}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-700">Leadership</span>
                    <span className="text-gray-900 font-medium">70%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className="h-2 bg-orange-500 rounded-full" style={{width: "70%"}}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-700">Teamwork</span>
                    <span className="text-gray-900 font-medium">88%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className="h-2 bg-indigo-500 rounded-full" style={{width: "88%"}}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-700">Emotional Intelligence</span>
                    <span className="text-gray-900 font-medium">82%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className="h-2 bg-pink-500 rounded-full" style={{width: "82%"}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>        {/* Recent Interview Records */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Recent Interviews</h3>
              <p className="text-sm text-gray-600">List of your latest interview sessions</p>
            </div>
            <Link href="/history" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </Link>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">NB</span>
                </div>                <div>
                  <p className="font-medium text-gray-900">Nguyen Thi B</p>
                  <p className="text-sm text-gray-500">Frontend Developer</p>
                  <p className="text-xs text-gray-400">AI Avatar • 2024-01-15</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">8.5/10</p>
                  <p className="text-xs text-gray-500">Score</p>
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                    Completed
                  </button>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <Play className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-green-600">VC</span>
                </div>                <div>
                  <p className="font-medium text-gray-900">Tran Van C</p>
                  <p className="text-sm text-gray-500">Backend Developer</p>
                  <p className="text-xs text-gray-400">Video Call • 2024-01-14</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-lg font-bold text-yellow-600">7.8/10</p>
                  <p className="text-xs text-gray-500">Score</p>
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700">
                    Completed
                  </button>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <Play className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-purple-600">LD</span>
                </div>                <div>
                  <p className="font-medium text-gray-900">Le Thi D</p>
                  <p className="text-sm text-gray-500">UX Designer</p>
                  <p className="text-xs text-gray-400">EQ Test • 2024-01-13</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">9.2/10</p>
                  <p className="text-xs text-gray-500">Score</p>
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">
                    Completed
                  </button>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <Play className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-orange-600">VE</span>
                </div>                <div>
                  <p className="font-medium text-gray-900">Pham Van E</p>
                  <p className="text-sm text-gray-500">Product Manager</p>
                  <p className="text-xs text-gray-400">AI Avatar • 2024-01-12</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">Pending</p>
                  <p className="text-xs text-gray-500"></p>
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded">
                    Pending
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Suggestions - Hidden for now to match design */}
        {/* <div className="grid md:grid-cols-2 gap-6">
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-4">AI Coach Suggestions</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-xl">
                <BrainIcon className="w-6 h-6 text-purple-500 mt-1" />
                <div>
                  <p className="text-gray-900 font-medium mb-1">Focus on STAR Method</p>
                  <p className="text-sm text-gray-600">Your answers could be more structured. Practice using the STAR method for behavioral questions.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl">
                <BrainIcon className="w-6 h-6 text-blue-500 mt-1" />
                <div>
                  <p className="text-gray-900 font-medium mb-1">Technical Deep Dives</p>
                  <p className="text-sm text-gray-600">Consider diving deeper into system design questions to strengthen your architectural knowledge.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Activities</h3>
              <Link href="/history" className="text-sm text-purple-600 hover:text-purple-700 font-medium">View All</Link>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-gray-900 font-medium">System Design Interview</p>
                  <p className="text-sm text-gray-600">Completed • 2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-gray-900 font-medium">JavaScript Quiz</p>
                  <p className="text-sm text-gray-600">Score: 85% • Yesterday</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-gray-900 font-medium">Mock Interview Session</p>
                  <p className="text-sm text-gray-600">Behavioral Questions • 2 days ago</p>
                </div>
              </div>
            </div>
          </section>
        </div> */}
      </div>
    </DashboardLayout>
  );
}
