'use client';

import React, { useState } from 'react';

// Mô phỏng một phần logic từ Avatar-AI để test nhanh
function analyzeUserResponse(userAnswer: string) {
  const answer = userAnswer.toLowerCase();
  const analysis = {
    mentionedTechnologies: [] as string[],
    patterns: [] as string[],
    experience: [] as string[],
    suggestedFollowUp: '',
    followUpType: ''
  };

  // Detect technologies
  if (/react|jsx|component|props|state|hooks/.test(answer)) {
    analysis.mentionedTechnologies.push('React');
  }
  if (/javascript|js|vanilla|es6/.test(answer)) {
    analysis.mentionedTechnologies.push('JavaScript');
  }
  if (/node\.?js|express|backend/.test(answer)) {
    analysis.mentionedTechnologies.push('Node.js');
  }
  if (/sql|database|mysql|postgresql/.test(answer)) {
    analysis.mentionedTechnologies.push('Database');
  }
  if (/docker|container/.test(answer)) {
    analysis.mentionedTechnologies.push('Docker');
  }
  if (/aws|azure|cloud/.test(answer)) {
    analysis.mentionedTechnologies.push('Cloud');
  }

  // Detect patterns
  if (/hook|usestate|useeffect/.test(answer)) {
    analysis.patterns.push('React Hooks');
  }
  if (/performance|optimize|chậm|lag/.test(answer)) {
    analysis.patterns.push('Performance Issues');
  }
  if (/async|promise|await/.test(answer)) {
    analysis.patterns.push('Async Programming');
  }
  if (/api|rest|graphql/.test(answer)) {
    analysis.patterns.push('API Integration');
  }

  // Detect experience level
  if (/chưa biết|don't know|không biết|never used|mới học/.test(answer)) {
    analysis.experience.push('Beginner/Unknown');
  }
  if (/nhiều năm|years|experienced|advanced|expert/.test(answer)) {
    analysis.experience.push('Experienced');
  }

  // Generate follow-up suggestions based on analysis
  if (analysis.mentionedTechnologies.includes('React')) {
    if (analysis.patterns.includes('React Hooks')) {
      analysis.suggestedFollowUp = 'Bạn có thể giải thích sự khác biệt giữa useState và useReducer không?';
      analysis.followUpType = 'Depth Question - Advanced Hooks';
    } else {
      analysis.suggestedFollowUp = 'Bạn thường sử dụng phương pháp quản lý state nào trong React applications?';
      analysis.followUpType = 'Depth Question - State Management';
    }
  } else if (analysis.mentionedTechnologies.includes('JavaScript')) {
    analysis.suggestedFollowUp = 'Bạn có thể giải thích cách hoạt động của closures trong JavaScript không?';
    analysis.followUpType = 'Depth Question - Core Concepts';
  } else if (analysis.patterns.includes('Performance Issues')) {
    analysis.suggestedFollowUp = 'Bạn đã sử dụng những techniques nào để optimize performance?';
    analysis.followUpType = 'Problem-Solving Question';
  } else if (analysis.experience.includes('Beginner/Unknown')) {
    analysis.suggestedFollowUp = 'Vậy bạn thường học công nghệ mới như thế nào?';
    analysis.followUpType = 'Learning Approach Question';
  } else if (analysis.mentionedTechnologies.length === 0) {
    analysis.suggestedFollowUp = 'Bạn có thể kể một ví dụ cụ thể từ kinh nghiệm của mình không?';
    analysis.followUpType = 'Clarification Question';
  } else {
    analysis.suggestedFollowUp = `Bạn đã gặp challenges nào khi làm việc với ${analysis.mentionedTechnologies[0]}?`;
    analysis.followUpType = 'Experience Question';
  }

  return analysis;
}

interface TestResult {
  userAnswer: string;
  analysis: {
    mentionedTechnologies: string[];
    patterns: string[];
    experience: string[];
    suggestedFollowUp: string;
    followUpType: string;
  };
  timestamp: string;
}

export default function SimpleFollowUpTestPage() {
  const [userInput, setUserInput] = useState('');
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const testUserAnswer = () => {
    if (!userInput.trim()) return;

    const analysis = analyzeUserResponse(userInput);
    const result = {
      userAnswer: userInput,
      analysis,
      timestamp: new Date().toLocaleTimeString()
    };

    setTestResults(prev => [...prev, result]);
    setUserInput('');
  };

  const runQuickTests = () => {
    const quickTestCases = [
      'Tôi thường sử dụng React hooks như useState và useEffect',
      'Tôi chưa biết React, mới học HTML CSS thôi',
      'Ứng dụng của tôi bị performance issues, render chậm',
      'Tôi có nhiều năm kinh nghiệm với JavaScript và Node.js',
      'Tôi làm việc với database SQL và MongoDB',
      'Tôi sử dụng Docker để containerize applications'
    ];

    const results = quickTestCases.map(testCase => ({
      userAnswer: testCase,
      analysis: analyzeUserResponse(testCase),
      timestamp: new Date().toLocaleTimeString()
    }));

    setTestResults(results);
  };

  const resetTest = () => {
    setTestResults([]);
    setUserInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      testUserAnswer();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">
            🧪 Simple Follow-up Logic Test
          </h1>
          
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-2">🎯 Test Follow-up Question Logic</h3>
            <p className="text-sm text-gray-700">
              Nhập câu trả lời để test logic tạo follow-up questions. Hệ thống sẽ phân tích:
            </p>
            <ul className="text-sm text-gray-600 mt-2 list-disc list-inside">
              <li>Technologies mentioned (React, JavaScript, Node.js, etc.)</li>
              <li>Patterns detected (Hooks, Performance, Async, etc.)</li>
              <li>Experience level (Beginner, Experienced)</li>
              <li>Appropriate follow-up question</li>
            </ul>
          </div>

          {/* Test Input */}
          <div className="mb-6">
            <label htmlFor="test-input" className="block text-sm font-medium text-gray-700 mb-2">
              Nhập câu trả lời để test:
            </label>
            <div className="flex gap-2">
              <textarea
                id="test-input"
                className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., 'Tôi dùng useState trong React để manage state', 'Tôi chưa biết về performance optimization', 'Tôi có 3 năm kinh nghiệm với JavaScript'..."
              />
              <div className="flex flex-col gap-2">
                <button
                  onClick={testUserAnswer}
                  disabled={!userInput.trim()}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-md font-medium whitespace-nowrap"
                >
                  Test Answer
                </button>
                <button
                  onClick={runQuickTests}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md font-medium whitespace-nowrap"
                >
                  Quick Tests
                </button>
                <button
                  onClick={resetTest}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Expected Behaviors */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-2">📋 Expected Behaviors</h3>
            <div className="text-sm space-y-1">
              <div>• Mention &quot;React&quot; → Should ask about state management or hooks</div>
              <div>• Say &quot;chưa biết&quot; → Should ask about learning approach</div>
              <div>• Mention &quot;performance&quot; → Should ask about optimization techniques</div>
              <div>• Show experience → Should ask about challenges faced</div>
              <div>• Give vague answer → Should ask for specific examples</div>
            </div>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">📊 Test Results</h2>
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="mb-3">
                      <div className="text-sm text-gray-500 mb-1">User Answer #{index + 1}:</div>
                      <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                        &quot;{result.userAnswer}&quot;
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Analysis */}
                      <div>
                        <h4 className="font-semibold mb-2">🔍 Analysis</h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-blue-600">Technologies:</span>{' '}
                            {result.analysis.mentionedTechnologies.length > 0 
                              ? result.analysis.mentionedTechnologies.join(', ')
                              : 'None detected'
                            }
                          </div>
                          <div>
                            <span className="font-medium text-green-600">Patterns:</span>{' '}
                            {result.analysis.patterns.length > 0 
                              ? result.analysis.patterns.join(', ')
                              : 'None detected'
                            }
                          </div>
                          <div>
                            <span className="font-medium text-purple-600">Experience:</span>{' '}
                            {result.analysis.experience.length > 0 
                              ? result.analysis.experience.join(', ')
                              : 'Not determined'
                            }
                          </div>
                        </div>
                      </div>

                      {/* Follow-up Question */}
                      <div>
                        <h4 className="font-semibold mb-2">💬 Suggested Follow-up</h4>
                        <div className="bg-green-50 p-3 rounded border-l-4 border-green-400 mb-2">
                          &quot;{result.analysis.suggestedFollowUp}&quot;
                        </div>
                        <div className="text-xs text-gray-600">
                          <span className="bg-gray-100 px-2 py-1 rounded">
                            {result.analysis.followUpType}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                      Generated at: {result.timestamp}
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Stats */}
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">📈 Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {testResults.reduce((sum, r) => sum + r.analysis.mentionedTechnologies.length, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Technologies Detected</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {testResults.reduce((sum, r) => sum + r.analysis.patterns.length, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Patterns Found</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {testResults.length}
                    </div>
                    <div className="text-sm text-gray-600">Total Tests</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}