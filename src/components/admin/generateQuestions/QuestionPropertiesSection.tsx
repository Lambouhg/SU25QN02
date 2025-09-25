import React from 'react';
import { Settings } from 'lucide-react';

interface QuestionPropertiesSectionProps {
  config: {
    difficulty: string;
    questionCount: number;
    customPrompt?: string;
  };
  onConfigChange: (updates: Partial<{
    difficulty: string;
    questionCount: number;
    customPrompt?: string;
  }>) => void;
}

const QuestionPropertiesSection: React.FC<QuestionPropertiesSectionProps> = ({
  config,
  onConfigChange
}) => {
  return (
    <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
      <h3 className="font-medium text-yellow-900 mb-3 flex items-center gap-2">
        <Settings className="w-4 h-4" />
        Question Properties
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
          <select
            value={config.difficulty}
            onChange={(e) => onConfigChange({ difficulty: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Question Count</label>
          <input
            type="number"
            min="1"
            max="20"
            value={config.questionCount}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 1;
              const clampedValue = Math.max(1, Math.min(20, value));
              onConfigChange({ questionCount: clampedValue });
            }}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            title="Maximum 20 questions per generation"
          />
          <p className="text-xs text-gray-500 mt-1">Max 20 questions (will generate mix of single & multiple choice)</p>
        </div>
      </div>
    </div>
  );
};

export default QuestionPropertiesSection;
