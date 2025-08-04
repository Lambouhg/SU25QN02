"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import Toast from "@/components/ui/Toast";
import {
  AvatarCard,
  ProfileLoading,
  ProfileTabs
} from "@/components/Profile";



export default function ProfilePage() {
  const { user, isLoaded, isSignedIn } = useUser();
  
  // Simplified state
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ 
    show: boolean; 
    message: string; 
    type: 'success' | 'error' | 'info' | 'warning' 
  }>({ show: false, message: '', type: 'info' });
  
  const [profileData, setProfileData] = useState({
    phone: "",
    department: "",
    position: "",
    bio: "",
  });

  // State for editable user info
  const [editableUserInfo, setEditableUserInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  // Update editable info when user changes
  useEffect(() => {
    setEditableUserInfo({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.emailAddresses?.[0]?.emailAddress || "",
    });
  }, [user?.firstName, user?.lastName, user?.emailAddresses]);

  // Combined form data
  const formData = useMemo(() => ({
    ...profileData,
    firstName: editableUserInfo.firstName,
    lastName: editableUserInfo.lastName,
    email: editableUserInfo.email,
  }), [profileData, editableUserInfo]);

  // Optimized profile fetch - only fetch additional data, not basic user info
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) return;
    
    let isMounted = true;
    
    const fetchAdditionalProfile = async () => {
      try {
        setIsLoading(true);
        
        const response = await fetch("/api/profile", {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (!response.ok) {
          // Silently fail - use default empty values
          return;
        }
        
        const data = await response.json();
        
        if (isMounted) {
          setProfileData({
            phone: data.phone || "",
            department: data.department || "",
            position: data.position || "",
            bio: data.bio || "",
          });
          
          // Also update editable user info with database values if they exist
          if (data.firstName !== undefined || data.lastName !== undefined) {
            setEditableUserInfo(prev => ({
              ...prev,
              firstName: data.firstName || prev.firstName,
              lastName: data.lastName || prev.lastName,
            }));
          }
        }
      } catch (error) {
        // Silently handle error - profile still works with basic data
        console.warn("Could not fetch additional profile data:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAdditionalProfile();
    
    return () => {
      isMounted = false;
    };
  }, [isLoaded, isSignedIn, user?.id]);

  const handleSubmit = async () => {
    if (!user?.id) return;
    
    try {
      setToast({ show: true, message: 'Saving...', type: 'info' });
      
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profileData,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          clerkId: user.id,
        }),
      });

      if (response.ok) {
        setIsEditing(false);
        setToast({ show: true, message: 'Saved successfully!', type: 'success' });
        
        // Cập nhật thông tin user trong Clerk nếu firstName/lastName thay đổi
        if (user.firstName !== formData.firstName || user.lastName !== formData.lastName) {
          try {
            await user.update({
              firstName: formData.firstName,
              lastName: formData.lastName
            });
            await user.reload();
          } catch (clerkError) {
            console.warn('Could not update Clerk user:', clerkError);
          }
        }
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setToast({ show: true, message: 'Save failed. Try again.', type: 'error' });
    }
  };

  const handleAvatarChange = async () => {
    if (user) {
      await user.reload();
      setToast({ show: true, message: 'Profile picture updated!', type: 'success' });
    }
  };

  const updateProfileData = (data: Record<string, string>) => {
    // Update profile fields
    const profileFields = ['phone', 'department', 'position', 'bio'];
    const profileUpdate: Partial<typeof profileData> = {};
    const userInfoUpdate: Partial<typeof editableUserInfo> = {};
    
    Object.keys(data).forEach(key => {
      if (profileFields.includes(key)) {
        (profileUpdate as Record<string, string>)[key] = data[key];
      } else if (['firstName', 'lastName', 'email'].includes(key)) {
        (userInfoUpdate as Record<string, string>)[key] = data[key];
      }
    });
    
    if (Object.keys(profileUpdate).length > 0) {
      setProfileData(prev => ({ ...prev, ...profileUpdate }));
    }
    
    if (Object.keys(userInfoUpdate).length > 0) {
      setEditableUserInfo(prev => ({ ...prev, ...userInfoUpdate }));
    }
  };

  // Show loading only for auth, not for additional profile data
  if (!isLoaded) {
    return (
      <DashboardLayout>
        <ProfileLoading isAuthenticating={true} />
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
                  firstName={formData.firstName}
                  lastName={formData.lastName}
                  onAvatarChange={handleAvatarChange}
                />
              </div>
            </div>

            {/* Right Column - Main Content */}
            <div className="xl:col-span-3 space-y-8">
              {/* Personal Information Card with Tabs */}
              <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Profile Management</h2>
                  {isLoading && (
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>Loading additional data...</span>
                    </div>
                  )}
                </div>
                
                <ProfileTabs
                  formData={{
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    phone: formData.phone,
                    department: formData.department,
                    position: formData.position,
                    bio: formData.bio
                  }}
                  isEditing={isEditing}
                  onDataChange={updateProfileData}
                  onEditToggle={() => setIsEditing(true)}
                  onSubmit={handleSubmit}
                  userId={user?.id}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

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