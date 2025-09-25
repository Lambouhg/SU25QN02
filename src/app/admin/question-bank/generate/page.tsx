"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Sparkles, Plus, Settings, Wand2, Edit, Save, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  JobRoleSelection,
  GeneratedPropertiesDisplay,
  ManualOverrideSection,
  QuestionPropertiesSection,
  DuplicateDetectionSettings,
  SimilarityModal
} from "@/components/admin/generateQuestions";

interface JobCategory {
  id: string;
  name: string;
  skills?: string[];
}

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
  // Simplified Selection
  selectedCategoryId?: string;
  selectedLevel?: 'Junior' | 'Middle' | 'Senior';
  
  // Question Properties
  questionCount: number;
  difficulty: string;
  
  // Auto-filled from Category
  generatedFields: string[];
  generatedTopics: string[];
  generatedSkills: string[];
  
  // Manual Override
  customFields?: string;
  customTopics?: string;
  customSkills?: string;
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
  // Additional fields for comprehensive results
  totalGenerated?: number;
  totalSelected?: number;
  totalUnselected?: number;
}

export default function AdminQuestionGeneratorPage() {
  // JobRole Data State
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [loadingJobRoles, setLoadingJobRoles] = useState(true);
  
  // Generation Config State
  const [config, setConfig] = useState<GenerationConfig>({
    selectedCategoryId: '',
    selectedLevel: undefined,
    questionCount: 5,
    difficulty: 'easy',
    generatedFields: [],
    generatedTopics: [],
    generatedSkills: [],
    customFields: '',
    customTopics: '',
    customSkills: '',
    customPrompt: ''
  });
  
  // Generation Process State
  const [generating, setGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [skipDuplicateCheck, setSkipDuplicateCheck] = useState(false);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.8);
  const [duplicateCheckResults, setDuplicateCheckResults] = useState<DuplicateCheckResponse | null>(null);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  // Edit Question State
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<GeneratedQuestion | null>(null);
  
  // Similarity Modal State
  const [similarityModalOpen, setSimilarityModalOpen] = useState(false);
  const [similarityModalData, setSimilarityModalData] = useState<{
    question: GeneratedQuestion;
    similarQuestions: Array<{
      questionId: string;
      similarity: number;
      reason: string;
      stem: string;
    }>;
  } | null>(null);



  const loadJobRoleMasterdata = async () => {
    try {
      setLoadingJobRoles(true);
      
      // Load Categories only
      const categoriesResponse = await fetch('/api/job-categories');
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);
      }
      
    } catch (error) {
      console.error('Error loading job role masterdata:', error);
    } finally {
      setLoadingJobRoles(false);
    }
  };

  const generateQuestionPropertiesFromCategory = useCallback(() => {
    const selectedCategory = categories.find(cat => cat.id === config.selectedCategoryId);
    
    if (selectedCategory) {
      const fields: string[] = [];
      const topics: string[] = [];
      const skills: string[] = [];
      
      // Generate from Category
      fields.push(selectedCategory.name);
      if (selectedCategory.skills) {
        skills.push(...selectedCategory.skills);
      }
      
      // Generate level-specific topics
      topics.push(`${selectedCategory.name} Fundamentals`);
      if (config.selectedLevel) {
        topics.push(`${config.selectedLevel} Level Questions`);
        topics.push(`${selectedCategory.name} ${config.selectedLevel} Skills`);
      }
      
      // Update config with generated properties
      setConfig(prev => ({
        ...prev,
        generatedFields: Array.from(new Set(fields)),
        generatedTopics: Array.from(new Set(topics)),
        generatedSkills: Array.from(new Set(skills)),
      }));
    }
  }, [categories, config.selectedCategoryId, config.selectedLevel]);

  // Load JobRole masterdata
  useEffect(() => {
    loadJobRoleMasterdata();
  }, []);

  // Auto-generate fields/topics/skills when Category or Level changes
  useEffect(() => {
    if (config.selectedCategoryId) {
      generateQuestionPropertiesFromCategory();
    }
  }, [config.selectedCategoryId, config.selectedLevel, generateQuestionPropertiesFromCategory]);

  const handleGenerate = async () => {
    // Validate configuration
    if (!config.selectedCategoryId) {
      toast.error('Please select a Category');
      return;
    }
    
    if (!config.selectedLevel) {
      toast.error('Please select a Level');
      return;
    }

    // Create new AbortController for this generation
    const controller = new AbortController();
    setAbortController(controller);
    setGenerating(true);
    setDuplicateCheckResults(null);
    
    try {
      // Prepare generation payload
      const selectedCategory = categories.find(cat => cat.id === config.selectedCategoryId);
      
      // Determine final properties (custom overrides auto-generated)
      const finalFields = config.customFields 
        ? config.customFields.split(',').map(f => f.trim()).filter(Boolean)
        : config.generatedFields;
        
      const finalTopics = config.customTopics
        ? config.customTopics.split(',').map(t => t.trim()).filter(Boolean)
        : config.generatedTopics;
        
      const finalSkills = config.customSkills
        ? config.customSkills.split(',').map(s => s.trim()).filter(Boolean)
        : config.generatedSkills;

      // Generate questions - mix of single_choice and multiple_choice
      const questionsToGenerate = [];
      
      // Tạo 1 request duy nhất với tổng số câu hỏi mong muốn
      // API sẽ tự động chia mix giữa single_choice và multiple_choice
      questionsToGenerate.push({
        categoryName: selectedCategory?.name,
        level: config.selectedLevel,
        fields: finalFields,
        topics: finalTopics,
        skills: finalSkills,
        questionType: 'mixed', // Cho phép API tự mix các loại câu hỏi
        difficulty: config.difficulty,
        questionCount: config.questionCount, // Sử dụng đúng số lượng user chọn
        customPrompt: config.customPrompt,
      });

      // Generate questions for both types
      const allGeneratedQuestions: GeneratedQuestion[] = [];
      
      for (const payload of questionsToGenerate) {
        if (payload.questionCount > 0) {
          const response = await fetch('/api/admin/qb2/questions/ai-generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });

          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || 'Generation failed');
          }

          // Add generated questions
          const questions = (data.questions || []).map((q: GeneratedQuestion) => ({
            ...q,
            category: selectedCategory?.name || q.category,
            fields: q.fields?.length ? q.fields : finalFields,
            topics: q.topics?.length ? q.topics : finalTopics,
            skills: q.skills?.length ? q.skills : finalSkills,
          }));
          
          allGeneratedQuestions.push(...questions);
        }
      }

      setGeneratedQuestions(allGeneratedQuestions);
      setSelectedQuestions(new Set(Array.from({ length: allGeneratedQuestions.length }, (_, i) => i)));
      
      // Show success toast
      toast.success(`Successfully generated ${allGeneratedQuestions.length} questions!`);
      
      // Auto-check duplicates if questions were generated successfully
      if (allGeneratedQuestions.length > 0 && !skipDuplicateCheck) {
        await checkDuplicatesForGeneratedQuestions(allGeneratedQuestions);
      }
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        toast('Question generation stopped by user');
      } else {
        console.error('Generation error:', error);
        toast.error('Failed to generate questions: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    } finally {
      setGenerating(false);
      setAbortController(null);
    }
  };

  const handleStopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setGenerating(false);
      setCheckingDuplicates(false);
      toast('Generation stopped');
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
            fields: q.fields,
            options: q.options,
            explanation: q.explanation
          })),
          similarityThreshold
        }),
        signal: abortController?.signal,
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
      
      // Show duplicate check completion toast
      const rejectedCount = duplicateData.results.filter((r: DuplicateCheckResult) => r.recommendation === 'reject').length;
      if (rejectedCount > 0) {
        toast(`Duplicate check completed: ${rejectedCount} questions auto-deselected due to high similarity`);
      } else {
        toast.success('Duplicate check completed: No high-similarity duplicates found');
      }
      
    } catch (error) {
      console.error('Duplicate check error:', error);
      // Don't show error alert for duplicate check failure - just continue without it
      console.warn('Duplicate check failed, continuing without duplicate detection');
    } finally {
      setCheckingDuplicates(false);
    }
  };



  const handleSaveSelected = async () => {
    const questionsToSave = generatedQuestions.filter((_, index) => selectedQuestions.has(index));
    
    if (questionsToSave.length === 0) {
      toast.error('Please select at least one question to save');
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
            tags: '', // Add empty tags field to prevent undefined error
            ...q.options?.reduce((acc, opt, idx) => ({
              ...acc,
              [`option${idx + 1}`]: opt.text,
              [`option${idx + 1}_correct`]: opt.isCorrect
            }), {})
          })),
          skipDuplicateCheck: true, // Always skip duplicate check when saving (already checked during generation)
          similarityThreshold
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Save failed');
      }

      // Calculate comprehensive results including unselected questions
      const totalGenerated = generatedQuestions.length;
      const totalSelected = questionsToSave.length;
      const totalUnselected = totalGenerated - totalSelected;
      const totalDuplicatesFromCheck = duplicateCheckResults?.results.filter(r => r.isDuplicate).length || 0;
      
      const comprehensiveResult = {
        ...result,
        // Override with comprehensive numbers
        skipped: totalUnselected, // Questions not selected for save
        duplicatesFound: totalDuplicatesFromCheck, // Total duplicates found during generation check
        totalGenerated,
        totalSelected,
        totalUnselected
      };
      
      setImportResult(comprehensiveResult);
      
      // Show summary message
      const message = result.message || `Successfully saved ${result.success} out of ${totalSelected} selected questions! (${totalUnselected} questions were not selected)`;
      
      toast.success(message);
      
      // Remove the entire Generated Questions table after successful save
      if (result.success > 0) {
        setGeneratedQuestions([]);
        setSelectedQuestions(new Set());
        setDuplicateCheckResults(null);
      }
      
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save questions: ' + (error instanceof Error ? error.message : 'Unknown error'));
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

  const startEditQuestion = (index: number) => {
    const question = generatedQuestions[index];
    setEditingQuestionIndex(index);
    setEditingQuestion({ ...question });
  };

  const cancelEditQuestion = () => {
    setEditingQuestionIndex(null);
    setEditingQuestion(null);
  };

  const saveEditQuestion = () => {
    if (editingQuestionIndex !== null && editingQuestion) {
      const updatedQuestions = [...generatedQuestions];
      updatedQuestions[editingQuestionIndex] = editingQuestion;
      setGeneratedQuestions(updatedQuestions);
      setEditingQuestionIndex(null);
      setEditingQuestion(null);
    }
  };

  const updateEditingQuestion = (field: string, value: string | string[]) => {
    if (editingQuestion) {
      setEditingQuestion({
        ...editingQuestion,
        [field]: value
      });
    }
  };

  const updateEditingQuestionOption = (optionIndex: number, field: 'text' | 'isCorrect', value: string | boolean) => {
    if (editingQuestion && editingQuestion.options) {
      const updatedOptions = [...editingQuestion.options];
      updatedOptions[optionIndex] = {
        ...updatedOptions[optionIndex],
        [field]: value
      };
      setEditingQuestion({
        ...editingQuestion,
        options: updatedOptions
      });
    }
  };

  const addEditingQuestionOption = () => {
    if (editingQuestion) {
      const newOptions = [...(editingQuestion.options || [])];
      newOptions.push({ text: '', isCorrect: false });
      setEditingQuestion({
        ...editingQuestion,
        options: newOptions
      });
    }
  };

  const removeEditingQuestionOption = (optionIndex: number) => {
    if (editingQuestion && editingQuestion.options) {
      const updatedOptions = editingQuestion.options.filter((_, idx) => idx !== optionIndex);
      setEditingQuestion({
        ...editingQuestion,
        options: updatedOptions
      });
    }
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
        
        {/* Job Role Selection Section */}
        <JobRoleSelection
          categories={categories}
          config={{
            selectedCategoryId: config.selectedCategoryId,
            selectedLevel: config.selectedLevel
          }}
          onConfigChange={(updates) => setConfig({ ...config, ...updates })}
          loadingJobRoles={loadingJobRoles}
        />
        
        {/* Auto-Generated Properties Display */}
        <GeneratedPropertiesDisplay
          generatedFields={config.generatedFields}
          generatedTopics={config.generatedTopics}
          generatedSkills={config.generatedSkills}
        />

        {/* Manual Override Section */}
        <ManualOverrideSection
          config={{
            customFields: config.customFields,
            customTopics: config.customTopics,
            customSkills: config.customSkills
          }}
          onConfigChange={(updates) => setConfig({ ...config, ...updates })}
        />

        <QuestionPropertiesSection
          config={config}
          onConfigChange={(updates) => setConfig({ ...config, ...updates })}
        />

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

        <DuplicateDetectionSettings
          skipDuplicateCheck={skipDuplicateCheck}
          onSkipDuplicateCheckChange={setSkipDuplicateCheck}
          similarityThreshold={similarityThreshold}
          onSimilarityThresholdChange={setSimilarityThreshold}
        />

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={loadingJobRoles || generating || checkingDuplicates}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium ${
              loadingJobRoles || generating || checkingDuplicates
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            {loadingJobRoles ? 'Loading Job Roles...' : generating ? 'Generating...' : checkingDuplicates ? 'Checking Duplicates...' : 'Generate Questions'}
          </button>
          
          {(generating || checkingDuplicates) && (
            <button
              onClick={handleStopGeneration}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              <X className="w-4 h-4" />
              Stop
            </button>
          )}
        </div>
      </div>



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
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
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
                        <div className="flex items-center gap-2">
                          {editingQuestionIndex === index ? (
                            <>
                              <button
                                onClick={saveEditQuestion}
                                className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded"
                                title="Save changes"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={cancelEditQuestion}
                                className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                                title="Cancel editing"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => startEditQuestion(index)}
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                              title="Edit question"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {editingQuestionIndex === index && editingQuestion ? (
                        // Edit Form
                        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                          {/* Question Stem */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                            <textarea
                              value={editingQuestion.stem}
                              onChange={(e) => updateEditingQuestion('stem', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              rows={3}
                            />
                          </div>

                          {/* Basic Properties */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                              <select
                                value={editingQuestion.type}
                                onChange={(e) => updateEditingQuestion('type', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="single_choice">Single Choice</option>
                                <option value="multiple_choice">Multiple Choice</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                              <select
                                value={editingQuestion.level}
                                onChange={(e) => updateEditingQuestion('level', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="Junior">Junior</option>
                                <option value="Middle">Middle</option>
                                <option value="Senior">Senior</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                              <select
                                value={editingQuestion.difficulty}
                                onChange={(e) => updateEditingQuestion('difficulty', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                              </select>
                            </div>
                          </div>

                          {/* Category */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <input
                              type="text"
                              value={editingQuestion.category}
                              onChange={(e) => updateEditingQuestion('category', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          {/* Options */}
                          {editingQuestion.options && editingQuestion.options.length > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">Options</label>
                                <button
                                  onClick={addEditingQuestionOption}
                                  className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                  + Add Option
                                </button>
                              </div>
                              <div className="space-y-2">
                                {editingQuestion.options.map((option, optIndex) => (
                                  <div key={optIndex} className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={option.isCorrect}
                                      onChange={(e) => updateEditingQuestionOption(optIndex, 'isCorrect', e.target.checked)}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <input
                                      type="text"
                                      value={option.text}
                                      onChange={(e) => updateEditingQuestionOption(optIndex, 'text', e.target.value)}
                                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      placeholder={`Option ${optIndex + 1}`}
                                    />
                                    <button
                                      onClick={() => removeEditingQuestionOption(optIndex)}
                                      className="text-red-600 hover:text-red-800 p-1"
                                      title="Remove option"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Explanation */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Explanation</label>
                            <textarea
                              value={editingQuestion.explanation || ''}
                              onChange={(e) => updateEditingQuestion('explanation', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              rows={2}
                              placeholder="Optional explanation for the answer..."
                            />
                          </div>

                          {/* Fields, Topics and Skills */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Fields</label>
                              <input
                                type="text"
                                value={editingQuestion.fields.join(', ')}
                                onChange={(e) => updateEditingQuestion('fields', e.target.value.split(',').map(f => f.trim()).filter(Boolean))}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Frontend, Backend, DevOps..."
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Topics</label>
                              <input
                                type="text"
                                value={editingQuestion.topics.join(', ')}
                                onChange={(e) => updateEditingQuestion('topics', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="React, JavaScript, APIs..."
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                              <input
                                type="text"
                                value={editingQuestion.skills.join(', ')}
                                onChange={(e) => updateEditingQuestion('skills', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="React, Vue, Angular..."
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Display Mode
                        <div>
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
                          
                          {/* Fields, Topics and Skills */}
                          {(question.fields.length > 0 || question.topics.length > 0 || question.skills.length > 0) && (
                            <div className="mt-2 space-y-1">
                              {question.topics.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-gray-500">Topics:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {question.topics.map((topic, topicIndex) => (
                                      <span
                                        key={topicIndex}
                                        className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded"
                                      >
                                        {topic}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {question.fields.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-gray-500">Fields:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {question.fields.map((field, fieldIndex) => (
                                      <span
                                        key={fieldIndex}
                                        className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded"
                                      >
                                        {field}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {question.skills.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-gray-500">Skills:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {question.skills.slice(0, 5).map((skill, skillIndex) => (
                                      <span
                                        key={skillIndex}
                                        className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                    {question.skills.length > 5 && (
                                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                        +{question.skills.length - 5} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Similarity Analysis Button */}
                      {duplicateResult && duplicateResult.similarQuestions && duplicateResult.similarQuestions.length > 0 && (
                        <div className="mt-3">
                          <button
                            onClick={() => {
                              setSimilarityModalData({
                                question: question,
                                similarQuestions: duplicateResult.similarQuestions
                              });
                              setSimilarityModalOpen(true);
                            }}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-md hover:bg-blue-200 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            View Similarity ({duplicateResult.similarQuestions.length})
                          </button>
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

      {/* Similarity Modal */}
      <SimilarityModal
        isOpen={similarityModalOpen}
        onClose={() => setSimilarityModalOpen(false)}
        data={similarityModalData}
      />


    </div>
  );
}
