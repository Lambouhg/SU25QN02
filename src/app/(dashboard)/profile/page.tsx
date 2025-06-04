"use client";

import Header from "@/components/Header";
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
      <>
        <Header />
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <button
            onClick={isEditing ? handleSubmit : () => setIsEditing(true)}
            className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
          >
            {isEditing ? "Save Changes" : "Edit Profile"}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    disabled={!isEditing}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    disabled={!isEditing}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Professional Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Current Position
                  </label>
                  <input
                    type="text"
                    value={formData.currentPosition}
                    onChange={(e) =>
                      setFormData({ ...formData, currentPosition: e.target.value })
                    }
                    disabled={!isEditing}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Experience Level
                  </label>
                  <select
                    value={formData.experienceLevel}
                    onChange={(e) =>
                      setFormData({ ...formData, experienceLevel: e.target.value })
                    }
                    disabled={!isEditing}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="junior">Junior (0-2 years)</option>
                    <option value="mid">Mid-Level (3-5 years)</option>
                    <option value="senior">Senior (6+ years)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
