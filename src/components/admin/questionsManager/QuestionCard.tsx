'use client';

import { Edit2, Trash2 } from 'lucide-react';
import TagComponent from './TagComponent';

interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuestionItem {
  id: string;
  stem: string;
  type: string;
  explanation?: string;
  options?: QuestionOption[];
  category?: string;
  level?: string;
  difficulty?: string;
  topics?: string[];
  fields?: string[];
  skills?: string[];
  tags?: string[];
}

interface QuestionCardProps {
  question: QuestionItem;
  onEdit: (question: QuestionItem) => void;
  onDelete: (id: string) => void;
}

export const QuestionCard = ({ question, onEdit, onDelete }: QuestionCardProps) => {
  const getDifficultyColor = (diff: string | null | undefined) => {
    switch (diff) {
      case 'easy': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';  
      case 'hard': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'single_choice': return 'Single Choice';
      case 'multiple_choice': return 'Multiple Choice';
      case 'free_text': return 'Free Text';
      case 'scale': return 'Scale';
      case 'coding': return 'Coding';
      default: return type;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
            {getTypeLabel(question.type)}
          </span>
          {question.level && (
            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
              {question.level}
            </span>
          )}
          {question.difficulty && (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(question.difficulty)}`}>
              {question.difficulty}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => onEdit(question)}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(question.id)}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Question Content */}
      <div className="mb-4">
        <h3 className="font-medium text-gray-900 mb-2 line-clamp-3">{question.stem}</h3>
        {question.explanation && (
          <p className="text-sm text-gray-600 line-clamp-2">{question.explanation}</p>
        )}
      </div>

      {/* Options Preview */}
      {question.options && question.options.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-medium text-gray-500 mb-2">Options:</div>
          <div className="space-y-1">
            {question.options.slice(0, 3).map((option, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${option.isCorrect ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-sm text-gray-700 line-clamp-1">{option.text}</span>
              </div>
            ))}
            {question.options.length > 3 && (
              <div className="text-xs text-gray-500">+{question.options.length - 3} more options</div>
            )}
          </div>
        </div>
      )}

      {/* Tags & Metadata */}
      <div className="space-y-2">
        {question.category && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Category:</span>
            <TagComponent text={question.category} variant="default" />
          </div>
        )}
        
        {question.topics && question.topics.length > 0 && (
          <div className="flex items-start gap-2">
            <span className="text-xs text-gray-500 mt-1">Topics:</span>
            <div className="flex flex-wrap gap-1">
              {question.topics.slice(0, 3).map((topic, idx) => (
                <TagComponent key={idx} text={topic} variant="warning" />
              ))}
              {question.topics.length > 3 && (
                <span className="text-xs text-gray-500 mt-1">+{question.topics.length - 3}</span>
              )}
            </div>
          </div>
        )}

        {question.fields && question.fields.length > 0 && (
          <div className="flex items-start gap-2">
            <span className="text-xs text-gray-500 mt-1">Fields:</span>
            <div className="flex flex-wrap gap-1">
              {question.fields.slice(0, 3).map((field, idx) => (
                <TagComponent key={idx} text={field} variant="error" />
              ))}
              {question.fields.length > 3 && (
                <span className="text-xs text-gray-500 mt-1">+{question.fields.length - 3}</span>
              )}
            </div>
          </div>
        )}
        
        {question.skills && question.skills.length > 0 && (
          <div className="flex items-start gap-2">
            <span className="text-xs text-gray-500 mt-1">Skills:</span>
            <div className="flex flex-wrap gap-1">
              {question.skills.slice(0, 3).map((skill, idx) => (
                <TagComponent key={idx} text={skill} variant="success" />
              ))}
              {question.skills.length > 3 && (
                <span className="text-xs text-gray-500 mt-1">+{question.skills.length - 3}</span>
              )}
            </div>
          </div>
        )}

        {question.tags && question.tags.length > 0 && (
          <div className="flex items-start gap-2">
            <span className="text-xs text-gray-500 mt-1">Tags:</span>
            <div className="flex flex-wrap gap-1">
              {question.tags.slice(0, 4).map((tag, idx) => (
                <TagComponent key={idx} text={tag} variant="warning" />
              ))}
              {question.tags.length > 4 && (
                <span className="text-xs text-gray-500 mt-1">+{question.tags.length - 4}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
