"use client";

import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import dynamic from "next/dynamic";

// Use dynamic import with SSR disabled for the InteractiveAvatar component
// since it depends on browser APIs
const InteractiveAvatar = dynamic(
  () => import("@/components/StreamingAvatar/InteractiveAvatar"),
  { ssr: false }
);

export default function AvatarInterviewPage() {
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);

  const handleEndSession = () => {
    setIsInterviewStarted(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">AI Avatar Interview Practice</h1>
        </div>

        <p className="text-gray-600">
          Practice your interview skills with our AI avatar interviewer.
          Configure how the interview should go and receive real-time feedback.
        </p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">          {isInterviewStarted ? (
            <div className="p-6">
              <InteractiveAvatar onEndSession={handleEndSession} />
            </div>
          ) : (
            <div className="p-8 text-center">
              <h2 className="text-xl font-semibold mb-4">
                Ready to practice your interview?
              </h2>
              <p className="text-gray-600 mb-6">
                Our AI avatar will act as an interviewer and respond to your
                answers in real-time. You can practice both technical and
                behavioral questions.
              </p>
              <button
                onClick={() => setIsInterviewStarted(true)}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                Start Avatar Interview
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">
            Tips for a Successful Interview
          </h2>
          <ul className="space-y-3 list-disc pl-5 text-gray-700">
            <li>Speak clearly and at a moderate pace</li>
            <li>
              Maintain a professional posture and eye contact (as if with a real
              interviewer)
            </li>
            <li>
              Structure your answers using the STAR method (Situation, Task, Action,
              Result)
            </li>
            <li>Practice your responses to common questions before the interview</li>
            <li>
              You can switch between voice and text modes during the interview
            </li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
