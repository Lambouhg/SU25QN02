"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useCallback } from "react";
import { useRouter } from "next/navigation";


interface Quiz {
  _id: string;
  field: string;
  topic: string;
  level: string;
  completedAt: string;
  score: number;
  timeUsed: number;
  timeLimit: number;
  userAnswers: {
    questionId: string;
    answerIndex: number[];
    isCorrect: boolean;
  }[];
  totalQuestions: number;
  retryCount: number;
  questions?: Question[];
}

interface Question {
  _id: string;
  question: string;
  answers: { content: string; isCorrect: boolean }[];
  explanation?: string;
}

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
  const [quizHistory, setQuizHistory] = useState<Quiz[]>([]);
  const [savedQuestions, setSavedQuestions] = useState<Question[]>([]);
  const [activeTab, setActiveTab] = useState("profile");
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const router = useRouter();

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

  const fetchQuizHistory = useCallback(async () => {
    try {
      const response = await fetch("/api/quizzes");
      const data = await response.json();
      setQuizHistory(data);
    } catch (error) {
      console.error("Error fetching quiz history:", error);
    }
  }, []);

  const fetchSavedQuestions = useCallback(async () => {
    try {
      const response = await fetch("/api/users/saved-questions");
      const data = await response.json();
      setSavedQuestions(data);
    } catch (error) {
      console.error("Error fetching saved questions:", error);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchQuizHistory();
    fetchSavedQuestions();
  }, [fetchProfile, fetchQuizHistory, fetchSavedQuestions]);

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

  const handleViewQuizDetails = async (quiz: Quiz) => {
    if (selectedQuiz?._id === quiz._id) {
      setSelectedQuiz(null); // Close the dropdown if already open for this quiz
    } else {
      try {
        const response = await fetch(`/api/quizzes/${quiz._id}`);
        if (!response.ok) throw new Error('Failed to fetch quiz details');
        const quizDetails = await response.json();
        setSelectedQuiz(quizDetails);
      } catch (error) {
        console.error('Error fetching quiz details:', error);
      }
    }
  };

  const handleRetryQuiz = async (quiz: Quiz) => {
    try {
      const response = await fetch(`/api/quizzes/${quiz._id}/retry`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to retry quiz');
      const newQuiz = await response.json();
      console.log("New quiz created for retry:", newQuiz);
      console.log("Redirecting to:", `/practice/quiz/${newQuiz._id}`);
      router.push(`/practice/quiz/${newQuiz._id}`);
    } catch (error) {
      console.error('Error retrying quiz:', error);
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
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Profile</h1>
          {activeTab === "profile" && (
            <button
              onClick={isEditing ? handleSubmit : () => setIsEditing(true)}
              className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
            >
              {isEditing ? "Save Changes" : "Edit Profile"}
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("profile")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "profile"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Profile Information
            </button>
          </nav>
        </div>

        {/* Chỉ giữ lại phần Profile Information */}
        {activeTab === "profile" && (
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
        )}
      </div>
    </DashboardLayout>
  );
}