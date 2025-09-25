'use client';

import { FileText, CheckCircle, RefreshCw, Plus } from 'lucide-react';
// import { QuestionBankQuickActions } from '../generateQuestions/QuestionBankQuickActions';

interface HeaderProps {
  totalItems: number;
  itemsLength: number;
  loading: boolean;
  onRefresh: () => void;
  onCreateQuestion: () => void;
}

export const Header = ({
  totalItems,
  itemsLength,
  loading,
  onRefresh,
  onCreateQuestion
}: HeaderProps) => {
  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-6 py-6">
        {/* <QuestionBankQuickActions /> */}
        
        <div className="mt-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              Question Management
            </h1>
            <p className="text-gray-600 mt-2 flex items-center gap-4">
              <span>Create, edit, and organize interview questions</span>
              <span className="text-sm text-gray-500">•</span>
              <span className="flex items-center gap-1 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                {totalItems > 0 
                  ? `${totalItems} total questions (showing ${itemsLength})` 
                  : `${itemsLength} questions loaded`
                }
              </span>
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button 
              onClick={onCreateQuestion}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Create Question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
