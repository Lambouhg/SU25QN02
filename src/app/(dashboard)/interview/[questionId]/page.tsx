'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function InterviewQuestionPage({ params }: { params: { questionId: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [interviewQuestion, setInterviewQuestion] = useState({
    id: params.questionId,
    title: "Tell me about your experience with React and modern frontend development",
    type: "Technical Experience",
    description: "The interviewer wants to understand your hands-on experience with React, your knowledge of modern frontend practices, and how you have applied these skills in real projects. Focus on specific examples and technologies you have used.",
    tips: [
      "Mention specific React features you have used (hooks, context, etc.)",
      "Include examples of projects you have worked on",
      "Discuss challenges you have faced and how you solved them",
      "Show knowledge of the React ecosystem and best practices"
    ]
  });

  useEffect(() => {
    const questionFromURL = searchParams.get('question');
    const typeFromURL = searchParams.get('type');
    
    if (questionFromURL) {
      setInterviewQuestion({
        id: params.questionId,
        title: questionFromURL,
        type: typeFromURL || "Job Description Question",
        description: "This question is generated based on the job description you uploaded. Focus on demonstrating relevant skills and experiences that match the requirements.",
        tips: [
          "Be specific about your relevant experience",
          "Use concrete examples and metrics when possible",
          "Connect your answer to the job requirements",
          "Show your understanding of the role and company needs"
        ]
      });
    }
  }, [searchParams, params.questionId]);

  const analyzeAnswer = async () => {
    if (!answer.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/analyze-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: interviewQuestion.title,
          answer: answer,
          type: interviewQuestion.type
        }),
      });

      const data = await response.json();
      if (data.success) {
        setFeedback(data.feedback);
        setIsSubmitted(true);
      } else {
        console.error('Error:', data.error);
      }
    } catch (error) {
      console.error('Failed to analyze answer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    analyzeAnswer();
  };
    const handleQuit = () => {
    // Check if there's a returnUrl parameter
    const returnUrl = searchParams.get('returnUrl');
    if (returnUrl) {
      router.push(decodeURIComponent(returnUrl));
      return;
    }
    
    // Navigate back to JD page if question came from JD, otherwise use router.back()
    const questionType = searchParams.get('type');
    if (questionType === 'JD-Generated') {
      router.push('/dashboard/jd');
    } else {
      router.back();
    }
  };

  const handleHint = () => {
    console.log('Requesting hint');
    // Handle hint logic here
  };
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="max-w-[1600px] mx-auto">
          {/* Main Content Area - 2 Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* Left Column - Interview Question & Answer Input */}
          <div className="lg:col-span-3 space-y-6">
            {/* Interview Question Box */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
              <div className="flex items-center gap-2 mb-6">
                <span className="bg-orange-500 text-white px-3 py-2 rounded-lg text-sm font-semibold">
                  {interviewQuestion.type}
                </span>
              </div>
              <h3 className="text-orange-600 font-semibold mb-6 text-2xl">
                {interviewQuestion.title}
              </h3>
              <div className="text-gray-700 leading-relaxed mb-6 text-lg">
                {interviewQuestion.description}
              </div>
              
              {/* Tips */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <h4 className="text-amber-600 font-semibold mb-4 text-lg flex items-center gap-2">
                  <span>💡</span>
                  Tips for a great answer:
                </h4>
                <ul className="text-gray-600 space-y-3">
                  {interviewQuestion.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-amber-600 text-lg">•</span>
                      <span className="text-base">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Answer Input Box */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
              <div className="mb-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-2">Your Answer</h4>
                <p className="text-gray-600">Write your response below. Be specific and use examples from your experience.</p>
              </div>
              
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full h-64 bg-white border-2 border-gray-300 rounded-xl p-6 text-gray-900 text-lg resize-none focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all duration-200"
                placeholder="Type your answer here... Be specific and include examples from your experience."
                disabled={isSubmitted}
              />
              
              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-gray-500">
                  <span className="font-medium">{answer.length}</span> characters
                  <span className="ml-4 text-gray-400">Recommended: 200-500 words</span>
                </div>
                
                <div className="flex gap-3">
                  {!isSubmitted && (
                    <button
                      onClick={handleHint}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-xl transition-colors"
                    >
                      <span>💡</span>
                      Get Hint
                    </button>
                  )}
                  
                  {!isSubmitted ? (
                    <button
                      onClick={handleSubmit}
                      disabled={!answer.trim() || isLoading}
                      className="flex items-center gap-2 px-8 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-xl transition-colors font-semibold text-white text-lg shadow-lg"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                          Analyzing...
                        </>
                      ) : (
                        <>Submit Answer ⚡</>
                      )}
                    </button>                  ) : (
                    <button
                      onClick={() => {
                        const returnUrl = searchParams.get('returnUrl');
                        if (returnUrl) {
                          router.push(decodeURIComponent(returnUrl));
                        } else {
                          router.push('/dashboard/interview');
                        }
                      }}
                      className="flex items-center gap-2 px-8 py-3 bg-green-500 hover:bg-green-600 rounded-xl transition-colors font-semibold text-white text-lg shadow-lg"
                    >
                      Back to Questions
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={handleQuit}
                className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-xl transition-colors font-medium"
              >
                <span>←</span>
                Back to Questions
              </button>
            </div>
          </div>          {/* Right Column - AI Feedback */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Feedback Box */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden sticky top-8">
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-2xl">🤖</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-xl">AI Feedback</h3>
                    <p className="text-sm text-gray-500">Powered by advanced AI analysis</p>
                  </div>
                  {isSubmitted && (
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white text-lg font-bold">✓</span>
                    </div>
                  )}
                </div>
                
                {!feedback && !isLoading && (
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-dashed border-blue-200 rounded-xl p-8 text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-blue-600 text-2xl">📝</span>
                    </div>
                    <p className="text-lg text-gray-600 font-medium mb-2">Ready for Analysis</p>
                    <p className="text-sm text-gray-500">Submit your answer to receive detailed AI feedback and personalized suggestions for improvement.</p>
                  </div>
                )}
                
                {isLoading && (
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <div className="animate-spin w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full"></div>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-orange-700 text-lg mb-2">AI is analyzing...</p>
                      <p className="text-sm text-orange-600">Please wait while our AI reviews your answer and prepares personalized feedback.</p>
                    </div>
                  </div>
                )}
                
                {feedback && (
                  <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-xl overflow-hidden shadow-lg">
                    <div className="bg-gradient-to-r from-green-500 to-blue-500 p-4">
                      <div className="flex items-center gap-2 text-white">
                        <span className="text-xl">✨</span>
                        <span className="font-semibold text-lg">Analysis Complete</span>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="prose prose-base max-w-none">                        <div 
                          className="text-gray-700 leading-relaxed space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar"
                          dangerouslySetInnerHTML={{
                            __html: feedback
                              .split('\n')
                              .map((line, index) => {
                                // Highlight strengths
                                if (line.toLowerCase().includes('strength') || line.toLowerCase().includes('good') || line.toLowerCase().includes('well') || line.toLowerCase().includes('excellent') || line.toLowerCase().includes('strong')) {
                                  return `<div class="bg-green-100 border-l-4 border-green-500 p-4 rounded-r-lg mb-3 feedback-highlight" style="animation-delay: ${index * 0.1}s">
                                    <span class="text-green-800 font-medium text-base">✅ ${line}</span>
                                  </div>`;
                                }
                                // Highlight improvements
                                if (line.toLowerCase().includes('improve') || line.toLowerCase().includes('consider') || line.toLowerCase().includes('suggestion') || line.toLowerCase().includes('recommend') || line.toLowerCase().includes('could') || line.toLowerCase().includes('should')) {
                                  return `<div class="bg-blue-100 border-l-4 border-blue-500 p-4 rounded-r-lg mb-3 feedback-highlight" style="animation-delay: ${index * 0.1}s">
                                    <span class="text-blue-800 font-medium text-base">💡 ${line}</span>
                                  </div>`;
                                }
                                // Highlight issues/concerns
                                if (line.toLowerCase().includes('concern') || line.toLowerCase().includes('issue') || line.toLowerCase().includes('missing') || line.toLowerCase().includes('lack') || line.toLowerCase().includes('weak') || line.toLowerCase().includes('unclear')) {
                                  return `<div class="bg-orange-100 border-l-4 border-orange-500 p-4 rounded-r-lg mb-3 feedback-highlight" style="animation-delay: ${index * 0.1}s">
                                    <span class="text-orange-800 font-medium text-base">⚠️ ${line}</span>
                                  </div>`;
                                }
                                // Highlight scores or ratings
                                if (line.toLowerCase().includes('score') || line.toLowerCase().includes('rating') || line.toLowerCase().includes('/10') || line.toLowerCase().includes('points')) {
                                  return `<div class="bg-purple-100 border-l-4 border-purple-500 p-4 rounded-r-lg mb-3 feedback-highlight" style="animation-delay: ${index * 0.1}s">
                                    <span class="text-purple-800 font-medium text-base">📊 ${line}</span>
                                  </div>`;
                                }
                                // Default styling for regular text
                                return line.trim() ? `<p class="text-gray-700 mb-3 feedback-highlight text-base leading-relaxed" style="animation-delay: ${index * 0.1}s">${line}</p>` : '';
                              })
                              .join('')
                          }}
                        />
                      </div>
                      
                      {/* Action buttons */}
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="flex gap-3">
                          <button 
                            onClick={() => navigator.clipboard.writeText(feedback)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-xl transition-colors flex-1 justify-center"
                          >
                            <span>📋</span>
                            Copy Feedback
                          </button>
                          <button 
                            onClick={() => setFeedback(null)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex-1 justify-center"
                          >
                            <span>🔄</span>
                            Clear
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
              <h3 className="font-bold mb-4 text-gray-900 text-lg">Today&apos;s Progress</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4 text-center">
                  <div className="w-12 h-12 bg-orange-400 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">📝</span>
                  </div>
                  <div className="text-xs text-gray-600 mb-1">Questions Answered</div>
                  <div className="font-bold text-gray-900 text-xl">{isSubmitted ? '1' : '0'}</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4 text-center">
                  <div className="w-12 h-12 bg-purple-400 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div className="text-xs text-gray-600 mb-1">AI Reviews</div>
                  <div className="font-bold text-gray-900 text-xl">{feedback ? '1' : '0'}</div>
                </div>
              </div>
            </div>
          </div>        </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
