import React from 'react';

interface DuplicateDetectionSettingsProps {
  skipDuplicateCheck: boolean;
  similarityThreshold: number;
  onSkipDuplicateCheckChange: (skip: boolean) => void;
  onSimilarityThresholdChange: (threshold: number) => void;
}

const DuplicateDetectionSettings: React.FC<DuplicateDetectionSettingsProps> = ({
  skipDuplicateCheck,
  similarityThreshold,
  onSkipDuplicateCheckChange,
  onSimilarityThresholdChange
}) => {
  return (
    <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
      <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
        🛡️ Advanced Duplicate Detection
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="skipDuplicateCheck"
            checked={skipDuplicateCheck}
            onChange={(e) => onSkipDuplicateCheckChange(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="skipDuplicateCheck" className="ml-2 text-sm text-gray-700">
            Skip duplicate detection (save all questions without checking)
          </label>
        </div>

        {!skipDuplicateCheck && (
          <div className="space-y-4">
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
                onChange={(e) => onSimilarityThresholdChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>60% (Less strict)</span>
                <span>100% (Very strict)</span>
              </div>
            </div>
            
            <div className="bg-white p-3 rounded border border-blue-200">
              <h4 className="font-medium text-sm text-gray-800 mb-2">Enhanced Detection Features:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Question stem comparison</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>Answer options analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>Explanation similarity</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <span>Contextual understanding</span>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                System checks questions comprehensively across content, options, and explanations to identify true duplicates while preserving legitimate variations.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DuplicateDetectionSettings;
