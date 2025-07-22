"use client";

import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Interview } from "@/components/InteractiveAvatar/InteractiveAvatar";

// Use dynamic import with SSR disabled for the InteractiveAvatar component
// since it depends on browser APIs
const InteractiveAvatar = dynamic(
  () => import("@/components/InteractiveAvatar/InteractiveAvatar"),
  { ssr: false }
);

export default function AvatarInterviewPage() {
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);

  const handleEndSession = (data: Interview) => {
    console.log('Interview ended:', data);
    setIsInterviewStarted(false);
  };

  const handleEndSessionClick = () => {
    setIsInterviewStarted(false);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-1xl mx-auto">
        
          
          {isInterviewStarted ? (
            // Interview Session View
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">AI Avatar Interview</h1>
                  <p className="text-gray-600 mt-1">Interview session in progress</p>
                </div>
                  <button
                    onClick={handleEndSessionClick}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    End Session
                  </button>
              </div>
              <InteractiveAvatar onEndSession={handleEndSession} />
            </div>
          ) : (
            // Welcome & Setup View
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex justify-end mb-4">
            <Link href="/avatar-interview/history">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all">History</button>
            </Link>
          </div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Avatar Interview Practice</h1>
                  <p className="text-gray-600 text-lg">
                    Practice your interview skills with our AI avatar interviewer and receive real-time feedback
                  </p>
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Voice Interaction</h3>
                  <p className="text-sm text-gray-600">Natural conversation with AI avatar using voice commands</p>
                </div>

                <div className="text-center p-6 bg-green-50 rounded-lg">
                  <div className="w-12 h-12 bg-green-500 rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Real-time Feedback</h3>
                  <p className="text-sm text-gray-600">Get instant feedback on your answers and performance</p>
                </div>

                <div className="text-center p-6 bg-purple-50 rounded-lg">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Customizable</h3>
                  <p className="text-sm text-gray-600">Choose interview type, difficulty level, and focus areas</p>
                </div>
              </div>

              {/* Tips Section */}
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Tips for Success
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-sm text-gray-700">Speak clearly and at a moderate pace</p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-sm text-gray-700">Maintain professional posture and eye contact</p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-sm text-gray-700">Use the STAR method for behavioral questions</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-sm text-gray-700">Practice common questions beforehand</p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-sm text-gray-700">Switch between voice and text modes as needed</p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-sm text-gray-700">Take your time to think before answering</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Start Button */}
              <div className="text-center">
                <button
                  onClick={() => setIsInterviewStarted(true)}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Start Avatar Interview
                </button>
                <p className="text-sm text-gray-500 mt-3">
                  The interview setup will guide you through configuration options
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
