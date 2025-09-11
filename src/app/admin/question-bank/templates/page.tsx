"use client";
import React, { useState } from "react";
import { Copy, Plus, BookOpen, Zap } from "lucide-react";

interface QuestionTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template: {
    stem: string;
    type: string;
    level: string;
    difficulty: string;
    fields: string[];
    topics: string[];
    skills: string[];
    options?: Array<{ text: string; isCorrect: boolean }>;
    explanation?: string;
  };
}

const QUESTION_TEMPLATES: QuestionTemplate[] = [
  {
    id: 'react-basics',
    name: 'React Basics - What is JSX?',
    description: 'Template for basic React JSX questions',
    category: 'Frontend',
    template: {
      stem: 'What is JSX in React?',
      type: 'single_choice',
      level: 'junior',
      difficulty: 'easy',
      fields: ['Frontend Development'],
      topics: ['React', 'JSX'],
      skills: ['React', 'JavaScript'],
      options: [
        { text: 'A JavaScript extension that allows HTML-like syntax', isCorrect: true },
        { text: 'A CSS framework for React', isCorrect: false },
        { text: 'A database query language', isCorrect: false },
        { text: 'A testing framework', isCorrect: false }
      ],
      explanation: 'JSX is a JavaScript extension that allows you to write HTML-like syntax in your JavaScript code, making React components more readable and intuitive.'
    }
  },
  {
    id: 'node-async',
    name: 'Node.js Async/Await',
    description: 'Template for Node.js asynchronous programming',
    category: 'Backend',
    template: {
      stem: 'What is the main advantage of using async/await over Promises in Node.js?',
      type: 'single_choice',
      level: 'middle',
      difficulty: 'medium',
      fields: ['Backend Development'],
      topics: ['Node.js', 'Async Programming'],
      skills: ['Node.js', 'JavaScript', 'Asynchronous Programming'],
      options: [
        { text: 'Better error handling and more readable code', isCorrect: true },
        { text: 'Faster execution speed', isCorrect: false },
        { text: 'Less memory usage', isCorrect: false },
        { text: 'Automatic promise creation', isCorrect: false }
      ],
      explanation: 'Async/await provides better error handling with try/catch blocks and makes asynchronous code more readable and maintainable compared to promise chains.'
    }
  },
  {
    id: 'system-design',
    name: 'System Design - Scalability',
    description: 'Template for system design scalability questions',
    category: 'System Design',
    template: {
      stem: 'How would you design a system to handle 1 million concurrent users?',
      type: 'free_text',
      level: 'senior',
      difficulty: 'hard',
      fields: ['System Design', 'Backend Development'],
      topics: ['Scalability', 'Architecture', 'Performance'],
      skills: ['System Design', 'Architecture', 'Scalability'],
      explanation: 'Key considerations include: load balancing, horizontal scaling, database sharding, caching strategies, CDN usage, microservices architecture, and monitoring systems.'
    }
  },
  {
    id: 'sql-joins',
    name: 'SQL Joins',
    description: 'Template for SQL join operations',
    category: 'Database',
    template: {
      stem: 'Which SQL JOIN returns all records from both tables, regardless of matching?',
      type: 'single_choice',
      level: 'middle',
      difficulty: 'medium',
      fields: ['Database'],
      topics: ['SQL', 'Joins'],
      skills: ['SQL', 'Database Design'],
      options: [
        { text: 'FULL OUTER JOIN', isCorrect: true },
        { text: 'INNER JOIN', isCorrect: false },
        { text: 'LEFT JOIN', isCorrect: false },
        { text: 'RIGHT JOIN', isCorrect: false }
      ],
      explanation: 'FULL OUTER JOIN returns all records from both tables, with NULL values where there are no matches in either table.'
    }
  },
  {
    id: 'algorithm-complexity',
    name: 'Algorithm Complexity',
    description: 'Template for Big O notation questions',
    category: 'Algorithms',
    template: {
      stem: 'What is the time complexity of searching in a balanced binary search tree?',
      type: 'single_choice',
      level: 'middle',
      difficulty: 'medium',
      fields: ['Computer Science'],
      topics: ['Algorithms', 'Data Structures'],
      skills: ['Algorithms', 'Big O Notation'],
      options: [
        { text: 'O(log n)', isCorrect: true },
        { text: 'O(n)', isCorrect: false },
        { text: 'O(n log n)', isCorrect: false },
        { text: 'O(1)', isCorrect: false }
      ],
      explanation: 'In a balanced BST, search operations have O(log n) time complexity because the tree height is logarithmic relative to the number of nodes.'
    }
  }
];

const QUICK_PRESETS = [
  {
    name: 'Frontend Junior Pack',
    description: 'Essential questions for junior frontend developers',
    fields: ['Frontend Development'],
    level: 'junior',
    topics: ['HTML', 'CSS', 'JavaScript', 'React'],
    count: 10
  },
  {
    name: 'Backend Senior Pack',
    description: 'Advanced questions for senior backend developers',
    fields: ['Backend Development'],
    level: 'senior',
    topics: ['System Design', 'Database', 'API Design', 'Security'],
    count: 8
  },
  {
    name: 'Full Stack Middle Pack',
    description: 'Comprehensive questions for mid-level full stack developers',
    fields: ['Frontend Development', 'Backend Development'],
    level: 'middle',
    topics: ['React', 'Node.js', 'Database', 'REST APIs'],
    count: 12
  },
  {
    name: 'DevOps Essentials',
    description: 'Core DevOps and infrastructure questions',
    fields: ['DevOps'],
    level: 'middle',
    topics: ['Docker', 'CI/CD', 'AWS', 'Monitoring'],
    count: 8
  }
];

export default function AdminQuestionTemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<QuestionTemplate | null>(null);
  const [customizing, setCustomizing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleUseTemplate = (template: QuestionTemplate) => {
    setSelectedTemplate(template);
    setCustomizing(true);
  };

  const handleSaveQuestion = async () => {
    if (!selectedTemplate) return;

    setSaving(true);
    try {
      const response = await fetch('/api/admin/qb2/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...selectedTemplate.template,
          fields: selectedTemplate.template.fields.join(','),
          topics: selectedTemplate.template.topics.join(','),
          skills: selectedTemplate.template.skills.join(','),
          ...(selectedTemplate.template.options ? {
            options: selectedTemplate.template.options.map((opt, idx) => ({
              text: opt.text,
              isCorrect: opt.isCorrect,
              order: idx
            }))
          } : {})
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save question');
      }

      alert('Question saved successfully!');
      setCustomizing(false);
      setSelectedTemplate(null);
      
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save question: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateFromPreset = async (preset: typeof QUICK_PRESETS[0]) => {
    try {
      const response = await fetch('/api/admin/qb2/questions/ai-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          field: preset.fields[0],
          level: preset.level,
          difficulty: 'medium',
          questionCount: preset.count,
          questionType: 'single_choice',
          topics: preset.topics.join(', '),
          customPrompt: `Generate a comprehensive set of questions for ${preset.description}`
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      // Auto-save generated questions
      const saveResponse = await fetch('/api/admin/qb2/questions/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          questions: data.questions.map((q: unknown) => {
            const question = q as Record<string, unknown>;
            return {
              ...question,
              fields: Array.isArray(question.fields) ? question.fields.join(',') : question.fields,
              topics: Array.isArray(question.topics) ? question.topics.join(',') : question.topics,
              skills: Array.isArray(question.skills) ? question.skills.join(',') : question.skills,
              ...(question.options ? {
                ...(question.options as Array<Record<string, unknown>>).reduce((acc: Record<string, unknown>, opt: Record<string, unknown>, idx: number) => ({
                  ...acc,
                  [`option${idx + 1}`]: opt.text,
                  [`option${idx + 1}_correct`]: opt.isCorrect
                }), {})
              } : {})
            };
          })
        }),
      });

      const saveResult = await saveResponse.json();
      
      if (!saveResponse.ok) {
        throw new Error(saveResult.error || 'Save failed');
      }

      alert(`Successfully generated and saved ${saveResult.success} questions from "${preset.name}" preset!`);
      
    } catch (error) {
      console.error('Preset generation error:', error);
      alert('Failed to generate from preset: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            Question Templates & Presets
          </h1>
          <p className="text-gray-600 mt-1">Use pre-built templates and presets to add questions quickly</p>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-600" />
          Quick Presets (AI Generated)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {QUICK_PRESETS.map((preset, index) => (
            <div key={index} className="border rounded-lg p-4 hover:border-blue-300 transition-colors">
              <h3 className="font-medium text-gray-900 mb-2">{preset.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{preset.description}</p>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                  {preset.level}
                </span>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                  {preset.count} questions
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {preset.topics.map((topic, topicIndex) => (
                  <span key={topicIndex} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    {topic}
                  </span>
                ))}
              </div>
              <button
                onClick={() => handleGenerateFromPreset(preset)}
                className="w-full px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm font-medium"
              >
                Generate & Save All
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Question Templates */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Question Templates</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {QUESTION_TEMPLATES.map((template) => (
            <div key={template.id} className="border rounded-lg p-4 hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                  {template.category}
                </span>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                  {template.template.level}
                </span>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">{template.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{template.description}</p>
              <p className="text-sm text-gray-800 mb-3 italic">&ldquo;{template.template.stem}&rdquo;</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleUseTemplate(template)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  Use Template
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customization Modal */}
      {customizing && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Customize Template</h2>
                <button
                  onClick={() => setCustomizing(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                  <textarea
                    value={selectedTemplate.template.stem}
                    onChange={(e) => setSelectedTemplate({
                      ...selectedTemplate,
                      template: { ...selectedTemplate.template, stem: e.target.value }
                    })}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                {selectedTemplate.template.options && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                    {selectedTemplate.template.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={option.isCorrect}
                          onChange={(e) => {
                            const newOptions = [...selectedTemplate.template.options!];
                            newOptions[index].isCorrect = e.target.checked;
                            setSelectedTemplate({
                              ...selectedTemplate,
                              template: { ...selectedTemplate.template, options: newOptions }
                            });
                          }}
                        />
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => {
                            const newOptions = [...selectedTemplate.template.options!];
                            newOptions[index].text = e.target.value;
                            setSelectedTemplate({
                              ...selectedTemplate,
                              template: { ...selectedTemplate.template, options: newOptions }
                            });
                          }}
                          className="flex-1 border border-gray-300 rounded-md px-3 py-1"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Explanation</label>
                  <textarea
                    value={selectedTemplate.template.explanation || ''}
                    onChange={(e) => setSelectedTemplate({
                      ...selectedTemplate,
                      template: { ...selectedTemplate.template, explanation: e.target.value }
                    })}
                    rows={2}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleSaveQuestion}
                    disabled={saving}
                    className={`flex items-center gap-2 px-4 py-2 rounded font-medium ${
                      saving
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Question'}
                  </button>
                  <button
                    onClick={() => setCustomizing(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
