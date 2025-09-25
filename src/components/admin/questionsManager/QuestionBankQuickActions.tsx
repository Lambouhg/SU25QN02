"use client";
import React from "react";
import { Upload, Sparkles, BookOpen, Plus} from "lucide-react";
import { useRouter } from "next/navigation";

export default function QuestionBankQuickActions() {
  const router = useRouter();

  const quickActions = [
    {
      title: "Add Single Question",
      description: "Create one question manually",
      icon: Plus,
      color: "bg-blue-600 hover:bg-blue-700",
      action: () => window.location.href = "/admin/question-bank/questions"
    },
    {
      title: "Bulk Import",
      description: "Import multiple questions from CSV",
      icon: Upload,
      color: "bg-green-600 hover:bg-green-700",
      action: () => router.push("/admin/question-bank/import")
    },
    {
      title: "AI Generator",
      description: "Generate questions using AI",
      icon: Sparkles,
      color: "bg-purple-600 hover:bg-purple-700",
      action: () => router.push("/admin/question-bank/generate")
    },
    {
      title: "Question Sets Management",
      description: "Start from pre-built templates",
      icon: BookOpen,
      color: "bg-orange-600 hover:bg-orange-700",
      action: () => router.push("/admin/question-bank/sets")
    },
  ];

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 justify-items-stretch">
        {quickActions.map((action, index) => {
          const IconComponent = action.icon;
          return (
            <button
              key={index}
              onClick={action.action}
              className={`p-4 rounded-lg text-white ${action.color} transition-all duration-200 transform hover:scale-105 hover:shadow-lg`}
            >
              <div className="flex flex-col items-center text-center">
                <IconComponent className="w-8 h-8 mb-2" />
                <h3 className="font-medium text-sm mb-1">{action.title}</h3>
                <p className="text-xs opacity-90">{action.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
