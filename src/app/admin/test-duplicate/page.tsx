"use client";
import React, { useState } from "react";
import { runComprehensiveTest, testDuplicateScenario, testDatabaseStats } from "@/utils/testEnhancedDuplicateDetection";

export default function TestDuplicateDetectionPage() {
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<string>('');

  const runFullTest = async () => {
    setTesting(true);
    setTestResults('🧪 Starting comprehensive duplicate detection test...\n\n');
    
    try {
      // Capture console output
      const originalLog = console.log;
      const originalError = console.error;
      let logOutput = '';
      
      console.log = (...args) => {
        logOutput += args.join(' ') + '\n';
        originalLog(...args);
      };
      
      console.error = (...args) => {
        logOutput += 'ERROR: ' + args.join(' ') + '\n';
        originalError(...args);
      };

      await runComprehensiveTest();
      
      // Restore console
      console.log = originalLog;
      console.error = originalError;
      
      setTestResults(logOutput);
      
    } catch (error) {
      setTestResults(prev => prev + `\n❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTesting(false);
    }
  };

  const runQuestionGeneration = async () => {
    setTesting(true);
    setTestResults('🧪 Testing question generation...\n\n');
    
    try {
      // Capture console output
      const originalLog = console.log;
      let logOutput = '';
      
      console.log = (...args) => {
        logOutput += args.join(' ') + '\n';
        originalLog(...args);
      };

      await testDuplicateScenario();
      
      // Restore console
      console.log = originalLog;
      
      setTestResults(logOutput);
    } catch (error) {
      setTestResults(prev => prev + `❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTesting(false);
    }
  };

  const runDatabaseStats = async () => {
    setTesting(true);
    setTestResults('📊 Checking database stats...\n\n');
    
    try {
      const stats = await testDatabaseStats();
      setTestResults(prev => prev + `Database Stats:\n${JSON.stringify(stats, null, 2)}`);
    } catch (error) {
      setTestResults(prev => prev + `❌ Stats check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          🧪 Duplicate Detection Test Suite
        </h1>
        <p className="text-gray-600">
          Test the AI-powered question generation and duplicate detection system
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={runQuestionGeneration}
          disabled={testing}
          className={`p-4 rounded-lg border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors ${
            testing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          <div className="font-medium text-blue-800">Test Duplicate Scenario</div>
          <div className="text-sm text-blue-600 mt-1">Focused duplicate detection test</div>
        </button>

        <button
          onClick={runFullTest}
          disabled={testing}
          className={`p-4 rounded-lg border-2 border-green-200 bg-green-50 hover:bg-green-100 transition-colors ${
            testing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          <div className="font-medium text-green-800">Full Test Suite</div>
          <div className="text-sm text-green-600 mt-1">Comprehensive testing scenarios</div>
        </button>

        <button
          onClick={runDatabaseStats}
          disabled={testing}
          className={`p-4 rounded-lg border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 transition-colors ${
            testing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          <div className="font-medium text-purple-800">Database Stats</div>
          <div className="text-sm text-purple-600 mt-1">Check current database state</div>
        </button>

        <button
          onClick={() => setTestResults('')}
          disabled={testing}
          className={`p-4 rounded-lg border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors ${
            testing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          <div className="font-medium text-gray-800">Clear Results</div>
          <div className="text-sm text-gray-600 mt-1">Clear test output</div>
        </button>
      </div>

      {testing && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-blue-800">Running tests...</span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="font-medium text-gray-900">Test Results</h2>
        </div>
        <div className="p-4">
          <pre className="whitespace-pre-wrap text-sm font-mono bg-gray-50 p-4 rounded border min-h-[200px] max-h-[600px] overflow-y-auto">
            {testResults || 'No test results yet. Click a test button to start.'}
          </pre>
        </div>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-medium text-yellow-800 mb-2">Test Instructions:</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• <strong>Question Generation:</strong> Tests AI question generation API only</li>
          <li>• <strong>Full Duplicate Test:</strong> Generates questions, imports them, then tries to import again to test duplicate detection</li>
          <li>• Make sure your Azure OpenAI credentials are configured correctly</li>
          <li>• The first import should succeed, the second should detect duplicates</li>
          <li>• Check the console for detailed logs</li>
        </ul>
      </div>
    </div>
  );
}