"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect, useCallback } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import Toast from "@/components/ui/Toast";
import {
  PersonalInfoForm,
  AvatarCard,
  ProfileLoading
} from "@/components/Profile";

export default function ProfilePage() {  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const [isEditing, setIsEditing] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning' }>({ show: false, message: '', type: 'info' });
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    department: "",
    position: "",
    bio: "",    skills: ["React", "TypeScript", "Next.js", "JavaScript", "Node.js"],
    joinDate: "05/15/2023",
    lastLogin: "Today, 10:45 AM",
    status: "Active"
  });const [isLoading, setIsLoading] = useState(true);const fetchProfile = useCallback(async () => {
    // Wait for Clerk to fully load and authenticate
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn || !user) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/profile", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.text();
          // If it's a 401, the API auth isn't working, so use default values
        if (response.status === 401) {
          setFormData({
            fullName: user?.fullName || "",
            email: user?.emailAddresses?.[0]?.emailAddress || "",
            phone: "",
            department: "",
            position: "",
            bio: "",
            skills: ["React", "TypeScript", "Next.js", "JavaScript", "Node.js"],
            joinDate: "05/15/2023",
            lastLogin: "Today, 10:45 AM",
            status: "Active"
          });
          setIsLoading(false);
          return;
        }
        
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }
      
      const data = await response.json();
      
      setFormData({
        fullName: data.fullName || user?.fullName || "",
        email: data.email || user?.emailAddresses?.[0]?.emailAddress || "",
        phone: data.phone || "",
        department: data.department || "",
        position: data.position || "",
        bio: data.bio || "",        skills: data.skills || ["React", "TypeScript", "Next.js", "JavaScript", "Node.js"],
        joinDate: data.joinDate || "05/15/2023",
        lastLogin: data.lastLogin || "Today, 10:45 AM",
        status: data.status || "Active"
      });
    } catch (error) {
      console.error("Error fetching profile:", error);      // Set default values if fetch fails
      setFormData({
        fullName: user?.fullName || "",
        email: user?.emailAddresses?.[0]?.emailAddress || "",
        phone: "",
        department: "",
        position: "",
        bio: "",
        skills: ["React", "TypeScript", "Next.js", "JavaScript", "Node.js"],
        joinDate: "05/15/2023",
        lastLogin: "Today, 10:45 AM",
        status: "Active"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, isLoaded, isSignedIn]);useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (isLoaded) {
      // Add a small delay to ensure auth is fully settled
      timeoutId = setTimeout(() => {
        fetchProfile();
      }, 100);
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [fetchProfile, isLoaded]);  const handleSubmit = async () => {
    try {
      setToast({ show: true, message: 'Saving information...', type: 'info' });
      
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
        setIsEditing(false);        setToast({ show: true, message: 'Information saved successfully!', type: 'success' });
      } else {
        setToast({ show: true, message: 'Error saving information. Please try again.', type: 'error' });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setToast({ show: true, message: 'Error saving information. Please try again.', type: 'error' });
    }
  };
  // const handleLogout = () => {
  //   setShowLogoutConfirm(true);
  // };

  const confirmLogout = async () => {
    try {
      setShowLogoutConfirm(false);
      setToast({ show: true, message: 'Signing out...', type: 'info' });
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      setToast({ show: true, message: 'Error signing out. Please try again.', type: 'error' });
    }
  };

  // Handler for avatar changes
  const handleAvatarChange = async () => {
    // Reload user data to get updated avatar
    if (user) {
      await user.reload();
      setToast({ show: true, message: 'Profile picture updated successfully!', type: 'success' });
    }
  };if (!isLoaded || isLoading) {
    return (
      <DashboardLayout>
        <ProfileLoading isAuthenticating={!isLoaded} />
      </DashboardLayout>
    );
  }

  if (!isSignedIn) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center">
            <p>You need to sign in to view this page.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (    <DashboardLayout>
      {/* Modern Gradient Background */}
      <div>
        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Modern Header with Glass Effect */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                  Profile Settings
                </h1>
                <p className="text-lg text-gray-600 mt-2">
                  Manage your personal information and account preferences
                </p>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-600">Online</span>
                </div>
                {isEditing && (
                  <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium animate-bounce">
                    Editing Mode
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Left Column - Avatar & Quick Stats */}
            <div className="xl:col-span-1 space-y-6">
              {/* Enhanced Avatar Card */}
              <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <AvatarCard
                  user={user}
                  fullName={formData.fullName}
                  onAvatarChange={handleAvatarChange}
                />
              </div>
              {/* Account Information
              <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300">
                <AccountInfo
                  accountData={{
                    joinDate: formData.joinDate,
                    lastLogin: formData.lastLogin,
                    status: formData.status
                  }}
                />
              </div> */}

              {/* Quick Actions
              <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300">
                <QuickActions
                  onLogout={handleLogout}
                />
              </div> */}
            </div>

            {/* Right Column - Main Content */}
            <div className="xl:col-span-3 space-y-8">
              {/* Personal Information Card */}
              <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                </div>
                
                <PersonalInfoForm
                  formData={{
                    fullName: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                    department: formData.department,
                    position: formData.position,
                    bio: formData.bio
                  }}
                  isEditing={isEditing}
                  onDataChange={(data) => setFormData({ ...formData, ...data })}
                  onEditToggle={() => setIsEditing(true)}
                  onSubmit={handleSubmit}
                />
              </div>

              {/* Skills Section
              <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Skills & Expertise</h2>
                </div>
                <SkillsManagement
                  skills={formData.skills}
                  isEditing={isEditing}
                  onSkillsChange={(skills) => setFormData({ ...formData, skills })}
                />
              </div> */}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}        title="Confirm Sign Out"
        message="Are you sure you want to sign out of your account? You will need to sign in again to continue using the service."
        confirmText="Sign Out"
        cancelText="Cancel"
        type="warning"
      />

      {/* Toast Notifications */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
        duration={3000}
      />
    </DashboardLayout>
  );
}