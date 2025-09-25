'use client';

import { Edit2, Trash2 } from 'lucide-react';

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

interface QuestionTableProps {
  questions: QuestionItem[];
  onEdit: (question: QuestionItem) => void;
  onDelete: (id: string) => void;
}

export const QuestionTable = ({ questions, onEdit, onDelete }: QuestionTableProps) => {
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

  const getDifficultyColor = (diff: string | null | undefined) => {
    switch (diff) {
      case 'easy': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';  
      case 'hard': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Question
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Level
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Difficulty
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Topics/Fields/Skills
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Options
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {questions.map((question) => (
              <tr key={question.id} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <div className="max-w-xs">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">
                      {question.stem}
                    </p>
                    {question.explanation && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {question.explanation}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {getTypeLabel(question.type)}
                  </span>
                </td>
                <td className="px-4 py-4">
                  {question.level ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {question.level}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  {question.difficulty ? (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                      {question.difficulty}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="max-w-40">
                    <div className="space-y-1">
                      {question.topics && question.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs text-gray-500">Topics:</span>
                          {question.topics.slice(0, 2).map((topic, idx) => (
                            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              {topic}
                            </span>
                          ))}
                          {question.topics.length > 2 && (
                            <span className="text-xs text-gray-500">+{question.topics.length - 2}</span>
                          )}
                        </div>
                      )}
                      
                      {question.fields && question.fields.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs text-gray-500">Fields:</span>
                          {question.fields.slice(0, 2).map((field, idx) => (
                            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              {field}
                            </span>
                          ))}
                          {question.fields.length > 2 && (
                            <span className="text-xs text-gray-500">+{question.fields.length - 2}</span>
                          )}
                        </div>
                      )}

                      {question.skills && question.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs text-gray-500">Skills:</span>
                          {question.skills.slice(0, 2).map((skill, idx) => (
                            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              {skill}
                            </span>
                          ))}
                          {question.skills.length > 2 && (
                            <span className="text-xs text-gray-500">+{question.skills.length - 2}</span>
                          )}
                        </div>
                      )}

                      {!question.topics?.length && !question.fields?.length && !question.skills?.length && (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  {question.category ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {question.category}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-gray-900">
                    {question.options && question.options.length > 0 ? (
                      <div>
                        <span className="font-medium">{question.options.length}</span>
                        <span className="text-gray-500 ml-1">options</span>
                        <div className="text-xs text-green-600 mt-1">
                          {question.options.filter(o => o.isCorrect).length} correct
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">No options</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(question)}
                      className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(question.id)}
                      className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
