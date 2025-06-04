"use client";

import { 
  LineChart, Brain, FileText, Brain as BrainIcon,
  Play, ClipboardList, TestTube, FileQuestion 
} from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Continue Practicing Section */}
        <section className="bg-purple-600 text-white rounded-2xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Continue Your Practice</h2>
              <p className="text-purple-100 mb-4">Mock Interview: Software Engineer</p>
              <button className="inline-flex items-center bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors">
                Resume Session <Play className="w-4 h-4 ml-2" />
              </button>
            </div>
            <Brain className="w-16 h-16 text-purple-300" />
          </div>
        </section>

        {/* Progress Section */}
        <section className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Your Progress</h3>
              <LineChart className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Communication</span>
                  <span className="text-gray-900 font-medium">85%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div className="h-2 bg-green-500 rounded-full" style={{width: "85%"}}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Technical Skills</span>
                  <span className="text-gray-900 font-medium">70%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div className="h-2 bg-blue-500 rounded-full" style={{width: "70%"}}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Problem Solving</span>
                  <span className="text-gray-900 font-medium">92%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div className="h-2 bg-purple-500 rounded-full" style={{width: "92%"}}></div>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-900">24</p>
                  <p className="text-sm text-gray-600">Sessions Completed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">12.5h</p>
                  <p className="text-sm text-gray-600">Total Practice Time</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Start Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-4">Quick Start</h3>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/practice/mock-interview" 
                className="flex flex-col items-center p-4 rounded-xl border border-gray-200 hover:border-purple-500 hover:shadow-md transition-all group">
                <Brain className="w-8 h-8 text-purple-500 mb-2" />
                <span className="text-sm font-medium text-gray-900">AI Interview</span>
              </Link>
              <Link href="/practice/quiz" 
                className="flex flex-col items-center p-4 rounded-xl border border-gray-200 hover:border-purple-500 hover:shadow-md transition-all group">
                <ClipboardList className="w-8 h-8 text-purple-500 mb-2" />
                <span className="text-sm font-medium text-gray-900">Take Quiz</span>
              </Link>
              <Link href="/practice/eq-test" 
                className="flex flex-col items-center p-4 rounded-xl border border-gray-200 hover:border-purple-500 hover:shadow-md transition-all group">
                <TestTube className="w-8 h-8 text-purple-500 mb-2" />
                <span className="text-sm font-medium text-gray-900">EQ Test</span>
              </Link>
              <Link href="/jd-questions" 
                className="flex flex-col items-center p-4 rounded-xl border border-gray-200 hover:border-purple-500 hover:shadow-md transition-all group">
                <FileQuestion className="w-8 h-8 text-purple-500 mb-2" />
                <span className="text-sm font-medium text-gray-900">Upload JD</span>
              </Link>
            </div>
          </div>
        </section>

        {/* AI Suggestions & Recent Activities */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* AI Suggestions */}
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

          {/* Recent Activities */}
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
        </div>
      </div>
    </DashboardLayout>
  );
}
