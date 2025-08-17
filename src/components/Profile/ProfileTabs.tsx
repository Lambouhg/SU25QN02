"use client";

import React, { useState } from "react";
import PersonalInfoForm from "./PersonalInfoForm";
import ActivityHistory from "./ActivityHistory";
import PaymentHistory from "./PaymentHistory";
import InterviewPreferencesForm from "./InterviewPreferencesForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Activity, CreditCard, Settings } from "lucide-react";
import { useJobRoles } from "@/hooks/useJobRoles";

interface ProfileTabsProps {
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    department: string;
    position: string;
    bio: string;
  };
  isEditing: boolean;
  onDataChange: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    department: string;
    position: string;
    bio: string;
  }) => void;
  onEditToggle: () => void;
  onSubmit: () => void;
  userId?: string;
}

type TabType = "personal" | "activity" | "payment" | "preferences";

export default function ProfileTabs({
  formData,
  isEditing,
  onDataChange,
  onEditToggle,
  onSubmit,
  userId
}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("personal");
  const { jobRoles, isLoading: jobRolesLoading, error: jobRolesError } = useJobRoles();

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="space-y-6">
      <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4 bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl p-1 shadow-inner">
        <TabsTrigger 
          value="personal" 
          className="flex items-center gap-2 data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-gray-200"
        >
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">Thông tin</span>
          <span className="sm:hidden text-xs">Thông tin</span>
        </TabsTrigger>
        <TabsTrigger 
          value="activity" 
          className="flex items-center gap-2 data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-gray-200"
        >
          <Activity className="w-4 h-4" />
          <span className="hidden sm:inline">Hoạt động</span>
          <span className="sm:hidden text-xs">Hoạt động</span>
        </TabsTrigger>
        <TabsTrigger 
          value="payment" 
          className="flex items-center gap-2 data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-gray-200"
        >
          <CreditCard className="w-4 h-4" />
          <span className="hidden sm:inline">Thanh toán</span>
          <span className="sm:hidden text-xs">Thanh toán</span>
        </TabsTrigger>
        <TabsTrigger 
          value="preferences" 
          className="flex items-center gap-2 data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-gray-200"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Phỏng vấn</span>
          <span className="sm:hidden text-xs">Phỏng vấn</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="personal" className="min-h-[500px] transition-all duration-300">
        <PersonalInfoForm
          formData={formData}
          isEditing={isEditing}
          onDataChange={onDataChange}
          onEditToggle={onEditToggle}
          onSubmit={onSubmit}
        />
      </TabsContent>
      
      <TabsContent value="activity" className="min-h-[500px] transition-all duration-300">
        <ActivityHistory userId={userId} />
      </TabsContent>
      
      <TabsContent value="payment" className="min-h-[500px] transition-all duration-300">
        <PaymentHistory userId={userId} />
      </TabsContent>
      
      <TabsContent value="preferences" className="min-h-[500px] transition-all duration-300">
        {jobRolesLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Đang tải...</span>
          </div>
        ) : jobRolesError ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-red-600">Lỗi: {jobRolesError}</div>
          </div>
        ) : (
          <InterviewPreferencesForm 
            jobRoles={jobRoles}
            onSave={(preferences) => {
              console.log('Preferences saved:', preferences);
              // Có thể thêm toast notification ở đây
            }}
          />
        )}
      </TabsContent>
    </Tabs>
  );
}
