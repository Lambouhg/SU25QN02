"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
 import { useCallback } from "react";
export default function ProfilePage() {
  const { user } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    currentPosition: "",
    experienceLevel: "mid",
    preferredInterviewTypes: [],
  });
  const [isLoading, setIsLoading] = useState(true);

 

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch("/api/profile");
      const data = await response.json();
      setFormData({
        fullName: data.fullName || user?.fullName || "",
        email: data.email || user?.emailAddresses?.[0]?.emailAddress || "",
        currentPosition: data.currentPosition || "",
        experienceLevel: data.experienceLevel || "mid",
        preferredInterviewTypes: data.preferredInterviewTypes || [],
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSubmit = async () => {
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          clerkId: user?.id,
        }),
      });

      if (response.ok) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute top-1/2 -left-32 w-80 h-80 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full opacity-10 blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header with floating design */}
          <div className="text-center mb-12">            <div className="relative inline-block">
              <div className="w-32 h-32 mx-auto bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-full p-1 shadow-2xl">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden">
                  {user?.imageUrl ? (
                    <img 
                      src={user.imageUrl} 
                      alt={formData.fullName || 'User Avatar'} 
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                      {formData.fullName.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
            <h1 className="mt-6 text-4xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent">
              {formData.fullName || 'Your Profile'}
            </h1>
            <p className="mt-2 text-xl text-gray-600">{formData.currentPosition || 'Complete your profile to get started'}</p>
            
            {/* Experience level badge */}
            <div className="mt-4 inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold shadow-lg">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              {formData.experienceLevel === 'junior' ? 'Junior Professional' : 
               formData.experienceLevel === 'mid' ? 'Mid-Level Expert' : 'Senior Specialist'}
            </div>

            {/* Action button */}
            <div className="mt-8">
              <button
                onClick={isEditing ? handleSubmit : () => setIsEditing(true)}
                className={`inline-flex items-center px-8 py-4 text-lg font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl ${
                  isEditing 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700' 
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'
                }`}
              >
                {isEditing ? (
                  <>
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Profile
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Edit Profile
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Two-column layout with modern cards */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Left Column - Profile Information */}
            <div className="space-y-8">
              {/* Personal Information Card */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Personal Info</h2>
                      <p className="text-gray-500">Your basic information</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        disabled={!isEditing}
                        className={`w-full px-6 py-4 text-lg rounded-2xl border-2 transition-all duration-300 ${
                          isEditing 
                            ? 'border-indigo-200 bg-white hover:border-indigo-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100' 
                            : 'border-gray-200 bg-gray-50 text-gray-700'
                        }`}
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={!isEditing}
                        className={`w-full px-6 py-4 text-lg rounded-2xl border-2 transition-all duration-300 ${
                          isEditing 
                            ? 'border-purple-200 bg-white hover:border-purple-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-100' 
                            : 'border-gray-200 bg-gray-50 text-gray-700'
                        }`}
                        placeholder="Enter your email address"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Information Card */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Career Info</h2>
                      <p className="text-gray-500">Your professional details</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <span className="w-2 h-2 bg-pink-500 rounded-full mr-3"></span>
                        Current Position
                      </label>
                      <input
                        type="text"
                        value={formData.currentPosition}
                        onChange={(e) => setFormData({ ...formData, currentPosition: e.target.value })}
                        disabled={!isEditing}
                        className={`w-full px-6 py-4 text-lg rounded-2xl border-2 transition-all duration-300 ${
                          isEditing 
                            ? 'border-pink-200 bg-white hover:border-pink-400 focus:border-pink-500 focus:ring-4 focus:ring-pink-100' 
                            : 'border-gray-200 bg-gray-50 text-gray-700'
                        }`}
                        placeholder="e.g. Senior Software Engineer"
                      />
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                        Experience Level
                      </label>
                      <select
                        value={formData.experienceLevel}
                        onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                        disabled={!isEditing}
                        className={`w-full px-6 py-4 text-lg rounded-2xl border-2 transition-all duration-300 ${
                          isEditing 
                            ? 'border-orange-200 bg-white hover:border-orange-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100' 
                            : 'border-gray-200 bg-gray-50 text-gray-700'
                        }`}
                      >
                        <option value="junior">🌱 Junior Level (0-2 years)</option>
                        <option value="mid">🚀 Mid Level (3-5 years)</option>
                        <option value="senior">⭐ Senior Level (6+ years)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Stats and Analytics */}
            <div className="space-y-8">
              {/* Profile Completion */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Profile Strength</h3>
                    <p className="text-gray-500">Complete your profile for better recommendations</p>
                  </div>

                  {/* Circular Progress */}
                  <div className="relative w-48 h-48 mx-auto mb-8">
                    <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 200 200">
                      <circle
                        cx="100"
                        cy="100"
                        r="80"
                        stroke="#e5e7eb"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="100"
                        cy="100"
                        r="80"
                        stroke="url(#gradient)"
                        strokeWidth="12"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${((formData.fullName ? 1 : 0) + (formData.email ? 1 : 0) + (formData.currentPosition ? 1 : 0) + (formData.experienceLevel ? 1 : 0)) / 4 * 502.4} 502.4`}
                        className="transition-all duration-500"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-gray-900">
                          {Math.round(((formData.fullName ? 1 : 0) + (formData.email ? 1 : 0) + (formData.currentPosition ? 1 : 0) + (formData.experienceLevel ? 1 : 0)) / 4 * 100)}%
                        </div>
                        <div className="text-sm text-gray-500 font-medium">Complete</div>
                      </div>
                    </div>
                  </div>                  {/* Completion checklist */}
                  <div className="space-y-4">
                    {[
                      { field: 'fullName' as keyof typeof formData, label: 'Full Name', icon: '👤' },
                      { field: 'email' as keyof typeof formData, label: 'Email', icon: '📧' },
                      { field: 'currentPosition' as keyof typeof formData, label: 'Position', icon: '💼' },
                      { field: 'experienceLevel' as keyof typeof formData, label: 'Experience', icon: '⭐' }
                    ].map((item) => (
                      <div key={item.field} className={`flex items-center p-4 rounded-2xl transition-all duration-300 ${
                        formData[item.field] ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50 border-2 border-gray-200'
                      }`}>
                        <span className="text-2xl mr-4">{item.icon}</span>
                        <span className={`font-semibold ${formData[item.field] ? 'text-green-700' : 'text-gray-500'}`}>
                          {item.label}
                        </span>
                        <div className="ml-auto">
                          {formData[item.field] ? (
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Quick Actions</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 hover:border-blue-400 transition-all duration-300 group">
                      <div className="text-3xl mb-2">🎯</div>
                      <div className="text-sm font-semibold text-blue-700">Practice Interview</div>
                    </button>
                    
                    <button className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200 hover:border-purple-400 transition-all duration-300 group">
                      <div className="text-3xl mb-2">📊</div>
                      <div className="text-sm font-semibold text-purple-700">View Progress</div>
                    </button>
                    
                    <button className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-200 hover:border-emerald-400 transition-all duration-300 group">
                      <div className="text-3xl mb-2">💡</div>
                      <div className="text-sm font-semibold text-emerald-700">Get Tips</div>
                    </button>
                    
                    <button className="p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl border-2 border-orange-200 hover:border-orange-400 transition-all duration-300 group">
                      <div className="text-3xl mb-2">🎓</div>
                      <div className="text-sm font-semibold text-orange-700">Learn More</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>        </div>
      </div>
    </DashboardLayout>
  );
}