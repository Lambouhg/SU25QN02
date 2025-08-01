'use client';

import { useState } from 'react';
import InteractiveAvatar from '@/components/InteractiveAvatar';

export default function TestInterviewPage() {
  const [interviewResult, setInterviewResult] = useState<any>(null);

  const handleEndSession = (data?: any) => {
    console.log('Interview ended:', data);
    if (data) {
      setInterviewResult(data);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Test Interview Logic</h1>
      
      {interviewResult ? (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <h2 className="text-lg font-semibold mb-2">Interview Completed!</h2>
          <pre className="text-sm">
            {JSON.stringify(interviewResult, null, 2)}
          </pre>
          <button
            onClick={() => setInterviewResult(null)}
            className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
          >
            Start New Interview
          </button>
        </div>
      ) : (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          <p>This page tests the interview logic including auto-prompt functionality.</p>
          <p className="mt-2">Instructions:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Start an interview and let it run without responding</li>
            <li>Auto-prompt should trigger after 5 seconds of silence</li>
            <li>After 3 auto-prompts, interview should end automatically</li>
            <li>If you respond normally, auto-prompt should reset</li>
            <li>When AI says interview is complete, auto-prompt should stop</li>
          </ul>
        </div>
      )}

      <div className="h-screen">
        <InteractiveAvatar onEndSession={handleEndSession} />
      </div>
    </div>
  );
} 