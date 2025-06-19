import { QuizConfig } from './QuizPanel';
import { useState, useRef, useEffect } from 'react';

interface QuizStartProps {
  config: QuizConfig;
  fields: string[];
  topics: string[];
  onChange: (config: QuizConfig) => void;
  onStart: () => void;
  isLoading: boolean;
  error: string | null;
}

export default function QuizStart({
  config,
  fields,
  topics,
  onChange,
  onStart,
  isLoading,
  error,
}: QuizStartProps) {
  const [isFieldOpen, setIsFieldOpen] = useState(false);
  const [isTopicOpen, setIsTopicOpen] = useState(false);
  const [fieldInputValue, setFieldInputValue] = useState(config.field);
  const [topicInputValue, setTopicInputValue] = useState(config.topic);
  const fieldDropdownRef = useRef<HTMLDivElement>(null);
  const topicDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fieldDropdownRef.current && !fieldDropdownRef.current.contains(event.target as Node)) {
        setIsFieldOpen(false);
      }
      if (topicDropdownRef.current && !topicDropdownRef.current.contains(event.target as Node)) {
        setIsTopicOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredFields = fields.filter(field =>
    field.toLowerCase().includes(fieldInputValue.toLowerCase())
  );

  const filteredTopics = topics.filter(topic =>
    topic.toLowerCase().includes(topicInputValue.toLowerCase())
  );

  const handleFieldSelect = (field: string) => {
    setFieldInputValue(field);
    onChange({ ...config, field });
    setIsFieldOpen(false);
  };

  const handleTopicSelect = (topic: string) => {
    setTopicInputValue(topic);
    onChange({ ...config, topic });
    setIsTopicOpen(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-4">Quiz Configuration</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="relative" ref={fieldDropdownRef}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Field
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={fieldInputValue}
            onChange={(e) => {
              setFieldInputValue(e.target.value);
              onChange({ ...config, field: e.target.value });
              setIsFieldOpen(true);
            }}
            onFocus={() => setIsFieldOpen(true)}
            placeholder="Type or select a field"
          />
          {isFieldOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredFields.length > 0 ? (
                filteredFields.map((field) => (
                  <div
                    key={field}
                    className="px-4 py-2 hover:bg-indigo-50 cursor-pointer"
                    onClick={() => handleFieldSelect(field)}
                  >
                    {field}
                  </div>
                ))
              ) : (
                <div className="px-4 py-2 text-gray-500">No fields found</div>
              )}
            </div>
          )}
        </div>

        <div className="relative" ref={topicDropdownRef}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Topic
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={topicInputValue}
            onChange={(e) => {
              setTopicInputValue(e.target.value);
              onChange({ ...config, topic: e.target.value });
              setIsTopicOpen(true);
            }}
            onFocus={() => setIsTopicOpen(true)}
            placeholder="Type or select a topic"
          />
          {isTopicOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredTopics.length > 0 ? (
                filteredTopics.map((topic) => (
                  <div
                    key={topic}
                    className="px-4 py-2 hover:bg-indigo-50 cursor-pointer"
                    onClick={() => handleTopicSelect(topic)}
                  >
                    {topic}
                  </div>
                ))
              ) : (
                <div className="px-4 py-2 text-gray-500">No topics found</div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Experience Level
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={config.level}
            onChange={(e) => onChange({ ...config, level: e.target.value })}
          >
            <option value="intern">Intern</option>
            <option value="fresher">Fresher</option>
            <option value="middle">Middle</option>
            <option value="junior">Junior</option>
            <option value="senior">Senior</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of Questions (1-50)
          </label>
          <input
            type="number"
            min="1"
            max="50"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={config.questionCount}
            onChange={(e) =>
              onChange({
                ...config,
                questionCount: Math.min(50, Math.max(1, parseInt(e.target.value) || 10)),
              })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time Limit (minutes, 1-120)
          </label>
          <input
            type="number"
            min="1"
            max="120"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={config.timeLimit}
            onChange={(e) =>
              onChange({
                ...config,
                timeLimit: Math.min(120, Math.max(1, parseInt(e.target.value) || 15)),
              })
            }
          />
        </div>

        <div className="pt-4">
          <button
            onClick={onStart}
            disabled={isLoading || !config.field || !config.topic}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              isLoading || !config.field || !config.topic ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Starting Quiz...' : 'Start Quiz'}
          </button>
        </div>
      </div>
    </div>
  );
}