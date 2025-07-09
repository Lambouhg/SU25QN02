'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useCallback } from 'react';
type Answer = {
  content: string;
  isCorrect: boolean;
};

type Question = {
  _id: string;
  question: string;
  answers: Answer[];
  fields: string[];
  topics: string[];
  levels: string[];
  explanation: string;
  createdAt: string;
  updatedAt: string;
};

export default function QuestionManager() {
  // const { userId } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [fields, setFields] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    fields: [] as string[],
    topics: [] as string[],
    levels: [] as string[],
    answers: [{ content: '', isCorrect: false }],
    explanation: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  });
  const [searchParams, setSearchParams] = useState({
    field: '',
    topic: '',
    level: '',
    search: ''
  });

  // Field combobox state
  const [isFieldOpen, setIsFieldOpen] = useState(false);
  const [fieldInputValue, setFieldInputValue] = useState('');
  const fieldDropdownRef = useRef<HTMLDivElement>(null);

  // Topic combobox state
  const [isTopicOpen, setIsTopicOpen] = useState(false);
  const [topicInputValue, setTopicInputValue] = useState('');
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
    if (!formData.fields.includes(field)) {
      setFormData(prev => ({ ...prev, fields: [...prev.fields, field] }));
    }
    setFieldInputValue('');
    setIsFieldOpen(false);
  };

  const removeField = (fieldToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field !== fieldToRemove)
    }));
  };

  const handleTopicSelect = (topic: string) => {
    if (!formData.topics.includes(topic)) {
      setFormData(prev => ({ ...prev, topics: [...prev.topics, topic] }));
    }
    setTopicInputValue('');
    setIsTopicOpen(false);
  };

  const removeTopic = (topicToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.filter(topic => topic !== topicToRemove)
    }));
  };

  const toggleLevel = (level: string) => {
    setFormData(prev => ({
      ...prev,
      levels: prev.levels.includes(level)
        ? prev.levels.filter(l => l !== level)
        : [...prev.levels, level]
    }));
  };


  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchParams.field && { field: searchParams.field }),
        ...(searchParams.topic && { topic: searchParams.topic }),
        ...(searchParams.level && { level: searchParams.level }),
        ...(searchParams.search && { search: searchParams.search })
      });

      const res = await fetch(`/api/questions?${params.toString()}`);
      const data = await res.json();
      
      setQuestions(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchParams]);

  useEffect(() => {
    fetchQuestions();
    fetchFields();
    fetchTopics();
  }, [fetchQuestions]);

  const fetchFields = async () => {
    try {
      const res = await fetch('/api/questions/fields');
      const data = await res.json();
      setFields(data);
    } catch (error) {
      console.error('Error fetching fields:', error);
    }
  };

  const fetchTopics = async () => {
    try {
      const res = await fetch('/api/questions/topics');
      const data = await res.json();
      setTopics(data);
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate at least one correct answer
    const hasCorrectAnswer = formData.answers.some(answer => answer.isCorrect);
    if (!hasCorrectAnswer) {
      toast.error('Please mark at least one answer as correct');
      return;
    }

    try {
      const url = editMode && currentQuestion 
        ? `/api/questions/${currentQuestion._id}`
        : '/api/questions';
      
      const method = editMode ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error(res.statusText);
      }

      const data = await res.json();
      
      if (editMode) {
        setQuestions(questions.map(q => 
          q._id === data._id ? data : q
        ));
        toast.success('Question updated successfully');
      } else {
        setQuestions([data, ...questions]);
        toast.success('Question created successfully');
      }

      resetForm();
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error('Failed to save question');
    }
  };

  const handleEdit = (question: Question) => {
    setCurrentQuestion(question);
    setEditMode(true);
    setFormData({
      question: question.question,
      fields: question.fields,
      topics: question.topics,
      levels: question.levels,
      answers: question.answers,
      explanation: question.explanation || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    
    try {
      const res = await fetch(`/api/questions/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        throw new Error(res.statusText);
      }

      setQuestions(questions.filter(q => q._id !== id));
      toast.success('Question deleted successfully');
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    }
  };

  const addAnswer = () => {
    setFormData({
      ...formData,
      answers: [...formData.answers, { content: '', isCorrect: false }]
    });
  };

  const removeAnswer = (index: number) => {
    const newAnswers = formData.answers.filter((_, i) => i !== index);
    setFormData({ ...formData, answers: newAnswers });
  };

  const updateAnswer = (index: number, field: keyof Answer, value: string | boolean) => {
    const newAnswers = [...formData.answers];
    newAnswers[index][field] = value as never;
    setFormData({ ...formData, answers: newAnswers });
  };

  const resetForm = () => {
    setFormData({
      question: '',
      fields: [],
      topics: [],
      levels: [],
      answers: [{ content: '', isCorrect: false }],
      explanation: ''
    });
    setEditMode(false);
    setCurrentQuestion(null);
  };

  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, page });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">
          {editMode ? 'Edit Question' : 'Add New Question'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Top Section: Fields, Topics, Levels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fields
            </label>
            <div className="relative" ref={fieldDropdownRef}>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.fields.map((field) => (
                  <span
                    key={field}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {field}
                    <button
                      type="button"
                      onClick={() => removeField(field)}
                        className="ml-1 inline-flex items-center justify-center h-4 w-4 rounded-full hover:bg-blue-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex">
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Add a field..."
                  value={fieldInputValue}
                  onChange={(e) => {
                    setFieldInputValue(e.target.value);
                    setIsFieldOpen(true);
                  }}
                  onFocus={() => setIsFieldOpen(true)}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (fieldInputValue && !formData.fields.includes(fieldInputValue)) {
                      setFormData(prev => ({
                        ...prev,
                        fields: [...prev.fields, fieldInputValue]
                      }));
                      setFieldInputValue('');
                    }
                  }}
                    className="ml-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add
                </button>
              </div>
              {isFieldOpen && filteredFields.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                  {filteredFields.map((field) => (
                    <div
                      key={field}
                        className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-100"
                      onClick={() => handleFieldSelect(field)}
                    >
                      {field}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Topics
            </label>
            <div className="relative" ref={topicDropdownRef}>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.topics.map((topic) => (
                  <span
                    key={topic}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                  >
                    {topic}
                    <button
                      type="button"
                      onClick={() => removeTopic(topic)}
                      className="ml-1 inline-flex items-center justify-center h-4 w-4 rounded-full hover:bg-indigo-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex">
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Add a topic..."
                  value={topicInputValue}
                  onChange={(e) => {
                    setTopicInputValue(e.target.value);
                    setIsTopicOpen(true);
                  }}
                  onFocus={() => setIsTopicOpen(true)}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (topicInputValue && !formData.topics.includes(topicInputValue)) {
                      setFormData(prev => ({
                        ...prev,
                        topics: [...prev.topics, topicInputValue]
                      }));
                      setTopicInputValue('');
                    }
                  }}
                  className="ml-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add
                </button>
              </div>
              {isTopicOpen && filteredTopics.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                  {filteredTopics.map((topic) => (
                    <div
                      key={topic}
                      className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-100"
                      onClick={() => handleTopicSelect(topic)}
                    >
                      {topic}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Levels
            </label>
            <div className="space-y-2">
              {['junior', 'middle', 'senior'].map((level) => (
                <div key={level} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`level-${level}`}
                    checked={formData.levels.includes(level)}
                    onChange={() => toggleLevel(level)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor={`level-${level}`}
                    className="ml-2 block text-sm text-gray-900 capitalize"
                  >
                    {level}
                  </label>
                </div>
              ))}
              </div>
            </div>
          </div>

          {/* Bottom Section: Question Content */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                required
                rows={4}
                placeholder="Enter your question here..."
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                Answers *
              </label>
              <div className="space-y-2">
                {formData.answers.map((answer, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        value={answer.content}
                        onChange={(e) => updateAnswer(index, 'content', e.target.value)}
                        required
                        placeholder={`Answer ${index + 1}`}
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={answer.isCorrect}
                        onChange={() => {
                          const newAnswers = formData.answers.map((a, i) => ({
                            ...a,
                            isCorrect: i === index ? !a.isCorrect : a.isCorrect
                          }));
                          setFormData({ ...formData, answers: newAnswers });
                        }}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    </div>
                    {formData.answers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAnswer(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addAnswer}
                className="mt-2 inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Answer
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Explanation (Optional)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.explanation}
                onChange={(e) => setFormData({...formData, explanation: e.target.value})}
                rows={3}
                  placeholder="Provide an explanation for the correct answer..."
              />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            {editMode && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {editMode ? 'Update Question' : 'Save Question'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Question List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Question Bank</h2>
          
          {/* Search and Filters */}
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Search questions..."
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={searchParams.search}
              onChange={(e) => setSearchParams({...searchParams, search: e.target.value})}
            />
            <select
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={searchParams.field}
              onChange={(e) => setSearchParams({...searchParams, field: e.target.value})}
            >
              <option value="">All Fields</option>
              {fields.map((field) => (
                <option key={field} value={field}>{field}</option>
              ))}
            </select>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={searchParams.topic}
              onChange={(e) => setSearchParams({...searchParams, topic: e.target.value})}
            >
              <option value="">All Topics</option>
              {topics.map((topic) => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={searchParams.level}
              onChange={(e) => setSearchParams({...searchParams, level: e.target.value})}
            >
              <option value="">All Levels</option>
              <option value="junior">Junior</option>
              <option value="middle">Middle</option>
              <option value="senior">Senior</option>
            </select>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No questions found. Create your first question!
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Question
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fields
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Topics
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Levels
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Answers
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {questions.map((q) => (
                    <tr key={q._id}>
                      <td className="px-6 py-4 whitespace-pre-wrap">
                        {q.question}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {q.fields.map((field) => (
                            <span
                              key={field}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {field}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {q.topics.map((topic) => (
                            <span
                              key={topic}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {q.levels.map((level) => (
                            <span
                              key={level}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 capitalize"
                            >
                              {level}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <ul className="list-disc list-inside">
                          {q.answers.map((a, i) => (
                            <li
                              key={i}
                              className={`${a.isCorrect ? 'text-green-600' : ''}`}
                            >
                              {a.content}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(q)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(q._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex justify-between items-center">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total}</span> questions
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={`px-3 py-1 border rounded-md ${
                      pagination.page === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 border rounded-md ${
                          pagination.page === pageNum
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className={`px-3 py-1 border rounded-md ${
                      pagination.page === pagination.totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}