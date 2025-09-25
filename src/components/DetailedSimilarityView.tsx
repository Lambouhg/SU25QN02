import React from 'react';

interface DetailedSimilarityProps {
  question: {
    stem: string;
    options?: Array<{ text: string; isCorrect: boolean }>;
    explanation?: string;
  };
  similarQuestion: {
    questionId: string;
    similarity: number;
    reason: string;
    stem: string;
  };
}

export const DetailedSimilarityView: React.FC<DetailedSimilarityProps> = ({
  question,
  similarQuestion
}) => {
  return (
    <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-semibold text-yellow-800">
          Similar Question Found ({Math.round(similarQuestion.similarity * 100)}% similarity)
        </h4>
        <span className="text-sm text-yellow-600">ID: {similarQuestion.questionId}</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* New Question */}
        <div className="space-y-3">
          <h5 className="font-medium text-gray-700">New Question:</h5>
          <div className="bg-white p-3 rounded border">
            <p className="text-sm text-gray-800 mb-2">{question.stem}</p>
            
            {question.options && question.options.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-600">Options:</p>
                {question.options.map((option, idx) => (
                  <div key={idx} className="text-xs text-gray-700 flex items-center gap-2">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-xs ${
                      option.isCorrect ? 'bg-green-500' : 'bg-gray-400'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className={option.isCorrect ? 'font-medium' : ''}>{option.text}</span>
                  </div>
                ))}
              </div>
            )}
            
            {question.explanation && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-600">Explanation:</p>
                <p className="text-xs text-gray-700">{question.explanation}</p>
              </div>
            )}
          </div>
        </div>

        {/* Similar Existing Question */}
        <div className="space-y-3">
          <h5 className="font-medium text-gray-700">Similar Existing Question:</h5>
          <div className="bg-red-50 p-3 rounded border border-red-200">
            <p className="text-sm text-gray-800">{similarQuestion.stem}</p>
            <div className="mt-2 pt-2 border-t border-red-200">
              <p className="text-xs font-medium text-red-600">Similarity Details:</p>
              <p className="text-xs text-red-700">{similarQuestion.reason}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Similarity Analysis */}
      <div className="mt-4 p-3 bg-yellow-100 rounded border border-yellow-300">
        <h6 className="font-medium text-yellow-800 mb-2">Similarity Analysis:</h6>
        <div className="text-sm text-yellow-700">
          <p>{similarQuestion.reason}</p>
          
          {/* Visual similarity bar */}
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span>Similarity Score</span>
              <span>{Math.round(similarQuestion.similarity * 100)}%</span>
            </div>
            <div className="w-full bg-yellow-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  similarQuestion.similarity >= 0.9 ? 'bg-red-500' : 
                  similarQuestion.similarity >= 0.8 ? 'bg-orange-500' : 'bg-yellow-500'
                }`}
                style={{ width: `${similarQuestion.similarity * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Recommendations */}
      <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
        <h6 className="font-medium text-blue-800 text-sm mb-1">Recommendations:</h6>
        <div className="text-xs text-blue-700 space-y-1">
          {similarQuestion.similarity >= 0.9 && (
            <p>• Very high similarity - Consider significantly rewording or choosing a different topic</p>
          )}
          {similarQuestion.similarity >= 0.8 && similarQuestion.similarity < 0.9 && (
            <p>• High similarity - Review and modify the question, options, or explanation to increase uniqueness</p>
          )}
          {similarQuestion.similarity >= 0.7 && similarQuestion.similarity < 0.8 && (
            <p>• Moderate similarity - Consider small modifications to differentiate better</p>
          )}
          <p>• Check if both questions test the same learning objective or can be combined</p>
          <p>• Ensure the new question adds unique value to the question bank</p>
        </div>
      </div>
    </div>
  );
};

export default DetailedSimilarityView;
