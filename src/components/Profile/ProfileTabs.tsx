"use client";

import React, { useState, useEffect } from "react";
import PersonalInfoForm from "./PersonalInfoForm";
import ActivityHistory from "./ActivityHistory";
import PaymentHistory from "./PaymentHistory";
import InterviewPreferencesForm from "./InterviewPreferencesForm";
import SkillsManagement from "./SkillsManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/animated-tabs";
import { User, Activity, CreditCard, Settings, Code } from "lucide-react";
import { useJobRoles } from "@/hooks/useJobRoles";
import { syncSkills, loadMergedSkills } from "@/utils/skillsSync";

interface ProfileTabsProps {
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    department: string;
    preferredJobRoleId: string;
    bio: string;
  };
  isEditing: boolean;
  onDataChange: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    department: string;
    preferredJobRoleId: string;
    bio: string;
  }) => void;
  onEditToggle: () => void;
  onSubmit: () => void;
  userId?: string;
}

export default function ProfileTabs({
  formData,
  isEditing,
  onDataChange,
  onEditToggle,
  onSubmit,
  userId
}: ProfileTabsProps) {
  const { jobRoles, isLoading: jobRolesLoading, error: jobRolesError } = useJobRoles();
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);

  // Load user skills when component mounts
  useEffect(() => {
    const loadUserSkills = async () => {
      try {
        setSkillsLoading(true);
        // Load merged skills from both sources
        const mergedSkills = await loadMergedSkills();
        setUserSkills(mergedSkills);
      } catch (error) {
        console.error('Error loading user skills:', error);
        // Fallback to basic user skills
        const response = await fetch('/api/user/current');
        if (response.ok) {
          const userData = await response.json();
          setUserSkills(Array.isArray(userData.skills) ? userData.skills : []);
        }
      } finally {
        setSkillsLoading(false);
      }
    };

    loadUserSkills();
  }, []);

  const handleSkillsChange = async (newSkills: string[]) => {
    try {
      setUserSkills(newSkills);
      const result = await syncSkills({ 
        skills: newSkills, 
        syncToInterviewPreferences: true 
      });
      
      if (result.success) {
        // Notify other components about the update
        window.dispatchEvent(new Event('preferences-updated'));
        localStorage.setItem('preferences-updated', Date.now().toString());
      } else {
        console.error('Failed to sync skills:', result.error);
        // Revert on error
        const mergedSkills = await loadMergedSkills();
        setUserSkills(mergedSkills);
      }
    } catch (error) {
      console.error('Error saving skills:', error);
      // Revert on error
      const mergedSkills = await loadMergedSkills();
      setUserSkills(mergedSkills);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="personal">
        <TabsList>
          <TabsTrigger value="personal">
            <User className="w-5 h-5 mr-3" />
            <span className="hidden sm:inline">Personal Info</span>
            <span className="sm:hidden text-xs">Personal</span>
          </TabsTrigger>
          <TabsTrigger value="skills">
            <Code className="w-5 h-5 mr-3" />
            <span className="hidden sm:inline">Skills</span>
            <span className="sm:hidden text-xs">Skills</span>
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="w-5 h-5 mr-3" />
            <span className="hidden sm:inline">Activity</span>
            <span className="sm:hidden text-xs">Activity</span>
          </TabsTrigger>
          <TabsTrigger value="payment">
            <CreditCard className="w-5 h-5 mr-3" />
            <span className="hidden sm:inline">Payment</span>
            <span className="sm:hidden text-xs">Payment</span>
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Settings className="w-5 h-5 mr-3" />
            <span className="hidden sm:inline">Interview</span>
            <span className="sm:hidden text-xs">Interview</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <div className="min-h-[500px] transition-all duration-300">
            <PersonalInfoForm
              formData={formData}
              isEditing={isEditing}
              onDataChange={onDataChange}
              onEditToggle={onEditToggle}
              onSubmit={onSubmit}
            />
          </div>
        </TabsContent>

        <TabsContent value="skills">
          <div className="min-h-[500px] transition-all duration-300">
            <div className="bg-white rounded-lg border p-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Technical Skills</h3>
                <p className="text-sm text-gray-600">
                  Manage your technical skills and areas of expertise
                </p>
              </div>
              {skillsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading skills...</span>
                </div>
              ) : (
                <SkillsManagement
                  skills={userSkills}
                  isEditing={true}
                  onSkillsChange={handleSkillsChange}
                />
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="activity">
          <div className="min-h-[500px] transition-all duration-300">
            <ActivityHistory userId={userId} />
          </div>
        </TabsContent>
        
        <TabsContent value="payment">
          <div className="min-h-[500px] transition-all duration-300">
            <PaymentHistory userId={userId} />
          </div>
        </TabsContent>
        
        <TabsContent value="preferences">
          <div className="min-h-[500px] transition-all duration-300">
            {jobRolesLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading...</span>
              </div>
            ) : jobRolesError ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-red-600">Error: {jobRolesError}</div>
              </div>
            ) : (
              <InterviewPreferencesForm 
                jobRoles={jobRoles}
                onSave={async (preferences) => {
                  console.log('Preferences saved:', preferences);
                  // Sync skills between User.skills and interviewPreferences.selectedSkills
                  if (preferences.interviewPreferences?.selectedSkills) {
                    // Reload merged skills to reflect all changes
                    const mergedSkills = await loadMergedSkills();
                    setUserSkills(mergedSkills);
                  }
                }}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
