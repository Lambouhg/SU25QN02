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

  const handleGenerate = async () => {
    setGenerating(true);
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
      
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate questions: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveSelected = async () => {
    const questionsToSave = generatedQuestions.filter((_, index) => selectedQuestions.has(index));
    
    if (questionsToSave.length === 0) {
      alert('Please select at least one question to save');
      return;
    }

    setSaving(true);
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
          }))
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Save failed');
      }

      alert(`Successfully saved ${result.success} questions!`);
      setGeneratedQuestions([]);
      setSelectedQuestions(new Set());
      
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
              <option value="free_text">Free Text</option>
              <option value="coding">Coding</option>
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

        <div className="mt-6">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium ${
              generating
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            {generating ? 'Generating...' : 'Generate Questions'}
          </button>
        </div>
      </div>

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
            {generatedQuestions.map((question, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${
                  selectedQuestions.has(index) ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedQuestions.has(index)}
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
                      <p className="text-sm text-gray-600 italic">{question.explanation}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-2 mt-2">
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
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
