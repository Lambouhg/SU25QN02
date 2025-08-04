"use client";

import React, { useState } from "react";
import PersonalInfoForm from "./PersonalInfoForm";
import ActivityHistory from "./ActivityHistory";
import PaymentHistory from "./PaymentHistory";

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

interface Tab {
  id: TabType;
  label: string;
}

const tabs: Tab[] = [
  {
    id: "personal",
    label: "Personal Info"
  },
  {
    id: "activity", 
    label: "Activity History"
  },
  {
    id: "payment",
    label: "Payment History"
  }
];

export default function ProfileTabs({
  formData,
  isEditing,
  onDataChange,
  onEditToggle,
  onSubmit,
  userId
}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("personal");

  const renderTabContent = () => {
    switch (activeTab) {
      case "personal":
        return (
          <PersonalInfoForm
            formData={formData}
            isEditing={isEditing}
            onDataChange={onDataChange}
            onEditToggle={onEditToggle}
            onSubmit={onSubmit}
          />
        );
      case "activity":
        return <ActivityHistory userId={userId} />;
      case "payment":
        return <PaymentHistory userId={userId} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl p-1 shadow-inner">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 flex-1 justify-center transform hover:scale-105 ${
              activeTab === tab.id
                ? "bg-white text-blue-600 shadow-md border border-blue-100"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
            }`}
          >
            <span className="hidden sm:inline text-sm">{tab.label}</span>
            <span className="sm:hidden text-xs">{tab.label.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px] transition-all duration-300">
        {renderTabContent()}
      </div>
    </div>
  );
}
