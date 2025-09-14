"use client";
import React, { useState } from "react";
import { Sparkles, Plus, Settings, Wand2 } from "lucide-react";

interface GeneratedQuestion {
  stem: string;
  type: string;
  level: string;
  difficulty: string;
  category: string;
  fields: string[];
  topics: string[];
  skills: string[];
  explanation?: string;
  options?: Array<{ text: string; isCorrect: boolean }>;
}

interface GenerationConfig {
  field: string;
  level: string;
  difficulty: string;
  questionCount: number;
  questionType: string;
  topics: string;
  customPrompt?: string;
}

interface DuplicateCheckResult {
  questionIndex: number;
  isDuplicate: boolean;
  similarQuestions: Array<{
    questionId: string;
    similarity: number;
    reason: string;
    stem: string;
  }>;
  confidence: number;
  recommendation: 'save' | 'review' | 'reject';
}

interface DuplicateCheckResponse {
  results: DuplicateCheckResult[];
  summary: {
    total: number;
    duplicates: number;
    warnings: number;
    safe: number;
  };
}

interface ImportResult {
  success: number;
  failed: number;
  skipped: number;
  duplicatesFound: number;
  warnings: string[];
  duplicateDetails: Array<{
    questionIndex: number;
    status: 'success' | 'failed' | 'skipped' | 'duplicate' | 'warning';
    message: string;
    duplicateInfo?: DuplicateCheckResult;
  }>;
}

export default function AdminQuestionGeneratorPage() {
  const [config, setConfig] = useState<GenerationConfig>({
    field: 'Frontend Development',
    level: 'junior',
    difficulty: 'easy',
    questionCount: 5,
    questionType: 'single_choice',
    topics: '',
    customPrompt: ''
  });
  
  const [generating, setGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [skipDuplicateCheck, setSkipDuplicateCheck] = useState(false);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.8);
  const [duplicateCheckResults, setDuplicateCheckResults] = useState<DuplicateCheckResponse | null>(null);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    setDuplicateCheckResults(null);
    try {
      const response = await fetch('/api/admin/qb2/questions/ai-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      setGeneratedQuestions(data.questions || []);
      setSelectedQuestions(new Set(Array.from({ length: data.questions?.length || 0 }, (_, i) => i)));
      
      // Auto-check duplicates if questions were generated successfully
      if (data.questions && data.questions.length > 0 && !skipDuplicateCheck) {
        await checkDuplicatesForGeneratedQuestions(data.questions);
      }
      
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate questions: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setGenerating(false);
    }
  };

  const checkDuplicatesForGeneratedQuestions = async (questions: GeneratedQuestion[]) => {
    setCheckingDuplicates(true);
    try {
      const response = await fetch('/api/admin/qb2/questions/check-duplicates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questions: questions.map(q => ({
            stem: q.stem,
            category: q.category,
            fields: q.fields
          })),
          similarityThreshold
        }),
      });

      const duplicateData = await response.json();
      
      if (!response.ok) {
        throw new Error(duplicateData.error || 'Duplicate check failed');
      }

      setDuplicateCheckResults(duplicateData);
      
      // Auto-deselect questions with high similarity
      const newSelectedQuestions = new Set<number>();
      questions.forEach((_, index) => {
        const result = duplicateData.results.find((r: DuplicateCheckResult) => r.questionIndex === index);
        if (!result || result.recommendation !== 'reject') {
          newSelectedQuestions.add(index);
        }
      });
      setSelectedQuestions(newSelectedQuestions);
      
    } catch (error) {
      console.error('Duplicate check error:', error);
      // Don't show error alert for duplicate check failure - just continue without it
      console.warn('Duplicate check failed, continuing without duplicate detection');
    } finally {
      setCheckingDuplicates(false);
    }
  };

  const recheckDuplicates = async () => {
    if (generatedQuestions.length === 0) {
      alert('No questions to check');
      return;
    }
    await checkDuplicatesForGeneratedQuestions(generatedQuestions);
  };

  const handleSaveSelected = async () => {
    const questionsToSave = generatedQuestions.filter((_, index) => selectedQuestions.has(index));
    
    if (questionsToSave.length === 0) {
      alert('Please select at least one question to save');
      return;
    }

    setSaving(true);
    setImportResult(null);
    
    try {
      const response = await fetch('/api/admin/qb2/questions/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          questions: questionsToSave.map(q => ({
            ...q,
            fields: q.fields.join(','),
            topics: q.topics.join(','),
            skills: q.skills.join(','),
            ...q.options?.reduce((acc, opt, idx) => ({
              ...acc,
              [`option${idx + 1}`]: opt.text,
              [`option${idx + 1}_correct`]: opt.isCorrect
            }), {})
          })),
          skipDuplicateCheck,
          similarityThreshold
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Save failed');
      }

      setImportResult(result);
      
      // Show summary message
      let message = result.message || `Successfully processed ${questionsToSave.length} questions!`;
      if (result.duplicatesFound > 0) {
        message += `\n\nDuplicate Detection Summary:`;
        message += `\n- ${result.success} questions saved successfully`;
        message += `\n- ${result.skipped} questions skipped due to high similarity`;
        message += `\n- ${result.warnings?.length || 0} questions saved with similarity warnings`;
      }
      
      alert(message);
      
      // Clear only successfully saved questions
      if (result.success > 0) {
        const newGeneratedQuestions = generatedQuestions.filter((_, index) => {
          const detail = result.duplicateDetails?.find((d: { questionIndex: number; status: string }) => d.questionIndex === index);
          return detail?.status !== 'success';
        });
        
        setGeneratedQuestions(newGeneratedQuestions);
        setSelectedQuestions(new Set());
      }
      
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save questions: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const toggleQuestionSelection = (index: number) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedQuestions(newSelected);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            AI Question Generator
          </h1>
          <p className="text-gray-600 mt-1">Generate questions automatically using AI</p>
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Generation Configuration
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Field</label>
            <select
              value={config.field}
              onChange={(e) => setConfig({ ...config, field: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="Frontend Development">Frontend Development</option>
              <option value="Backend Development">Backend Development</option>
              <option value="Full Stack Development">Full Stack Development</option>
              <option value="DevOps">DevOps</option>
              <option value="Mobile Development">Mobile Development</option>
              <option value="Data Science">Data Science</option>
              <option value="Machine Learning">Machine Learning</option>
              <option value="System Design">System Design</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
            <select
              value={config.level}
              onChange={(e) => setConfig({ ...config, level: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="junior">Junior</option>
              <option value="middle">Middle</option>
              <option value="senior">Senior</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
            <select
              value={config.difficulty}
              onChange={(e) => setConfig({ ...config, difficulty: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
            <select
              value={config.questionType}
              onChange={(e) => setConfig({ ...config, questionType: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="single_choice">Single Choice</option>
              <option value="multiple_choice">Multiple Choice</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question Count</label>
            <input
              type="number"
              min="1"
              max="20"
              value={config.questionCount}
              onChange={(e) => setConfig({ ...config, questionCount: parseInt(e.target.value) || 1 })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topics (comma-separated)</label>
            <input
              type="text"
              value={config.topics}
              onChange={(e) => setConfig({ ...config, topics: e.target.value })}
              placeholder="React, JavaScript, APIs"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Custom Prompt (Optional)</label>
          <textarea
            value={config.customPrompt}
            onChange={(e) => setConfig({ ...config, customPrompt: e.target.value })}
            placeholder="Additional instructions for AI question generation..."
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        {/* Duplicate Check Settings */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-md font-medium text-gray-900 mb-3">Duplicate Detection Settings</h3>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="skipDuplicateCheck"
                checked={skipDuplicateCheck}
                onChange={(e) => setSkipDuplicateCheck(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="skipDuplicateCheck" className="ml-2 text-sm text-gray-700">
                Skip duplicate detection (save all questions without checking)
              </label>
            </div>

            {!skipDuplicateCheck && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Similarity Threshold: {Math.round(similarityThreshold * 100)}%
                </label>
                <input
                  type="range"
                  min="0.6"
                  max="1.0"
                  step="0.05"
                  value={similarityThreshold}
                  onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>60% (Less strict)</span>
                  <span>100% (Very strict)</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Questions with similarity above this threshold will be flagged as potential duplicates
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleGenerate}
            disabled={generating || checkingDuplicates}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium ${
              generating || checkingDuplicates
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            {generating ? 'Generating...' : checkingDuplicates ? 'Checking Duplicates...' : 'Generate Questions'}
          </button>
        </div>
      </div>

      {/* Duplicate Check Results Summary */}
      {duplicateCheckResults && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Duplicate Check Results</h2>
            <button
              onClick={recheckDuplicates}
              disabled={checkingDuplicates}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
            >
              {checkingDuplicates ? 'Checking...' : 'Recheck'}
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{duplicateCheckResults.summary.safe}</div>
              <div className="text-sm text-green-700">Safe to Save</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{duplicateCheckResults.summary.warnings}</div>
              <div className="text-sm text-yellow-700">Review Needed</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{duplicateCheckResults.summary.duplicates}</div>
              <div className="text-sm text-red-700">Likely Duplicates</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{duplicateCheckResults.summary.total}</div>
              <div className="text-sm text-blue-700">Total Checked</div>
            </div>
          </div>

          {duplicateCheckResults.summary.duplicates > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Note:</strong> Questions marked as likely duplicates have been automatically deselected. 
                Review the similar questions below before deciding to save them.
              </p>
            </div>
          )}

          {duplicateCheckResults.summary.warnings > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mt-3">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> Some questions have moderate similarity to existing ones. 
                Please review them carefully before saving.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Import Results */}
      {importResult && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Import Results</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
              <div className="text-sm text-green-700">Saved</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
              <div className="text-sm text-red-700">Failed</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{importResult.skipped}</div>
              <div className="text-sm text-yellow-700">Skipped</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{importResult.duplicatesFound}</div>
              <div className="text-sm text-orange-700">Duplicates Found</div>
            </div>
          </div>

          {importResult.warnings && importResult.warnings.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Warnings:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {importResult.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {importResult.duplicateDetails && importResult.duplicateDetails.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Detailed Results:</h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {importResult.duplicateDetails.map((detail, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border text-sm ${
                      detail.status === 'success' 
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : detail.status === 'warning'
                        ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                        : detail.status === 'duplicate'
                        ? 'bg-orange-50 border-orange-200 text-orange-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                  >
                    <div className="font-medium">Question {detail.questionIndex + 1}: {detail.message}</div>
                    
                    {detail.duplicateInfo && detail.duplicateInfo.similarQuestions.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs font-medium mb-1">Similar questions found:</div>
                        <div className="space-y-1">
                          {detail.duplicateInfo.similarQuestions.slice(0, 3).map((similar: { 
                            similarity: number; 
                            stem: string; 
                            reason: string; 
                          }, idx: number) => (
                            <div key={idx} className="text-xs bg-white bg-opacity-50 p-2 rounded">
                              <div className="font-medium">Similarity: {Math.round(similar.similarity * 100)}%</div>
                              <div className="truncate">{similar.stem}</div>
                              <div className="text-xs opacity-75">{similar.reason}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generated Questions */}
      {generatedQuestions.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Generated Questions</h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {selectedQuestions.size} of {generatedQuestions.length} selected
              </span>
              <button
                onClick={handleSaveSelected}
                disabled={saving || selectedQuestions.size === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                  saving || selectedQuestions.size === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                <Plus className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Selected'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {generatedQuestions.map((question, index) => {
              const duplicateResult = duplicateCheckResults?.results.find(r => r.questionIndex === index);
              const isSelected = selectedQuestions.has(index);
              
              let statusColor = 'border-gray-200';
              let statusBg = 'bg-white';
              let statusIcon = null;
              
              if (duplicateResult) {
                if (duplicateResult.recommendation === 'reject') {
                  statusColor = 'border-red-300';
                  statusBg = 'bg-red-50';
                  statusIcon = <span className="text-red-600 text-xs font-medium">🚫 DUPLICATE</span>;
                } else if (duplicateResult.recommendation === 'review') {
                  statusColor = 'border-yellow-300';
                  statusBg = 'bg-yellow-50';
                  statusIcon = <span className="text-yellow-600 text-xs font-medium">⚠️ REVIEW</span>;
                } else {
                  statusColor = 'border-green-300';
                  statusBg = 'bg-green-50';
                  statusIcon = <span className="text-green-600 text-xs font-medium">✅ SAFE</span>;
                }
              }
              
              if (isSelected) {
                statusColor = statusColor.replace('300', '400');
                statusBg = statusBg.replace('50', '100');
              }
              
              return (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${statusColor} ${statusBg}`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleQuestionSelection(index)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {question.type}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          {question.level}
                        </span>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                          {question.difficulty}
                        </span>
                        {statusIcon}
                      </div>
                      
                      <h3 className="font-medium text-gray-900 mb-2">{question.stem}</h3>
                      
                      {question.options && question.options.length > 0 && (
                        <div className="mb-2">
                          <p className="text-sm font-medium text-gray-700 mb-1">Options:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {question.options.map((option, optIndex) => (
                              <li
                                key={optIndex}
                                className={`text-sm ${
                                  option.isCorrect ? 'text-green-700 font-medium' : 'text-gray-600'
                                }`}
                              >
                                {option.text} {option.isCorrect && '✓'}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {question.explanation && (
                        <p className="text-sm text-gray-600 italic mb-2">{question.explanation}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-2 mb-2">
                        {question.topics.map((topic, topicIndex) => (
                          <span
                            key={topicIndex}
                            className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>

                      {/* Show duplicate information if available */}
                      {duplicateResult && duplicateResult.similarQuestions.length > 0 && (
                        <div className="mt-3 p-3 bg-white bg-opacity-75 rounded border-l-4 border-orange-400">
                          <div className="text-sm font-medium text-orange-800 mb-2">
                            Similar Questions Found (Confidence: {Math.round(duplicateResult.confidence * 100)}%)
                          </div>
                          <div className="space-y-2">
                            {duplicateResult.similarQuestions.slice(0, 2).map((similar, idx) => (
                              <div key={idx} className="text-xs">
                                <div className="font-medium text-orange-700">
                                  Similarity: {Math.round(similar.similarity * 100)}%
                                </div>
                                <div className="text-gray-700 truncate">{similar.stem}</div>
                                <div className="text-gray-600 italic">{similar.reason}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
