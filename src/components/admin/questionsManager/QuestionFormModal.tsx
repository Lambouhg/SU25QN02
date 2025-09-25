'use client';

import { X, FileText, Settings, Tag, CheckCircle, Plus, Trash2, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface QuestionOption {
  id?: string;
  text: string;
  isCorrect: boolean;
}

interface QuestionFormData {
  stem: string;
  explanation: string;
  type: string;
  level: string;
  difficulty: string;
  category: string;
  topics: string;
  fields: string;
  skills: string;
  tags: string;
  options: QuestionOption[];
}

interface QuestionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: QuestionFormData) => void;
  initialData?: Partial<QuestionFormData>;
  isEditing: boolean;
}

export const QuestionFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing = false
}: QuestionFormModalProps) => {
  const [formData, setFormData] = useState<QuestionFormData>({
    stem: initialData?.stem || '',
    explanation: initialData?.explanation || '',
    type: initialData?.type || 'single_choice',
    level: initialData?.level || '',
    difficulty: initialData?.difficulty || '',
    category: initialData?.category || '',
    topics: initialData?.topics || '',
    fields: initialData?.fields || '',
    skills: initialData?.skills || '',
    tags: initialData?.tags || '',
    options: initialData?.options || []
  });

  // Update form data when initialData changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        stem: initialData?.stem || '',
        explanation: initialData?.explanation || '',
        type: initialData?.type || 'single_choice',
        level: initialData?.level || '',
        difficulty: initialData?.difficulty || '',
        category: initialData?.category || '',
        topics: initialData?.topics || '',
        fields: initialData?.fields || '',
        skills: initialData?.skills || '',
        tags: initialData?.tags || '',
        options: initialData?.options || []
      });
    }
  }, [isOpen, initialData]);



  const updateFormData = (field: keyof QuestionFormData, value: string | QuestionOption[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { text: '', isCorrect: false }]
    }));
  };

  const updateOption = (idx: number, updates: Partial<QuestionOption>) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => 
        i === idx ? { ...opt, ...updates } : opt
      )
    }));
  };

  const removeOption = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  const handleClose = () => {
    // Reset form data when closing
    setFormData({
      stem: '',
      explanation: '',
      type: 'single_choice',
      level: '',
      difficulty: '',
      category: '',
      topics: '',
      fields: '',
      skills: '',
      tags: '',
      options: []
    });
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div 
        className="modal-content bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditing ? "Edit Question" : "Create New Question"}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {isEditing ? "Update question information" : "Add a new question to the bank"}
              </p>
            </div>
            <button 
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Question Content Section */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Question Content
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question <span className="text-red-500">*</span>
                  </label>
                  <textarea 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-24" 
                    placeholder="Enter question content..."
                    value={formData.stem} 
                    onChange={(e) => updateFormData('stem', e.target.value)} 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Explanation</label>
                  <textarea 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-20" 
                    placeholder="Explain the correct answer..."
                    value={formData.explanation} 
                    onChange={(e) => updateFormData('explanation', e.target.value)} 
                  />
                </div>
              </div>
            </div>

            {/* Question Properties Section */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Question Properties
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Type <span className="text-red-500">*</span>
                  </label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    value={formData.type} 
                    onChange={(e) => updateFormData('type', e.target.value)}
                  >
                    <option value="single_choice">Single Choice</option>
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="free_text">Free Text</option>
                    <option value="scale">Scale</option>
                    <option value="coding">Coding</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    value={formData.level} 
                    onChange={(e) => updateFormData('level', e.target.value)}
                  >
                    <option value="">Select level</option>
                    <option value="junior">Junior</option>
                    <option value="middle">Middle</option>
                    <option value="senior">Senior</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    value={formData.difficulty} 
                    onChange={(e) => updateFormData('difficulty', e.target.value)}
                  >
                    <option value="">Select difficulty</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <input 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    placeholder="Frontend, Backend..."
                    value={formData.category} 
                    onChange={(e) => updateFormData('category', e.target.value)} 
                  />
                </div>
              </div>
            </div>

            {/* Metadata Section */}
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Additional Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Topics (comma separated)</label>
                  <input 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    placeholder="React, JavaScript, Programming..."
                    value={formData.topics} 
                    onChange={(e) => updateFormData('topics', e.target.value)} 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fields (comma separated)</label>
                  <input 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    placeholder="Frontend, Backend, DevOps..."
                    value={formData.fields} 
                    onChange={(e) => updateFormData('fields', e.target.value)} 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Skills (comma separated)</label>
                  <input 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    placeholder="React, Vue, Angular..."
                    value={formData.skills} 
                    onChange={(e) => updateFormData('skills', e.target.value)} 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma separated)</label>
                  <input 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    placeholder="react, hooks, components..."
                    value={formData.tags} 
                    onChange={(e) => updateFormData('tags', e.target.value)} 
                  />
                </div>
              </div>
            </div>

            {/* Options Section */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-yellow-900 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Options
                </h3>
                <button 
                  className="flex items-center gap-2 px-3 py-1 bg-yellow-200 text-yellow-800 rounded-lg hover:bg-yellow-300 transition-colors text-sm" 
                  onClick={addOption}
                >
                  <Plus className="w-4 h-4" />
                  Add Option
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.options.map((option, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <div className="flex-1">
                      <input 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                        placeholder={`Option ${idx + 1}`} 
                        value={option.text} 
                        onChange={(e) => updateOption(idx, { text: e.target.value })} 
                      />
                    </div>
                    <label className="flex items-center gap-2 min-w-fit">
                      <input 
                        type="checkbox" 
                        checked={!!option.isCorrect} 
                        onChange={(e) => updateOption(idx, { isCorrect: e.target.checked })} 
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Correct</span>
                    </label>
                    <button 
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                      onClick={() => removeOption(idx)}
                      title="Remove option"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
          <button 
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors" 
            onClick={handleClose}
          >
            Cancel
          </button>
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" 
            onClick={handleSubmit}
          >
            <Save className="w-4 h-4" />
            {isEditing ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );

  // Use portal to render modal at document.body level to avoid z-index issues
  // This ensures the modal is rendered outside the current DOM tree, preventing z-index conflicts
  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  
  // Fallback for SSR or when document is not available
  return modalContent;
};
