'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useCallback } from 'react';
import { Brain, Sparkles, CheckCircle2, ChevronLeft, Globe, Languages, Loader2, Bot, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
type Answer = {
  content: string;
  isCorrect: boolean;
};

type Question = {
  id: string;
  question: string;
  answers: Answer[];
  fields: string[];
  topics: string[];
  levels: string[];
  explanation: string;
  createdAt: string;
  updatedAt: string;
};

// PREDEFINED_FIELDS, PREDEFINED_TOPICS, FIELD_TOPICS_MAP lấy từ quizstart
const PREDEFINED_FIELDS = [
  { id: "frontend", name: "Frontend", icon: "🎨", color: "from-blue-500 to-cyan-500" },
  { id: "backend", name: "Backend", icon: "⚙️", color: "from-green-500 to-emerald-500" },
  { id: "devops", name: "DevOps", icon: "🔧", color: "from-orange-500 to-red-500" },
  { id: "ai-engineer", name: "AI Engineer", icon: "🤖", color: "from-purple-500 to-pink-500" },
  { id: "data-analyst", name: "Data Analyst", icon: "📊", color: "from-indigo-500 to-blue-500" },
  { id: "game-developer", name: "Game Developer", icon: "🎮", color: "from-pink-500 to-rose-500" },
  { id: "product-manager", name: "Product Manager", icon: "📋", color: "from-teal-500 to-cyan-500" },
  { id: "qa", name: "QA", icon: "🔍", color: "from-yellow-500 to-orange-500" },
  { id: "mobile-app", name: "Mobile App", icon: "📱", color: "from-violet-500 to-purple-500" },
  { id: "database", name: "Database Admin", icon: "🗄️", color: "from-green-700 to-blue-700" },
  { id: "others", name: "Others", icon: "❓", color: "from-gray-400 to-gray-600" },
];
const PREDEFINED_TOPICS = [
  { id: "sql", name: "SQL", icon: "🗄️" },
  { id: "computer-science", name: "Computer Science", icon: "💻" },
  { id: "react", name: "React", icon: "⚛️" },
  { id: "vue", name: "Vue", icon: "💚" },
  { id: "angular", name: "Angular", icon: "🅰️" },
  { id: "javascript", name: "JavaScript", icon: "🟨" },
  { id: "nodejs", name: "Node.js", icon: "🟢" },
  { id: "typescript", name: "TypeScript", icon: "🔷" },
  { id: "python", name: "Python", icon: "🐍" },
  { id: "system-design", name: "System Design", icon: "🏗️" },
  { id: "api-design", name: "API Design", icon: "🔌" },
  { id: "aspnet-core", name: "ASP.NET Core", icon: "🔵" },
  { id: "java", name: "Java", icon: "☕" },
  { id: "cpp", name: "C++", icon: "⚡" },
  { id: "flutter", name: "Flutter", icon: "🦋" },
  { id: "spring-boot", name: "Spring Boot", icon: "🍃" },
  { id: "go", name: "Go Roadmap", icon: "🐹" },
  { id: "rust", name: "Rust", icon: "🦀" },
  { id: "graphql", name: "GraphQL", icon: "📊" },
  { id: "design-architecture", name: "Design and Architecture", icon: "🏛️" },
  { id: "design-system", name: "Design System", icon: "🎨" },
  { id: "react-native", name: "React Native", icon: "📱" },
  { id: "aws", name: "AWS", icon: "☁️" },
  { id: "code-review", name: "Code Review", icon: "👀" },
  { id: "docker", name: "Docker", icon: "🐳" },
  { id: "kubernetes", name: "Kubernetes", icon: "⚓" },
  { id: "linux", name: "Linux", icon: "🐧" },
  { id: "mongodb", name: "MongoDB", icon: "🍃" },
  { id: "prompt-engineering", name: "Prompt Engineering", icon: "🎯" },
  { id: "terraform", name: "Terraform", icon: "🏗️" },
  { id: "data-structures", name: "Data Structures & Algorithms", icon: "🧮" },
  { id: "git-github", name: "Git and GitHub", icon: "📚" },
  { id: "redis", name: "Redis", icon: "🔴" },
  { id: "php", name: "PHP", icon: "🐘" },
  { id: "cloudflare", name: "Cloudflare", icon: "☁️" },
  { id: "ai-agents", name: "AI Agents", icon: "🤖", isNew: true },
  { id: "ai-red-teaming", name: "AI Red Teaming", icon: "🛡️", isNew: true },
  { id: "backup-recovery", name: "Backup & Recovery", icon: "💾" },
  { id: "others", name: "Others", icon: "❓" },
];
const FIELD_TOPICS_MAP: Record<string, string[]> = {
  frontend: [
    "react", "vue", "angular", "javascript", "typescript", "design-system", "design-architecture"
  ],
  backend: [
    "nodejs", "java", "spring-boot", "python", "go", "rust", "graphql", "api-design", "system-design", "php", "aspnet-core"
  ],
  devops: [
    "docker", "kubernetes", "linux", "terraform", "cloudflare", "aws"
  ],
  "ai-engineer": [
    "python", "prompt-engineering", "ai-agents", "ai-red-teaming"
  ],
  "data-analyst": [
    "sql", "mongodb", "data-structures", "python"
  ],
  "game-developer": [
    "cpp", "system-design"
  ],
  "product-manager": [
    "system-design", "code-review", "design-architecture"
  ],
  qa: [
    "code-review", "api-design", "javascript"
  ],
  "mobile-app": [
    "react-native", "flutter"
  ],
  database: [
    "sql", "mongodb", "redis", "database-design", "performance-tuning", "backup-recovery"
  ],
  others: ["others"],
};
const PREDEFINED_LEVELS = [
  { value: 'junior', label: 'Junior', icon: '🟢', color: 'from-green-400 to-green-600' },
  { value: 'middle', label: 'Middle', icon: '🟡', color: 'from-yellow-400 to-yellow-600' },
  { value: 'senior', label: 'Senior', icon: '🔴', color: 'from-red-400 to-red-600' },
];
const QUESTION_COUNTS = [10, 25, 50, 75];
const LANGUAGES = [
  { value: 'vi', label: 'Tiếng Việt', icon: <Globe className="inline w-4 h-4 mr-1" /> },
  { value: 'en', label: 'English', icon: <Languages className="inline w-4 h-4 mr-1" /> },
];

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

  // AI Generate Modal state
  const [showAIGenerate, setShowAIGenerate] = useState(false);
  // Thêm state cho luồng chọn field/topic/level
  const [aiGenStep, setAIGenStep] = useState(1); // 1: field, 2: topic, 3: level+count+lang, 4: kết quả
  const [aiGenField, setAIGenField] = useState('');
  const [aiGenCustomField, setAIGenCustomField] = useState('');
  const [aiGenTopic, setAIGenTopic] = useState('');
  const [aiGenCustomTopic, setAIGenCustomTopic] = useState('');
  const [aiGenLoading, setAIGenLoading] = useState(false);
  const [aiGenError, setAIGenError] = useState('');
  const [aiGenQuestions, setAIGenQuestions] = useState<Array<{ question: string; answers: Array<{ content: string; isCorrect: boolean }>; explanation: string }>>([]);
  const [aiGenSelected, setAIGenSelected] = useState<number[]>([]);
  const [aiGenParams, setAIGenParams] = useState({
    field: '',
    topic: '',
    level: 'junior',
    count: 5,
    language: 'vi',
  });


  // Thêm state cho showExplain và saved cho từng card AI gen
  const [aiGenShowExplain, setAIGenShowExplain] = useState<boolean[]>([]);
  const [aiGenSaved, setAIGenSaved] = useState<boolean[]>([]);
  // Thêm state cho edit mode từng câu hỏi AI sinh ra
  const [aiGenEdit, setAIGenEdit] = useState<(null | { question: string; answers: Array<{ content: string; isCorrect: boolean }>; explanation: string })[]>([]);

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
        ? `/api/questions/${currentQuestion.id}`
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
          q.id === data.id ? data : q
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

      setQuestions(questions.filter(q => q.id !== id));
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



  // Khi nhận được câu hỏi AI, khởi tạo state edit cho từng câu
  useEffect(() => {
    if (aiGenQuestions.length > 0) {
      setAIGenEdit(aiGenQuestions.map(() => null));
    }
  }, [aiGenQuestions]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">
            {editMode ? 'Edit Question' : 'Add New Question'}
          </h2>
          <button
            type="button"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            onClick={() => setShowAIGenerate(true)}
          >
            Generate Questions with AI
          </button>
        </div>
        {/* Modal AI Generate */}
        {showAIGenerate && (
          <div className="fixed inset-0 z-50 w-screen h-screen bg-white flex flex-col animate-fade-in">
            {/* Header sticky */}
            <div className="flex items-center justify-between px-8 py-4 border-b bg-white sticky top-0 z-20 shadow-sm">
              <div className="flex items-center gap-3">
                <Sparkles className="w-7 h-7 text-indigo-500 animate-bounce" />
                <span className="text-2xl font-bold">AI Question Generator</span>
              </div>
              <button
                className="text-3xl text-gray-400 hover:text-gray-700 font-bold"
                onClick={() => {
                  setShowAIGenerate(false);
                  setAIGenQuestions([]);
                  setAIGenError('');
                  setAIGenStep(1);
                  setAIGenSelected([]);
                }}
                aria-label="Close"
              >×</button>
            </div>
            {/* Nội dung chia 2 cột trên desktop, dọc trên mobile */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Left column: config (luôn hiển thị ở cả bước 1 và 2) */}
              <div className="w-full md:w-1/2 p-8 overflow-y-auto border-r bg-gradient-to-br from-blue-50 to-white">
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Brain className="w-6 h-6 text-indigo-400" /> AI Question Configuration
                </h3>
                <div className="grid grid-cols-1 gap-6">
                  {/* Field select */}
                  <div>
                    <div className="mb-2 font-semibold text-gray-700">Field</div>
                    <div className="grid grid-cols-3 gap-2">
                      {PREDEFINED_FIELDS.map(f => (
                        <button
                          key={f.id}
                          className={`rounded-xl p-3 flex flex-col items-center border-2 transition-all cursor-pointer text-sm font-medium ${aiGenField === f.id ? 'border-indigo-500 bg-gradient-to-r ' + f.color + ' text-white shadow-lg' : 'border-gray-200 bg-white hover:border-indigo-300'}`}
                          onClick={() => {
                            setAIGenField(f.id);
                            setAIGenTopic('');
                            setAIGenCustomField('');
                            setAIGenCustomTopic('');
                          }}
                        >
                          <span className="text-2xl mb-1">{f.icon}</span>
                          {f.name}
                          {aiGenField === f.id && <CheckCircle2 className="w-4 h-4 text-white mt-1" />}
                        </button>
                      ))}
                    </div>
                    {aiGenField === 'others' && (
                      <input
                        className="mt-2 w-full border rounded px-2 py-1"
                        placeholder="Enter custom field..."
                        value={aiGenCustomField}
                        onChange={e => setAIGenCustomField(e.target.value)}
                      />
                    )}
                  </div>
                  {/* Topic select */}
                  <div>
                    <div className="mb-2 font-semibold text-gray-700">Topic</div>
                    {aiGenField && aiGenField !== 'others' && (
                      <div className="grid grid-cols-3 gap-2">
                        {PREDEFINED_TOPICS.filter(t => FIELD_TOPICS_MAP[aiGenField]?.includes(t.id)).map(t => (
                          <button
                            key={t.id}
                            className={`rounded-xl p-3 flex flex-col items-center border-2 transition-all cursor-pointer text-sm font-medium ${aiGenTopic === t.id ? 'border-indigo-500 bg-gradient-to-r from-blue-400 to-cyan-400 text-white shadow-lg' : 'border-gray-200 bg-white hover:border-indigo-300'}`}
                            onClick={() => {
                              setAIGenTopic(t.id);
                              setAIGenCustomTopic('');
                            }}
                          >
                            <span className="text-2xl mb-1">{t.icon}</span>
                            {t.name}
                            {aiGenTopic === t.id && <CheckCircle2 className="w-4 h-4 text-white mt-1" />}
                          </button>
                        ))}
                      </div>
                    )}
                    {(aiGenField === 'others' || aiGenTopic === 'others') && (
                      <input
                        className="mt-2 w-full border rounded px-2 py-1"
                        placeholder="Enter custom topic..."
                        value={aiGenCustomTopic}
                        onChange={e => setAIGenCustomTopic(e.target.value)}
                      />
                    )}
                  </div>
                  {/* Level select */}
                  <div>
                    <div className="mb-2 font-semibold text-gray-700">Level</div>
                    <div className="flex gap-2">
                      {PREDEFINED_LEVELS.map(lvl => (
                        <button
                          key={lvl.value}
                          className={`flex-1 rounded-xl p-3 flex flex-col items-center border-2 transition-all cursor-pointer text-sm font-medium ${aiGenParams.level === lvl.value ? 'border-pink-500 bg-gradient-to-r ' + lvl.color + ' text-white shadow-lg' : 'border-gray-200 bg-white hover:border-pink-300'}`}
                          onClick={() => setAIGenParams(p => ({...p, level: lvl.value}))}
                        >
                          <span className="text-xl mb-1">{lvl.icon}</span>
                          {lvl.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Count + Language */}
                  <div className="flex flex-col gap-4">
                    <div>
                      <div className="mb-2 font-semibold text-gray-700">Number of questions</div>
                      <div className="flex gap-2">
                        {QUESTION_COUNTS.map(cnt => (
                          <button
                            key={cnt}
                            className={`flex-1 rounded-xl p-2 border-2 transition-all font-semibold ${aiGenParams.count === cnt ? 'border-orange-500 bg-gradient-to-r from-orange-400 to-red-400 text-white shadow-lg' : 'border-gray-200 bg-white hover:border-orange-300'}`}
                            onClick={() => setAIGenParams(p => ({...p, count: cnt}))}
                          >{cnt}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 font-semibold text-gray-700">Language</div>
                      <div className="flex gap-2">
                        {LANGUAGES.map(lang => (
                          <button
                            key={lang.value}
                            className={`flex-1 rounded-xl p-2 border-2 transition-all font-semibold flex items-center justify-center gap-1 ${aiGenParams.language === lang.value ? 'border-blue-500 bg-gradient-to-r from-blue-400 to-cyan-400 text-white shadow-lg' : 'border-gray-200 bg-white hover:border-blue-300'}`}
                            onClick={() => setAIGenParams(p => ({...p, language: lang.value}))}
                          >{lang.icon}{lang.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between mt-8">
                    <Button variant="outline" onClick={() => setShowAIGenerate(false)}>
                      <ChevronLeft className="w-4 h-4 mr-1" /> Close
                    </Button>
                    <Button
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold"
                      onClick={async () => {
                        setAIGenLoading(true);
                        setAIGenError('');
                        setAIGenQuestions([]);
                        setAIGenStep(2);
                        try {
                          const field = aiGenField === 'others' ? aiGenCustomField : PREDEFINED_FIELDS.find(f => f.id === aiGenField)?.name || '';
                          const topic = aiGenTopic === 'others' ? aiGenCustomTopic : PREDEFINED_TOPICS.find(t => t.id === aiGenTopic)?.name || '';
                          const res = await fetch('/api/questions/generate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              ...aiGenParams,
                              field,
                              topic,
                            }),
                          });
                          if (!res.ok) throw new Error('Failed to call AI');
                          const data = await res.json();
                          setAIGenQuestions(data.data || []);
                          setAIGenSelected([]);
                          if (!data.data || data.data.length === 0) setAIGenError('No questions returned by AI.');
                        } catch {
                          setAIGenError('Failed to call AI.');
                        } finally {
                          setAIGenLoading(false);
                        }
                      }}
                      disabled={aiGenLoading || (!aiGenField && !aiGenCustomField) || (!aiGenTopic && !aiGenCustomTopic)}
                    >
                      {aiGenLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 mr-1" />} Generate questions
                    </Button>
                  </div>
                </div>
              </div>
              {/* Right column: result */}
              <div className="w-full md:w-1/2 p-8 overflow-y-auto bg-white flex flex-col">
                {aiGenStep === 1 && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Bot className="w-32 h-32 mb-4 opacity-30" />
                    <div className="text-lg font-semibold">Select configuration and click &quot;Generate questions&quot; to let AI create questions!</div>
                  </div>
                )}
                {aiGenStep === 2 && (
                  <>
                    <Button variant="outline" size="sm" className="mb-4 w-max" onClick={() => setAIGenStep(1)}>
                      <ChevronLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                    {/* Select All/Cancel All button */}
                    {aiGenQuestions.length > 0 && (
                      <div className="flex justify-end mb-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (aiGenSelected.length === aiGenQuestions.length) {
                              setAIGenSelected([]);
                            } else {
                              setAIGenSelected(aiGenQuestions.map((_, idx) => idx));
                            }
                          }}
                        >
                          {aiGenSelected.length === aiGenQuestions.length ? 'Cancel All' : 'Select All'}
                        </Button>
                      </div>
                    )}
                    {aiGenLoading ? (
                      <div className="flex flex-col items-center justify-center h-40">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-2" />
                        <div className="text-gray-500">Generating questions...</div>
                      </div>
                    ) : aiGenError ? (
                      <div className="text-red-600 text-center">{aiGenError}</div>
                    ) : (
                      <>
                        {aiGenQuestions.length === 0 ? (
                          <div className="text-gray-500 text-center">No questions generated.</div>
                        ) : (
                          <>
                            <div className="flex justify-end mb-2">
                              <Button
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold"
                                disabled={aiGenSelected.length === 0 || aiGenLoading}
                                onClick={async () => {
                                  for (const idx of aiGenSelected) {
                                    const q = aiGenEdit[idx] ? { ...aiGenQuestions[idx], ...aiGenEdit[idx] } : aiGenQuestions[idx];
                                    try {
                                      const res = await fetch('/api/questions', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(q),
                                      });
                                      if (!res.ok) throw new Error('Error saving');
                                      const saved = await res.json();
                                      setQuestions(prev => [saved, ...prev]);
                                    } catch {
                                      toast.error('Error saving question!');
                                    }
                                  }
                                  toast.success('Saved selected questions!');
                                  setShowAIGenerate(false);
                                  setAIGenStep(1);
                                  setAIGenQuestions([]);
                                  setAIGenSelected([]);
                                  setAIGenShowExplain([]);
                                  setAIGenSaved([]);
                                  setAIGenEdit([]);
                                }}
                              >Save Selected</Button>
                            </div>
                            <div className="grid grid-cols-1 gap-6 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                              {aiGenQuestions.map((q, idx) => {
                                const isEdit = aiGenEdit[idx] !== null;
                                const editData = aiGenEdit[idx] || { question: q.question, answers: q.answers, explanation: q.explanation };
                                return (
                                <Card
                                  key={idx}
                                    className={`relative border-2 p-6 rounded-2xl shadow-lg transition-all group ${aiGenSelected.includes(idx) ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:border-indigo-300'} ${aiGenSaved[idx] ? 'opacity-60' : ''} ${isEdit ? 'ring-2 ring-indigo-400' : ''}`}
                                  onClick={() => setAIGenSelected(sel => sel.includes(idx) ? sel.filter(i => i !== idx) : [...sel, idx])}
                                >
                                  {/* Checkbox chọn */}
                                  <div className="absolute top-4 right-4 z-10">
                                    <input
                                      type="checkbox"
                                      checked={aiGenSelected.includes(idx)}
                                      onChange={e => {
                                        e.stopPropagation();
                                        setAIGenSelected(sel => sel.includes(idx) ? sel.filter(i => i !== idx) : [...sel, idx]);
                                      }}
                                      className="w-6 h-6 accent-green-500 rounded-lg border-2 border-green-400 shadow"
                                    />
                                  </div>
                                    {/* Edit/Save button */}
                                    <div className="absolute top-4 left-4 z-10">
                                      {isEdit ? (
                                        <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); setAIGenEdit(edits => { const arr = [...edits]; arr[idx] = null; return arr; }); }}>Cancel</Button>
                                      ) : (
                                        <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); setAIGenEdit(edits => { const arr = [...edits]; arr[idx] = { question: q.question, answers: q.answers, explanation: q.explanation }; return arr; }); }}>Edit</Button>
                                      )}
                                  </div>
                                  {/* Số thứ tự + icon AI */}
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg font-bold text-indigo-600">{idx + 1}.</span>
                                    <Bot className="w-5 h-5 text-indigo-400" />
                                  </div>
                                    {/* Câu hỏi (edit hoặc view) */}
                                    {isEdit ? (
                                      <input
                                        className="w-full font-semibold text-lg mb-3 text-gray-900 border-b border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                        value={editData.question}
                                        onChange={e => setAIGenEdit(edits => { const arr = [...edits]; arr[idx] = { ...editData, question: e.target.value }; return arr; })}
                                      />
                                    ) : (
                                  <div className="font-semibold text-lg mb-3 text-gray-900">{q.question}</div>
                                    )}
                                    {/* Đáp án (edit hoặc view) */}
                                  <ul className="space-y-2 mb-2">
                                      {(isEdit ? editData.answers : q.answers).map((a: { content: string; isCorrect: boolean }, i: number) => (
                                        <li key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${a.isCorrect ? 'bg-green-100 text-green-700 font-semibold' : 'bg-white text-gray-800'} text-base`}>
                                          {isEdit ? (
                                            <>
                                              <input
                                                type="text"
                                                className="w-full border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 mr-2"
                                                value={a.content}
                                                onChange={e => setAIGenEdit(edits => {
                                                  const arr = [...edits];
                                                  const newAnswers = [...editData.answers];
                                                  newAnswers[i] = { ...newAnswers[i], content: e.target.value };
                                                  arr[idx] = { ...editData, answers: newAnswers };
                                                  return arr;
                                                })}
                                              />
                                              <input
                                                type="checkbox"
                                                checked={a.isCorrect}
                                                onChange={() => setAIGenEdit(edits => {
                                                  const arr = [...edits];
                                                  const newAnswers = [...editData.answers];
                                                  newAnswers[i] = { ...newAnswers[i], isCorrect: !a.isCorrect };
                                                  arr[idx] = { ...editData, answers: newAnswers };
                                                  return arr;
                                                })}
                                                className="ml-2 accent-green-500"
                                              />
                                            </>
                                          ) : (
                                            <>
                                        {a.isCorrect ? <Check className="w-4 h-4 text-green-500" /> : <span className="w-4 h-4 inline-block" />}
                                        {a.content}
                                            </>
                                          )}
                                      </li>
                                    ))}
                                  </ul>
                                    {/* Giải thích (edit hoặc view) */}
                                    {isEdit ? (
                                      <textarea
                                        className="w-full border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-xs text-gray-700"
                                        value={editData.explanation}
                                        onChange={e => setAIGenEdit(edits => { const arr = [...edits]; arr[idx] = { ...editData, explanation: e.target.value }; return arr; })}
                                        rows={2}
                                      />
                                    ) : (
                                      q.explanation && (
                                    <div className="mt-2">
                                      <button
                                        type="button"
                                        className="text-xs text-indigo-600 flex items-center gap-1 hover:underline"
                                        onClick={e => {
                                          e.stopPropagation();
                                              setAIGenShowExplain(prev => { const arr = [...prev]; arr[idx] = !arr[idx]; return arr; });
                                        }}
                                      >
                                        {aiGenShowExplain[idx] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />} View explanation
                                      </button>
                                      {aiGenShowExplain[idx] && (
                                        <div className="italic text-xs text-gray-500 mt-1 bg-gray-50 rounded p-2 border border-gray-100">
                                          {q.explanation}
                                        </div>
                                      )}
                                    </div>
                                      )
                                    )}
                                </Card>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        {/* End Modal AI Generate */}
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
                    <tr key={q.id}>
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
                          onClick={() => handleDelete(q.id)}
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