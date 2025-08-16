'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useCallback } from 'react';
import { Brain, Sparkles, CheckCircle2, ChevronLeft, Loader2, Bot, Check, ChevronDown, ChevronUp } from 'lucide-react';
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
};
const PREDEFINED_LEVELS = [
  { value: 'junior', label: 'Junior', icon: '🟢', color: 'from-green-400 to-green-600' },
  { value: 'middle', label: 'Middle', icon: '🟡', color: 'from-yellow-400 to-yellow-600' },
  { value: 'senior', label: 'Senior', icon: '🔴', color: 'from-red-400 to-red-600' },
];
const QUESTION_COUNTS = [10, 25, 50, 75];

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

  // AI Generate Modal state
  const [showAIGenerate, setShowAIGenerate] = useState(false);
  // Thêm state cho luồng chọn field/topic/level
  const [aiGenStep, setAIGenStep] = useState(1); // 1: field, 2: topic, 3: level+count+lang, 4: kết quả
  const [aiGenField, setAIGenField] = useState('');
  const [aiGenTopic, setAIGenTopic] = useState('');
  const [aiGenLoading, setAIGenLoading] = useState(false);
  const [aiGenError, setAIGenError] = useState('');
  const [aiGenQuestions, setAIGenQuestions] = useState<Array<{ question: string; answers: Array<{ content: string; isCorrect: boolean }>; explanation: string }>>([]);
  const [aiGenSelected, setAIGenSelected] = useState<number[]>([]);
  const [aiGenParams, setAIGenParams] = useState({
    field: '',
    topic: '',
    level: 'junior',
    count: 5,
    language: 'en',
  });


  // Thêm state cho showExplain và saved cho từng card AI gen
  const [aiGenShowExplain, setAIGenShowExplain] = useState<boolean[]>([]);
  const [aiGenSaved, setAIGenSaved] = useState<boolean[]>([]);
  // Thêm state cho edit mode từng câu hỏi AI sinh ra
  const [aiGenEdit, setAIGenEdit] = useState<(null | { question: string; answers: Array<{ content: string; isCorrect: boolean }>; explanation: string })[]>([]);
  
  // Duplicate detection states
  const [duplicateCheck, setDuplicateCheck] = useState<{
    checking: boolean;
    results: Array<{
      questionIndex: number;
      isDuplicate: boolean;
      similarQuestions: Array<{
        id: string;
        question: string;
        similarity: number;
      }>;
    }>;
  }>({ checking: false, results: [] });
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [validationResults, setValidationResults] = useState<{
    duplicates: number[];
    warnings: number[];
    canSave: boolean;
  }>({ duplicates: [], warnings: [], canSave: true });

  // Advanced similarity calculation for better duplicate detection
  const calculateSimilarity = (str1: string, str2: string): number => {
    const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
    const text1 = normalize(str1);
    const text2 = normalize(str2);
    
    if (text1 === text2) return 1;
    
    // Exact substring check for high similarity
    if (text1.includes(text2) || text2.includes(text1)) {
      const shorter = text1.length < text2.length ? text1 : text2;
      const longer = text1.length >= text2.length ? text1 : text2;
      return shorter.length / longer.length;
    }
    
    // Word-based similarity with higher precision
    const words1 = text1.split(' ').filter(w => w.length > 2); // Filter out short words
    const words2 = text2.split(' ').filter(w => w.length > 2);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    const allWords = Array.from(new Set([...words1, ...words2]));
    let matches = 0;
    let weightedMatches = 0;
    
    for (const word of allWords) {
      if (words1.includes(word) && words2.includes(word)) {
        matches++;
        // Give more weight to longer words
        weightedMatches += Math.max(1, word.length / 4);
      }
    }
    
    // Combined score considering both word matches and weighted importance
    const wordSimilarity = matches / allWords.length;
    const weightedSimilarity = weightedMatches / (allWords.length * 2);
    
    return Math.max(wordSimilarity, weightedSimilarity);
  };

  const checkForDuplicates = async (questionTexts: string[]) => {
    setDuplicateCheck(prev => ({ ...prev, checking: true }));
    
    try {
      console.log('Checking duplicates for questions:', questionTexts);
      // Check against existing questions in database
      const res = await fetch('/api/questions/check-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          questions: questionTexts,
          field: aiGenField,
          topic: aiGenTopic 
        })
      });
      
      if (!res.ok) {
        console.error('API call failed, falling back to local check');
        // Fallback to local similarity check if API fails
        return checkLocalSimilarity(questionTexts);
      }
      
      const data = await res.json();
      console.log('Duplicate check results:', data.results);
      setDuplicateCheck(prev => ({ ...prev, checking: false, results: data.results }));
      return data.results;
    } catch (error) {
      console.error('Error checking duplicates:', error);
      return checkLocalSimilarity(questionTexts);
    }
  };

  const checkLocalSimilarity = (questionTexts: string[]) => {
    const results = questionTexts.map((questionText, index) => {
      const similarQuestions = questions.filter(q => {
        const similarity = calculateSimilarity(questionText, q.question);
        return similarity > 0.5; // Lower threshold for better detection
      }).map(q => ({
        id: q.id,
        question: q.question,
        similarity: calculateSimilarity(questionText, q.question)
      }));

      return {
        questionIndex: index,
        isDuplicate: similarQuestions.length > 0,
        similarQuestions
      };
    });

    setDuplicateCheck({ checking: false, results });
    return results;
  };

  const validateQuestions = async () => {
    if (aiGenQuestions.length === 0) return;
    
    const questionTexts = aiGenQuestions.map(q => q.question);
    const duplicateResults = await checkForDuplicates(questionTexts);
    
    const duplicates: number[] = [];
    const warnings: number[] = [];
    
    duplicateResults.forEach((result: {
      questionIndex: number;
      isDuplicate: boolean;
      similarQuestions: Array<{
        id: string;
        question: string;
        similarity: number;
      }>;
    }) => {
      if (result.isDuplicate) {
        const highSimilarity = result.similarQuestions.some((sq: { similarity: number }) => sq.similarity > 0.9);
        if (highSimilarity) {
          duplicates.push(result.questionIndex);
        } else {
          warnings.push(result.questionIndex);
        }
      }
    });
    
    setValidationResults({
      duplicates,
      warnings,
      canSave: duplicates.length === 0
    });
    
    if (duplicates.length > 0 || warnings.length > 0) {
      setShowDuplicateModal(true);
    }
  };

  const saveSelectedQuestions = async () => {
    for (const idx of aiGenSelected) {
      const q = aiGenEdit[idx] ? { ...aiGenQuestions[idx], ...aiGenEdit[idx] } : aiGenQuestions[idx];
      try {
        const res = await fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...q,
            fields: [PREDEFINED_FIELDS.find(f => f.id === aiGenField)?.name || aiGenField],
            topics: [PREDEFINED_TOPICS.find(t => t.id === aiGenTopic)?.name || aiGenTopic],
            levels: [aiGenParams.level]
          }),
        });
        if (!res.ok) throw new Error('Error saving');
        const saved = await res.json();
        setQuestions(prev => [saved, ...prev]);
      } catch (error) {
        console.error('Save error:', error);
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
    setValidationResults({ duplicates: [], warnings: [], canSave: true });
    setDuplicateCheck({ checking: false, results: [] });
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
                          }}
                        >
                          <span className="text-2xl mb-1">{f.icon}</span>
                          {f.name}
                          {aiGenField === f.id && <CheckCircle2 className="w-4 h-4 text-white mt-1" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Topic select */}
                  <div>
                    <div className="mb-2 font-semibold text-gray-700">Topic</div>
                    {aiGenField && (
                      <div className="grid grid-cols-3 gap-2">
                        {PREDEFINED_TOPICS.filter(t => FIELD_TOPICS_MAP[aiGenField]?.includes(t.id)).map(t => (
                          <button
                            key={t.id}
                            className={`rounded-xl p-3 flex flex-col items-center border-2 transition-all cursor-pointer text-sm font-medium ${aiGenTopic === t.id ? 'border-indigo-500 bg-gradient-to-r from-blue-400 to-cyan-400 text-white shadow-lg' : 'border-gray-200 bg-white hover:border-indigo-300'}`}
                            onClick={() => {
                              setAIGenTopic(t.id);
                            }}
                          >
                            <span className="text-2xl mb-1">{t.icon}</span>
                            {t.name}
                            {aiGenTopic === t.id && <CheckCircle2 className="w-4 h-4 text-white mt-1" />}
                          </button>
                        ))}
                      </div>
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
                          const field = PREDEFINED_FIELDS.find(f => f.id === aiGenField)?.name || '';
                          const topic = PREDEFINED_TOPICS.find(t => t.id === aiGenTopic)?.name || '';
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
                          if (!data.data || data.data.length === 0) {
                            setAIGenError('No questions returned by AI.');
                          } else {
                            // Auto-validate questions for duplicates
                            setTimeout(async () => {
                              await validateQuestions();
                            }, 500);
                          }
                        } catch {
                          setAIGenError('Failed to call AI.');
                        } finally {
                          setAIGenLoading(false);
                        }
                      }}
                      disabled={aiGenLoading || !aiGenField || !aiGenTopic}
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
                      <div className="flex justify-between mb-4">
                        <Button
                          variant="outline"
                          onClick={validateQuestions}
                          disabled={duplicateCheck.checking}
                          className="flex items-center gap-2"
                        >
                          {duplicateCheck.checking ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <span>🔍</span>
                          )}
                          {duplicateCheck.checking ? 'Checking...' : 'Check for Duplicates'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (aiGenSelected.length === aiGenQuestions.length) {
                              setAIGenSelected([]);
                            } else {
                              setAIGenSelected(aiGenQuestions.map((_, idx) => idx).filter(idx => !validationResults.duplicates.includes(idx)));
                            }
                          }}
                        >
                          {aiGenSelected.length === aiGenQuestions.length ? 'Cancel All' : 'Select All Valid'}
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
                            {/* Validation Status Summary */}
                            {duplicateCheck.results.length > 0 && (
                              <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-medium">Validation Results:</span>
                                  <div className="flex gap-4">
                                    {validationResults.duplicates.length > 0 && (
                                      <span className="text-red-600 font-medium">
                                        🚫 {validationResults.duplicates.length} High Duplicates
                                      </span>
                                    )}
                                    {validationResults.warnings.length > 0 && (
                                      <span className="text-yellow-600 font-medium">
                                        ⚠️ {validationResults.warnings.length} Similar
                                      </span>
                                    )}
                                    {validationResults.duplicates.length === 0 && validationResults.warnings.length === 0 && (
                                      <span className="text-green-600 font-medium">
                                        ✅ All questions are unique
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            <div className="flex justify-end mb-2">
                              <Button
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold"
                                disabled={aiGenSelected.length === 0 || aiGenLoading}
                                onClick={async () => {
                                  if (aiGenLoading) return;
                                  setAIGenLoading(true);
                                  await validateQuestions();
                                  setTimeout(async () => {
                                    const validSelections = aiGenSelected.filter(idx => !validationResults.duplicates.includes(idx));
                                    if (validSelections.length === 0) {
                                      toast.error('No valid questions to save. All selected questions are duplicates.');
                                      setAIGenLoading(false);
                                      return;
                                    }
                                    if (validSelections.length !== aiGenSelected.length) {
                                      const duplicateCount = aiGenSelected.length - validSelections.length;
                                      toast.error(`⚠️ Skipping ${duplicateCount} duplicate questions. Saving ${validSelections.length} unique questions.`);
                                    }
                                    for (const idx of validSelections) {
                                      const q = aiGenEdit[idx] ? { ...aiGenQuestions[idx], ...aiGenEdit[idx] } : aiGenQuestions[idx];
                                      try {
                                        const res = await fetch('/api/questions', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            ...q,
                                            fields: [PREDEFINED_FIELDS.find(f => f.id === aiGenField)?.name || aiGenField],
                                            topics: [PREDEFINED_TOPICS.find(t => t.id === aiGenTopic)?.name || aiGenTopic],
                                            levels: [aiGenParams.level]
                                          }),
                                        });
                                        if (!res.ok) throw new Error('Error saving');
                                        const saved = await res.json();
                                        setQuestions(prev => [saved, ...prev]);
                                      } catch (error) {
                                        console.error('Save error:', error);
                                        toast.error('Error saving question!');
                                      }
                                    }
                                    toast.success(`Saved ${validSelections.length} unique questions!`);
                                    setShowAIGenerate(false);
                                    setAIGenStep(1);
                                    setAIGenQuestions([]);
                                    setAIGenSelected([]);
                                    setAIGenShowExplain([]);
                                    setAIGenSaved([]);
                                    setAIGenEdit([]);
                                    setValidationResults({ duplicates: [], warnings: [], canSave: true });
                                    setDuplicateCheck({ checking: false, results: [] });
                                    setAIGenLoading(false);
                                  }, 100);
                                }}
                              >
                                {aiGenLoading ? (
                                  <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving...</span>
                                ) : 'Save Selected'}
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 gap-6 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                              {aiGenQuestions.map((q, idx) => {
                                // Scope variables inside the map/callback
                                const isEditLocal = aiGenEdit[idx] !== null;
                                const editDataLocal = aiGenEdit[idx] || { question: q.question, answers: q.answers, explanation: q.explanation };
                                const isDuplicateLocal = validationResults.duplicates.includes(idx);
                                const isWarningLocal = validationResults.warnings.includes(idx);

                                let borderClass = 'border-gray-200 bg-white hover:border-indigo-300';
                                if (aiGenSelected.includes(idx)) {
                                  borderClass = 'border-green-500 bg-green-50';
                                }
                                if (isDuplicateLocal) {
                                  borderClass = 'border-red-500 bg-red-50';
                                } else if (isWarningLocal) {
                                  borderClass = 'border-yellow-500 bg-yellow-50';
                                }

                                return (
                                  <Card
                                    key={idx}
                                    className={`relative border-2 p-6 rounded-2xl shadow-lg transition-all group ${borderClass} ${aiGenSaved[idx] ? 'opacity-60' : ''} ${isEditLocal ? 'ring-2 ring-indigo-400' : ''}`}
                                    onClick={() => {
                                      if (!isDuplicateLocal) {
                                        setAIGenSelected(sel => sel.includes(idx) ? sel.filter(i => i !== idx) : [...sel, idx]);
                                      }
                                    }}
                                  >
                                    {/* Duplicate indicator */}
                                    {(isDuplicateLocal || isWarningLocal) && (
                                      <div className={`absolute top-2 right-28 z-20 px-2 py-1 rounded-full text-xs font-bold ${isDuplicateLocal ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'}`}>
                                        {isDuplicateLocal ? '🚫 DUPLICATE' : '⚠️ SIMILAR'}
                                      </div>
                                    )}
                                    {/* Edit controls */}
                                    <div className="absolute top-2 right-2 z-20 flex gap-2">
                                      {!isEditLocal ? (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setAIGenEdit((edits) =>
                                              edits.map((v, i) =>
                                                i === idx
                                                  ? {
                                                      question: q.question,
                                                      answers: (q.answers || []).map(a => ({ ...a })),
                                                      explanation: q.explanation || '',
                                                    }
                                                  : v
                                              )
                                            );
                                          }}
                                        >Edit</Button>
                                      ) : (
                                        <>
                                          <Button
                                            variant="default"
                                            size="sm"
                                            className="bg-indigo-600 hover:bg-indigo-700"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              // Persist edits to the base question and exit edit mode
                                              setAIGenQuestions(prev => {
                                                const arr = [...prev];
                                                arr[idx] = {
                                                  ...arr[idx],
                                                  question: editDataLocal.question,
                                                  answers: editDataLocal.answers,
                                                  explanation: editDataLocal.explanation,
                                                };
                                                return arr;
                                              });
                                              setAIGenEdit((edits) => edits.map((v, i) => (i === idx ? null : v)));
                                            }}
                                          >Done</Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              // Discard edits and exit edit mode
                                              setAIGenEdit((edits) => edits.map((v, i) => (i === idx ? null : v)));
                                            }}
                                          >Cancel</Button>
                                        </>
                                      )}
                                    </div>
                                    {/* Question text */}
                                    {isEditLocal ? (
                                      <textarea
                                        className="w-full border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm text-gray-800 mb-3"
                                        rows={2}
                                        value={editDataLocal.question}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) =>
                                          setAIGenEdit(edits =>
                                            edits.map((v, i) =>
                                              i === idx ? { ...editDataLocal, question: e.target.value } : v
                                            )
                                          )
                                        }
                                      />
                                    ) : (
                                      <div className="font-semibold mb-2">{q.question}</div>
                                    )}
                                    {/* Answers list */}
                                    <ul className="mb-2">
                                      {editDataLocal.answers.map((ans, i) => (
                                        <li key={i} className="flex items-center mb-1">
                                          {isEditLocal ? (
                                            <>
                                              <input
                                                type="text"
                                                value={ans.content}
                                                onChange={e => setAIGenEdit(edits => {
                                                  const arr = [...edits];
                                                  const newAnswers = [...editDataLocal.answers];
                                                  newAnswers[i] = { ...newAnswers[i], content: e.target.value };
                                                  arr[idx] = { ...editDataLocal, answers: newAnswers };
                                                  return arr;
                                                })}
                                                className="flex-1 border-b border-gray-300 px-2 py-1 text-xs mr-2"
                                              onClick={(e) => e.stopPropagation()}
                                              />
                                              <input
                                                type="checkbox"
                                                checked={ans.isCorrect}
                                                onChange={() => setAIGenEdit(edits => {
                                                  const arr = [...edits];
                                                  const newAnswers = [...editDataLocal.answers];
                                                  newAnswers[i] = { ...newAnswers[i], isCorrect: !ans.isCorrect };
                                                  arr[idx] = { ...editDataLocal, answers: newAnswers };
                                                  return arr;
                                                })}
                                                className="ml-2 accent-green-500"
                                              onClick={(e) => e.stopPropagation()}
                                              />
                                            </>
                                          ) : (
                                            <>
                                              {ans.isCorrect ? <Check className="w-4 h-4 text-green-500 mr-1" /> : <span className="w-4 h-4 inline-block mr-1" />}
                                              <span>{ans.content}</span>
                                            </>
                                          )}
                                        </li>
                                      ))}
                                    </ul>
                                    {/* Explanation (edit or view) */}
                                    {isEditLocal ? (
                                      <textarea
                                        className="w-full border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-xs text-gray-700"
                                        value={editDataLocal.explanation}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={e =>
                                          setAIGenEdit(edits =>
                                            edits.map((v, i) =>
                                              i === idx ? { ...editDataLocal, explanation: e.target.value } : v
                                            )
                                          )
                                        }
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
        
        {/* Duplicate Detection Modal */}
        {showDuplicateModal && (
          <div className="fixed inset-0 z-50 w-screen h-screen bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <h3 className="text-xl font-bold">Duplicate Questions Detected</h3>
                </div>
                <button
                  className="text-2xl text-gray-400 hover:text-gray-700"
                  onClick={() => setShowDuplicateModal(false)}
                >×</button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[70vh]">
                {validationResults.duplicates.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-red-600 mb-3">
                      🚫 High Similarity (Cannot Save)
                    </h4>
                    <div className="space-y-3">
                      {validationResults.duplicates.map(idx => (
                        <div key={idx} className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                          <div className="font-medium text-red-800 mb-2">
                            Question {idx + 1}: {aiGenQuestions[idx]?.question}
                          </div>
                          <div className="text-sm text-red-600">
                            Similar to existing questions in database:
                          </div>
                          {duplicateCheck.results[idx]?.similarQuestions.map((sq, i) => (
                            <div key={i} className="text-xs text-red-500 mt-1 pl-4">
                              • {sq.question} (Similarity: {Math.round(sq.similarity * 100)}%)
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {validationResults.warnings.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-yellow-600 mb-3">
                      ⚠️ Moderate Similarity (Review Recommended)
                    </h4>
                    <div className="space-y-3">
                      {validationResults.warnings.map(idx => (
                        <div key={idx} className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                          <div className="font-medium text-yellow-800 mb-2">
                            Question {idx + 1}: {aiGenQuestions[idx]?.question}
                          </div>
                          <div className="text-sm text-yellow-600">
                            Similar to existing questions:
                          </div>
                          {duplicateCheck.results[idx]?.similarQuestions.map((sq, i) => (
                            <div key={i} className="text-xs text-yellow-500 mt-1 pl-4">
                              • {sq.question} (Similarity: {Math.round(sq.similarity * 100)}%)
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center px-6 py-4 border-t bg-gray-50">
                <div className="text-sm text-gray-600">
                  {validationResults.duplicates.length > 0 && (
                    <span className="text-red-600">
                      Cannot save {validationResults.duplicates.length} high-similarity questions
                    </span>
                  )}
                  {validationResults.warnings.length > 0 && (
                    <span className="text-yellow-600 ml-2">
                      {validationResults.warnings.length} questions need review
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowDuplicateModal(false)}>
                    Review Questions
                  </Button>
                  {validationResults.canSave && (
                    <Button 
                      className="bg-green-600 hover:bg-green-700"
                      disabled={aiGenLoading}
                      onClick={async () => {
                        if (aiGenLoading) return;
                        setAIGenLoading(true);
                        setShowDuplicateModal(false);
                        await saveSelectedQuestions();
                        setAIGenLoading(false);
                      }}
                    >
                      {aiGenLoading ? (
                        <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving...</span>
                      ) : (
                        'Save Non-Duplicate Questions'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Top Section: Fields, Topics, Levels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            {/* Fields Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fields
              </label>
              {/* Selected Fields Tags */}
              {formData.fields.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.fields.map((fieldName) => (
                    <span
                      key={fieldName}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                    >
                      {fieldName}
                      <button
                        type="button"
                        onClick={() => {
                          // Remove field and filter out topics that are no longer supported
                          const remainingFields = formData.fields.filter(f => f !== fieldName);
                          const supportedTopics = formData.topics.filter(topicName => {
                            const topic = PREDEFINED_TOPICS.find(t => t.name === topicName);
                            if (!topic) return false;
                            return remainingFields.some(remainingFieldName => {
                              const fieldId = PREDEFINED_FIELDS.find(pf => pf.name === remainingFieldName)?.id;
                              return fieldId && FIELD_TOPICS_MAP[fieldId]?.includes(topic.id);
                            });
                          });
                          
                          setFormData(prev => ({
                            ...prev,
                            fields: remainingFields,
                            topics: supportedTopics
                          }));
                        }}
                        className="ml-1 inline-flex items-center justify-center h-4 w-4 rounded-full hover:bg-indigo-200"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {/* Dropdown for adding fields */}
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                value=""
                onChange={(e) => {
                  if (e.target.value && !formData.fields.includes(e.target.value)) {
                    setFormData(prev => ({ ...prev, fields: [...prev.fields, e.target.value] }));
                  }
                }}
              >
                <option value="">Select a field...</option>
                {PREDEFINED_FIELDS.filter(field => !formData.fields.includes(field.name)).map(field => (
                  <option key={field.id} value={field.name}>{field.name}</option>
                ))}
              </select>
            </div>

            {/* Topics Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topics
              </label>
              {/* Selected Topics Tags */}
              {formData.topics.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.topics.map((topicName) => (
                    <span
                      key={topicName}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {topicName}
                      <button
                        type="button"
                        onClick={() => {
                          // Remove topic and remove related fields that are no longer supported by remaining topics
                          const remainingTopics = formData.topics.filter(t => t !== topicName);
                          
                          // Find fields that are still supported by the remaining topics
                          const supportedFields = formData.fields.filter(fieldName => {
                            const field = PREDEFINED_FIELDS.find(f => f.name === fieldName);
                            if (!field) return true; // Keep custom fields
                            
                            // Check if this field is supported by any remaining topic
                            return remainingTopics.some(remainingTopicName => {
                              const remainingTopic = PREDEFINED_TOPICS.find(t => t.name === remainingTopicName);
                              return remainingTopic && FIELD_TOPICS_MAP[field.id]?.includes(remainingTopic.id);
                            });
                          });
                          
                          setFormData(prev => ({
                            ...prev,
                            topics: remainingTopics,
                            fields: supportedFields
                          }));
                        }}
                        className="ml-1 inline-flex items-center justify-center h-4 w-4 rounded-full hover:bg-blue-200"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {/* Dropdown for adding topics */}
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                value=""
                onChange={(e) => {
                  if (e.target.value && !formData.topics.includes(e.target.value)) {
                    // Add topic and auto-fill related fields
                    const topic = PREDEFINED_TOPICS.find(t => t.name === e.target.value);
                    if (topic) {
                      const relatedFields = PREDEFINED_FIELDS.filter(field => 
                        FIELD_TOPICS_MAP[field.id]?.includes(topic.id)
                      ).map(field => field.name);
                      
                      setFormData(prev => ({ 
                        ...prev, 
                        topics: [...prev.topics, e.target.value],
                        fields: Array.from(new Set([...prev.fields, ...relatedFields]))
                      }));
                    }
                  }
                }}
              >
                <option value="">Select a topic...</option>
                {PREDEFINED_TOPICS.filter(topic => !formData.topics.includes(topic.name)).map(topic => (
                  <option key={topic.id} value={topic.name}>{topic.name}</option>
                ))}
              </select>
            </div>

            {/* Levels Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Levels
              </label>
              {/* Selected Levels Tags */}
              {formData.levels.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.levels.map((levelValue) => {
                    const level = PREDEFINED_LEVELS.find(l => l.value === levelValue);
                    return (
                      <span
                        key={levelValue}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                      >
                        {level?.label || levelValue}
                        <button
                          type="button"
                          onClick={() => toggleLevel(levelValue)}
                          className="ml-1 inline-flex items-center justify-center h-4 w-4 rounded-full hover:bg-green-200"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              {/* Checkboxes for levels */}
              <div className="space-y-2">
                {PREDEFINED_LEVELS.map(level => (
                  <label key={level.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.levels.includes(level.value)}
                      onChange={() => toggleLevel(level.value)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{level.label}</span>
                  </label>
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