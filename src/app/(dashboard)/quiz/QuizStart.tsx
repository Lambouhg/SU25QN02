"use client"

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Target,
  ChevronLeft,
  CheckCircle2,
  BarChart3,
} from "lucide-react"

interface Quiz {
  _id: string;
  userId: string;
  field: string;
  topic: string;
  level: 'junior' | 'middle' | 'senior';
  score: number;
  totalQuestions: number;
  timeLimit: number;
  timeUsed: number;
  completedAt: Date;
  retryCount: number;
}

interface FieldType {
  id: string;
  name: string;
}

interface TopicType {
  id: string;
  name: string;
  icon: string;
}

interface ConfigType {
  field: string;
  topic: string;
  level: string;
  questionCount: string;
  timeLimit: string;
  error?: string;
}

interface QuizData {
  field: string;
  topic: string;
  level: string;
  questionCount: number;
  timeLimit: number;
}

interface QuizStartProps {
  config: ConfigType
  onChange: (config: ConfigType) => void
  onStart: (quizData: QuizData) => void
  isLoading: boolean
  error: string | null
}

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
  { id: "others", name: "All", icon: "❓", color: "from-gray-400 to-gray-600" },
]

const PREDEFINED_TOPICS = [
  { id: "sql", name: "SQL", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg" },
  { id: "computer-science", name: "Computer Science", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/computercraft/computercraft-original.svg" },
  { id: "react", name: "React", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" },
  { id: "vue", name: "Vue", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg" },
  { id: "angular", name: "Angular", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angularjs/angularjs-original.svg" },
  { id: "javascript", name: "JavaScript", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" },
  { id: "nodejs", name: "Node.js", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" },
  { id: "typescript", name: "TypeScript", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" },
  { id: "python", name: "Python", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" },
  { id: "system-design", name: "System Design", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg" },
  { id: "api-design", name: "API Design", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg" },
  { id: "aspnet-core", name: "ASP.NET Core", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/dotnetcore/dotnetcore-original.svg" },
  { id: "java", name: "Java", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg" },
  { id: "cpp", name: "C++", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg" },
  { id: "flutter", name: "Flutter", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg" },
  { id: "spring-boot", name: "Spring Boot", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/spring/spring-original.svg" },
  { id: "go", name: "Go Roadmap", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg" },
  { id: "rust", name: "Rust", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-plain.svg" },
  { id: "graphql", name: "GraphQL", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/graphql/graphql-plain.svg" },
  { id: "design-architecture", name: "Design and Architecture", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg" },
  { id: "design-system", name: "Design System", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sketch/sketch-original.svg" },
  { id: "react-native", name: "React Native", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" },
  { id: "aws", name: "AWS", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original.svg" },
  { id: "code-review", name: "Code Review", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg" },
  { id: "docker", name: "Docker", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" },
  { id: "kubernetes", name: "Kubernetes", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg" },
  { id: "linux", name: "Linux", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg" },
  { id: "mongodb", name: "MongoDB", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg" },
  { id: "prompt-engineering", name: "Prompt Engineering", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tensorflow/tensorflow-original.svg" },
  { id: "terraform", name: "Terraform", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/terraform/terraform-original.svg" },
  { id: "data-structures", name: "Data Structures & Algorithms", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/algorithm/algorithm-original.svg" },
  { id: "git-github", name: "Git and GitHub", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg" },
  { id: "redis", name: "Redis", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg" },
  { id: "php", name: "PHP", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg" },
  { id: "cloudflare", name: "Cloudflare", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cloudflare/cloudflare-original.svg" },
  { id: "ai-agents", name: "AI Agents", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tensorflow/tensorflow-original.svg", isNew: true },
  { id: "ai-red-teaming", name: "AI Red Teaming", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pytorch/pytorch-original.svg", isNew: true },
  { id: "backup-recovery", name: "Backup & Recovery", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" },
]

// Thêm mapping field -> topics
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
  others: [
    "react", "vue", "angular", "javascript", "typescript",
    "design-system", "design-architecture", "nodejs", "java", "spring-boot",
    "python", "go", "rust", "graphql", "api-design", "system-design",
    "php", "aspnet-core", "docker", "kubernetes", "linux", "terraform",
    "cloudflare", "aws", "prompt-engineering", "ai-agents", "ai-red-teaming",
    "sql", "mongodb", "data-structures", "cpp", "code-review",
    "react-native", "flutter", "redis", "database-design",
    "performance-tuning", "backup-recovery"
  ] ,
}

const experienceLevels = [
  { value: "junior", label: "Junior", description: "0-2 years experience" },
  { value: "middle", label: "Middle", description: "2-5 years experience" },
  { value: "senior", label: "Senior", description: "5+ years experience" },
];

export default function QuizStart({ config, onChange, onStart, isLoading, error }: QuizStartProps) {
  const [step, setStep] = useState<"field" | "topic" | "config">("field")
  const [selectedField, setSelectedField] = useState<string>("")
  const [selectedTopic, setSelectedTopic] = useState<string>("")
  const [questionCount, setQuestionCount] = useState("") // ban đầu rỗng
  const [timeLimit, setTimeLimit] = useState("") // ban đầu rỗng
  const [customField] = useState("");
  const [customTopic] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [topicError, setTopicError] = useState("");
  const [level, setLevel] = useState(""); // ban đầu rỗng
  const [isGenerating, setIsGenerating] = useState(false);
  const [levelUnlock, setLevelUnlock] = useState<{ junior: boolean; middle: boolean; senior: boolean }>({ junior: true, middle: false, senior: false });
  const [historyLoading, setHistoryLoading] = useState(false);

  // currentFields = PREDEFINED_FIELDS; currentTopics = filteredTopics;
  // Lọc topic theo field đã chọn, hoặc hiển thị tất cả nếu chưa chọn field
  const filteredTopics = selectedField && selectedField !== "others"
    ? PREDEFINED_TOPICS.filter(topic => FIELD_TOPICS_MAP[selectedField]?.includes(topic.id))
    : PREDEFINED_TOPICS;

  const quizSettings = [
    { questions: 5, timeLimit: 5, label: "5 questions - 5 minutes",  type: "Quick", color: "from-green-400 to-emerald-400" },
    { questions: 10, timeLimit: 10, label: "10 questions - 10 minutes",  type: "Standard", color: "from-blue-400 to-cyan-400" },
    { questions: 15, timeLimit: 15, label: "15 questions - 15 minutes",  type: "Extended", color: "from-purple-400 to-pink-400" },
    { questions: 20, timeLimit: 20, label: "20 questions - 20 minutes",  type: "Comprehensive", color: "from-orange-400 to-red-400" },
  ]

  const handleFieldSelect = (field: FieldType) => {
    setSelectedField(field.id)
    onChange({ ...config, field: field.name })
    setStep("topic")
  }

  const handleTopicSelect = (topic: TopicType) => {
    setSelectedTopic(topic.id)
    onChange({ ...config, topic: topic.name })
    
    // Auto-detect field based on selected topic
    const detectedField = Object.entries(FIELD_TOPICS_MAP).find(([, topics]) => 
      topics.includes(topic.id)
    );
    
    if (detectedField) {
      const fieldId = detectedField[0];
      const fieldName = PREDEFINED_FIELDS.find(f => f.id === fieldId)?.name || "";
      setSelectedField(fieldId);
      onChange({ ...config, topic: topic.name, field: fieldName });
    }
    
    setStep("config")
  }

  const isFieldOthers = selectedField === "others";
  const isTopicOthers = selectedTopic === "others";

  const validateCustomInputs = () => {
    let valid = true;
    if (isFieldOthers && !customField.trim()) {
      setFieldError("Field cannot be empty");
      valid = false;
    } else {
      setFieldError("");
    }
    if (isTopicOthers && !customTopic.trim()) {
      setTopicError("Topic cannot be empty");
      valid = false;
    } else {
      setTopicError("");
    }
    return valid;
  };

  const handleStartQuiz = async () => {
    if (!validateCustomInputs()) return;
    setIsGenerating(true);

    try {
      // Gọi API secure quiz từ DB (tạo quiz mới)
      const quizRes = await fetch('/api/quizzes/secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field: isFieldOthers ? customField : PREDEFINED_FIELDS.find(f => f.id === selectedField)?.name || config.field,
          topic: isTopicOthers ? customTopic : PREDEFINED_TOPICS.find(t => t.id === selectedTopic)?.name || config.topic,
          level: level || "junior",
          count: Number(questionCount),
          timeLimit: Number(timeLimit),
        }),
      });
      const quizData = await quizRes.json();
      if (quizData.error) {
        onChange({ ...config, error: quizData.error });
        setIsGenerating(false);
        return;
      }
      onStart(quizData);
    } catch {
      onChange({ ...config, error: 'Something went wrong!' });
    } finally {
      setIsGenerating(false);
    }
  };

  const isFormValid = selectedField && selectedTopic && level && questionCount && timeLimit

  const renderFieldSelection = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Select Specialization</h3>
        <p className="text-gray-600 text-sm">Which specialization do you want to practice?</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {PREDEFINED_FIELDS.map((field: typeof PREDEFINED_FIELDS[number]) => (
          <div
            key={field.id}
            onClick={() => handleFieldSelect(field)}
            className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-300 border-2 ${
              selectedField === field.id
                ? `bg-gradient-to-r ${field.color.replace("500", "50")} border-purple-500 shadow-lg`
                : "bg-white/70 border-gray-200 hover:border-purple-300 hover:shadow-md"
            }`}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">{field.icon}</div>
              <h4 className="font-bold text-gray-800 text-sm">{field.name}</h4>
            </div>
            {selectedField === field.id && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  const renderTopicSelection = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Select Topic</h3>
        <p className="text-gray-600 text-sm">Choose the topic you want to practice.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {filteredTopics.map((topic: typeof PREDEFINED_TOPICS[number]) => (
          <div
            key={topic.id}
            onClick={() => handleTopicSelect(topic)}
            className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-300 border-2 ${
              selectedTopic === topic.id
                ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-500 shadow-lg"
                : "bg-white/70 border-gray-200 hover:border-green-300 hover:shadow-md"
            }`}
          >
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Image 
                  src={topic.icon} 
                  alt={topic.name}
                  width={28}
                  height={28}
                  className="object-contain"
                  onError={() => {
                    // You can handle errors here if needed
                  }}
                />
              </div>
              <h4 className="font-semibold text-gray-800 text-xs leading-tight">{topic.name}</h4>
              {topic.isNew && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                  New
                </span>
              )}
            </div>
            {selectedTopic === topic.id && (
              <div className="absolute top-2 right-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-center pt-4">
        <Button variant="outline" onClick={() => setStep("field")} className="flex items-center gap-2 text-sm">
          <ChevronLeft className="w-4 h-4" />
          Back to specialization selection
        </Button>
      </div>
    </div>
  )

  const renderConfiguration = () => {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Quiz Configuration</h3>
          <p className="text-gray-600">Customize the number of questions and time</p>
        </div>
        <div className="flex items-center justify-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-blue-200">
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Specialization:</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {isFieldOthers ? customField : PREDEFINED_FIELDS.find(f => f.id === selectedField)?.name || config.field}
              </span>
            </div>
            {isFieldOthers && fieldError && (
              <span id="field-error" className="text-xs text-red-600 mt-1">{fieldError}</span>
            )}
          </div>
          <div className="w-px h-12 bg-gray-300"></div>
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Topic:</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                {isTopicOthers ? customTopic : PREDEFINED_TOPICS.find(t => t.id === selectedTopic)?.name || config.topic}
              </span>
            </div>
            {isTopicOthers && topicError && (
              <span id="topic-error" className="text-xs text-red-600 mt-1">{topicError}</span>
            )}
          </div>
        </div>

        {/* Level selection */}
          <div className="space-y-8">
            {/* Level selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-semibold text-gray-700">Level</span>
              {historyLoading && <span className="ml-2 text-xs text-gray-500 animate-pulse">Checking unlocks...</span>}
              </div>
              <div className="flex flex-row gap-4 justify-center w-full">
              {experienceLevels.map((lvl: typeof experienceLevels[number]) => {
                let disabled = false;
                let tooltip = "";
                if (lvl.value === "middle" && !levelUnlock.middle) {
                  disabled = true;
                  tooltip = "Unlock by scoring ≥ 90 in Junior quizzes for this topic.";
                }
                if (lvl.value === "senior" && !levelUnlock.senior) {
                  disabled = true;
                  tooltip = "Unlock by scoring ≥ 90 in Middle quizzes for this topic.";
                }
                return (
                  <button
                    key={lvl.value}
                    type="button"
                    onClick={() => { if (!disabled) { setLevel(lvl.value); onChange({ ...config, level: lvl.value }); } }}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 h-24 text-lg font-bold rounded-full transition border-2 mx-1 min-w-[120px] max-w-[200px] ${
                      level === lvl.value
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg border-purple-500"
                        : disabled
                        ? "bg-gray-100 text-gray-400 opacity-40 border-transparent cursor-not-allowed"
                        : "bg-gray-100 text-gray-700 opacity-60 hover:opacity-100 border-transparent"
                    } focus:outline-none`}
                    style={{ minWidth: 0 }}
                    disabled={disabled}
                    title={tooltip}
                  >
                    <span className="text-2xl"></span>
                    <span>{lvl.label}</span>
                    <span className="text-xs font-normal">{lvl.description}</span>
                    {disabled && tooltip && (
                      <span className="text-xs text-red-500 mt-1">{tooltip}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Quiz Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              <h4 className="text-base font-semibold text-gray-700">Quiz Settings</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {quizSettings.map((setting) => (
                <div
                  key={setting.questions}
                  onClick={() => {
                    setQuestionCount(setting.questions.toString())
                    setTimeLimit(setting.timeLimit.toString())
                  }}
                  className={`relative group p-4 rounded-xl cursor-pointer transition-all duration-300 border-2 ${
                    questionCount === setting.questions.toString() && timeLimit === setting.timeLimit.toString()
                      ? `bg-gradient-to-r ${setting.color.replace("400", "500/10")} border-orange-500/50 shadow-lg`
                      : "bg-white/50 border-gray-200 hover:border-orange-300 hover:bg-orange-50/50"
                  }`}
                >
                  <div className="text-center">
                    <div className="font-bold text-gray-800 text-base mb-1">{setting.label}</div>
                    <div className="text-sm text-gray-500">{setting.type}</div>
                  </div>
                  {questionCount === setting.questions.toString() && timeLimit === setting.timeLimit.toString() && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={() => setStep("topic")} className="flex items-center gap-2 text-sm">
            <ChevronLeft className="w-4 h-4" />
            Back to topic selection
          </Button>
        </div>
      </div>
    )
  }

  // Fetch quiz history and update level unlocks
  useEffect(() => {
    const fetchHistory = async () => {
      if (!selectedField || !selectedTopic) return;
      setHistoryLoading(true);
      try {
        const res = await fetch("/api/quizzes/history");
        if (!res.ok) throw new Error("Failed to fetch quiz history");
        const quizzes = await res.json();
        // Lọc quiz theo field & topic
        const filtered = quizzes.filter((q: Quiz) =>
          q.field === PREDEFINED_FIELDS.find(f => f.id === selectedField)?.name &&
          q.topic === PREDEFINED_TOPICS.find(t => t.id === selectedTopic)?.name
        );
        // Tìm best score từng level
        let bestJunior = 0, bestMiddle = 0, bestSenior = 0;
        filtered.forEach((q: Quiz) => {
          if (q.level === "junior") bestJunior = Math.max(bestJunior, q.score || 0);
          if (q.level === "middle") bestMiddle = Math.max(bestMiddle, q.score || 0);
          if (q.level === "senior") bestSenior = Math.max(bestSenior, q.score || 0);
        });
        // Unlock logic
        const unlock = {
          junior: true,
          middle: bestJunior >= 90,
          senior: bestMiddle >= 90,
        };
        setLevelUnlock(unlock);
      } catch {
        setLevelUnlock({ junior: true, middle: false, senior: false });
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, [selectedField, selectedTopic]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="relative container mx-auto px-4 py-6">
        {/* Main Content */}
        <div className="max-w-5xl mx-auto">
          <Card className="bg-white/90 backdrop-blur-sm border-white/60 shadow-xl">
            <CardContent className="p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">{error}</div>
              )}

              {step === "field" && renderFieldSelection()}
              {step === "topic" && renderTopicSelection()}
              {step === "config" && renderConfiguration()}

              {/* Start Button */}
              {isFormValid && step === "config" && (
                <div className="pt-6">
                  <div className="text-center">
                    <button
                      onClick={handleStartQuiz}
                      disabled={isLoading || isGenerating}
                      className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100"
                    >
                      {isLoading || isGenerating ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          <span>{isGenerating ? "Generating quiz..." : "Creating quiz with AI..."}</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                          Start Quiz
                        </>
                      )}
                    </button>
                    <p className="text-sm text-gray-500 mt-3">
                      AI will generate personalized questions based on your selections
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
