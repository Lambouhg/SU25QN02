import React from 'react';
import { X } from 'lucide-react';
import DetailedSimilarityView from '@/components/DetailedSimilarityView';

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

interface SimilarQuestion {
  questionId: string;
  similarity: number;
  reason: string;
  stem: string;
}

interface SimilarityModalData {
  question: GeneratedQuestion;
  similarQuestions: SimilarQuestion[];
}

interface SimilarityModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SimilarityModalData | null;
}

const SimilarityModal: React.FC<SimilarityModalProps> = ({
  isOpen,
  onClose,
  data
}) => {
  if (!isOpen || !data) return null;

  const { question, similarQuestions } = data;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-6xl max-h-[90vh] overflow-y-auto p-6 m-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Similarity Analysis</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="space-y-4">
          {similarQuestions.map((similarQuestion, index) => (
            <DetailedSimilarityView
              key={index}
              question={question}
              similarQuestion={similarQuestion}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimilarityModal;
