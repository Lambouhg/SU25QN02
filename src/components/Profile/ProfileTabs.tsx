"use client";

import React, { useState } from "react";
import PersonalInfoForm from "./PersonalInfoForm";
import ActivityHistory from "./ActivityHistory";
import PaymentHistory from "./PaymentHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Activity, CreditCard } from "lucide-react";

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

type TabType = "personal" | "activity" | "payment";

export default function ProfileTabs({
  formData,
  isEditing,
  onDataChange,
  onEditToggle,
  onSubmit,
  userId
}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("personal");

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="space-y-6">
      <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3 bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl p-1 shadow-inner">
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
    </Tabs>
  );
}
