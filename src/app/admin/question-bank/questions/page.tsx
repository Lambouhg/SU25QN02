"use client";
import React, { useEffect, useMemo, useState } from "react";
import QuestionBankQuickActions from "@/components/admin/QuestionBankQuickActions";
import { 
  Search, Filter, Plus, Edit2, Trash2, 
  X, Save, Grid, List, RefreshCw, FileText, 
  CheckCircle, Settings, Tag, AlertCircle, SlidersHorizontal
} from "lucide-react";

type QuestionOption = { text: string; isCorrect?: boolean; order?: number; metadata?: unknown };
type QuestionItem = {
  id: string;
  type: string;
  stem: string;
  explanation?: string | null;
  level?: string | null;
  topics: string[];
  fields: string[];
  skills: string[];
  category?: string | null;
  tags?: string[];
  estimatedTime?: number | null;
  sourceAuthor?: string | null;
  difficulty?: string | null;
  options: QuestionOption[];
  updatedAt: string;
};

type Paged<T> = { data: T[]; page: number; pageSize: number; total: number };

// Loading Spinner Component
const LoadingSpinner = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  };
  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`} />
  );
};

// Tag Component
const TagComponent = ({ text, variant = "default", onRemove }: { 
  text: string; 
  variant?: "default" | "success" | "warning" | "error";
  onRemove?: () => void;
}) => {
  const variantClasses = {
    default: "bg-blue-100 text-blue-800 border-blue-200",
    success: "bg-green-100 text-green-800 border-green-200", 
    warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
    error: "bg-red-100 text-red-800 border-red-200"
  };
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${variantClasses[variant]}`}>
      {text}
      {onRemove && (
        <button onClick={onRemove} className="hover:bg-black/10 rounded-full p-0.5">
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
};

// Filter Sidebar Component  
const FilterSidebar = ({ 
  isOpen, 
  onClose, 
  filters, 
  onFilterChange 
}: {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    type: string;
    level: string;
    topics: string;
    fields: string;
    skills: string;
    category: string;
    tags: string;
    difficulty: string;
  };
  onFilterChange: (key: string, value: string) => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:relative lg:inset-auto">
      <div className="absolute inset-0 bg-black/50 lg:hidden" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl lg:relative lg:w-64 lg:shadow-md">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </h3>
          <button onClick={onClose} className="lg:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-4 overflow-y-auto h-full">
          <div>
            <label className="block text-sm font-medium mb-2">Question Type</label>
            <select 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              value={filters.type} 
              onChange={(e) => onFilterChange('type', e.target.value)}
            >
              <option value="">All</option>
              <option value="single_choice">Single Choice</option>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="free_text">Free Text</option>
              <option value="scale">Scale</option>
              <option value="coding">Coding</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Level</label>
            <select 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              value={filters.level} 
              onChange={(e) => onFilterChange('level', e.target.value)}
            >
              <option value="">All</option>
              <option value="junior">Junior</option>
              <option value="middle">Middle</option>
              <option value="senior">Senior</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Difficulty</label>
            <select 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              value={filters.difficulty} 
              onChange={(e) => onFilterChange('difficulty', e.target.value)}
            >
              <option value="">All</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Topics</label>
            <input 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="React Hooks, API Integration..."
              value={filters.topics} 
              onChange={(e) => onFilterChange('topics', e.target.value)} 
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Fields</label>
            <input 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="Frontend, Backend, Mobile..."
              value={filters.fields} 
              onChange={(e) => onFilterChange('fields', e.target.value)} 
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Skills</label>
            <input 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="React, JavaScript..."
              value={filters.skills} 
              onChange={(e) => onFilterChange('skills', e.target.value)} 
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <input 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="Frontend, Backend..."
              value={filters.category} 
              onChange={(e) => onFilterChange('category', e.target.value)} 
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <input 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="react, hooks..."
              value={filters.tags} 
              onChange={(e) => onFilterChange('tags', e.target.value)} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminQuestionsPage() {
  const [items, setItems] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterOpen, setFilterOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filter states
  const [filters, setFilters] = useState({
    type: "",
    level: "",
    topics: "",
    fields: "",
    skills: "",
    category: "",
    tags: "",
    difficulty: ""
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<QuestionItem | null>(null);

  // Form states
  const [stem, setStem] = useState("");
  const [qType, setQType] = useState("single_choice");
  const [qLevel, setQLevel] = useState("");
  const [topics, setTopics] = useState<string>("");
  const [fields, setFields] = useState<string>("");
  const [skills, setSkills] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [tags, setTags] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("");
  const [explanation, setExplanation] = useState<string>("");
  const [options, setOptions] = useState<QuestionOption[]>([{ text: "", isCorrect: true }, { text: "" }]);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (filters.type) p.set("type", filters.type);
    if (filters.level) p.set("level", filters.level);
    if (filters.topics) p.set("topics", filters.topics);
    if (filters.fields) p.set("fields", filters.fields);
    if (filters.skills) p.set("skills", filters.skills);
    if (filters.category) p.set("category", filters.category);
    if (filters.tags) p.set("tags", filters.tags);
    if (filters.difficulty) p.set("difficulty", filters.difficulty);
    return p.toString();
  }, [search, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/qb2/questions?${query}`, { cache: "no-store" });
      const json: Paged<QuestionItem> = await res.json();
      if (!res.ok) throw new Error(((json as unknown) as { error?: string })?.error || "Failed to load");
      setItems(json.data);
      setLastUpdated(new Date()); // Set update time when data successfully loads
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function openCreate() {
    setEditing(null);
    setStem("");
    setQType("single_choice");
    setQLevel("");
    setTopics("");
    setFields("");
    setCategory("");
    setTags("");
    setDifficulty("");
    setExplanation("");
    setOptions([{ text: "", isCorrect: true }, { text: "" }]);
    setFormOpen(true);
  }

  function openEdit(row: QuestionItem) {
    setEditing(row);
    setStem(row.stem);
    setQType(row.type);
    setQLevel(row.level || "");
    setTopics(row.topics?.join(", ") || "");
    setFields(row.fields?.join(", ") || "");
    setSkills(row.skills?.join(", ") || "");
    setCategory(row.category || "");
    setTags((row.tags || []).join(", ") || "");
    setDifficulty(row.difficulty || "");
    setExplanation(row.explanation || "");
    setOptions((row.options || []).map((o) => ({ text: o.text, isCorrect: !!o.isCorrect, order: o.order })));
    setFormOpen(true);
  }

  async function submitForm() {
    const payload = {
      type: qType,
      stem,
      explanation: explanation || null,
      level: qLevel || null,
      topics: topics
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      fields: fields
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      skills: skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      category: category || null,
      tags: tags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      difficulty: difficulty || null,
      options: options.map((o, idx) => ({ text: o.text, isCorrect: !!o.isCorrect, order: o.order ?? idx })),
    };

    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/admin/qb2/questions/${editing.id}` : "/api/admin/qb2/questions";

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || "Save failed");
    setFormOpen(false);
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this question?")) return;
    const res = await fetch(`/api/admin/qb2/questions/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const j = await res.json();
      alert(j?.error || "Delete failed");
      return;
    }
    await load();
  }

  function updateOption(idx: number, patch: Partial<QuestionOption>) {
    setOptions((prev) => prev.map((o, i) => (i === idx ? { ...o, ...patch } : o)));
  }

  function addOption() {
    setOptions((prev) => [...prev, { text: "" }]);
  }

  function removeOption(idx: number) {
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  }

  // Question Card Component
  const QuestionCard = ({ question }: { question: QuestionItem }) => {
    const getDifficultyColor = (diff: string | null | undefined) => {
      switch (diff) {
        case 'easy': return 'text-green-600 bg-green-50';
        case 'medium': return 'text-yellow-600 bg-yellow-50';  
        case 'hard': return 'text-red-600 bg-red-50';
        default: return 'text-gray-600 bg-gray-50';
      }
    };

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

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              {getTypeLabel(question.type)}
            </span>
            {question.level && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                {question.level}
              </span>
            )}
            {question.difficulty && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(question.difficulty)}`}>
                {question.difficulty}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => openEdit(question)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => remove(question.id)}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Question Content */}
        <div className="mb-4">
          <h3 className="font-medium text-gray-900 mb-2 line-clamp-3">{question.stem}</h3>
          {question.explanation && (
            <p className="text-sm text-gray-600 line-clamp-2">{question.explanation}</p>
          )}
        </div>

        {/* Options Preview */}
        {question.options && question.options.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-500 mb-2">Options:</div>
            <div className="space-y-1">
              {question.options.slice(0, 3).map((option, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${option.isCorrect ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-sm text-gray-700 line-clamp-1">{option.text}</span>
                </div>
              ))}
              {question.options.length > 3 && (
                <div className="text-xs text-gray-500">+{question.options.length - 3} more options</div>
              )}
            </div>
          </div>
        )}

        {/* Tags & Metadata */}
        <div className="space-y-2">
          {question.category && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Category:</span>
              <TagComponent text={question.category} variant="default" />
            </div>
          )}
          
          {question.topics && question.topics.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-xs text-gray-500 mt-1">Topics:</span>
              <div className="flex flex-wrap gap-1">
                {question.topics.slice(0, 3).map((topic, idx) => (
                  <TagComponent key={idx} text={topic} variant="warning" />
                ))}
                {question.topics.length > 3 && (
                  <span className="text-xs text-gray-500 mt-1">+{question.topics.length - 3}</span>
                )}
              </div>
            </div>
          )}

          {question.fields && question.fields.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-xs text-gray-500 mt-1">Fields:</span>
              <div className="flex flex-wrap gap-1">
                {question.fields.slice(0, 3).map((field, idx) => (
                  <TagComponent key={idx} text={field} variant="error" />
                ))}
                {question.fields.length > 3 && (
                  <span className="text-xs text-gray-500 mt-1">+{question.fields.length - 3}</span>
                )}
              </div>
            </div>
          )}
          
          {question.skills && question.skills.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-xs text-gray-500 mt-1">Skills:</span>
              <div className="flex flex-wrap gap-1">
                {question.skills.slice(0, 3).map((skill, idx) => (
                  <TagComponent key={idx} text={skill} variant="success" />
                ))}
                {question.skills.length > 3 && (
                  <span className="text-xs text-gray-500 mt-1">+{question.skills.length - 3}</span>
                )}
              </div>
            </div>
          )}

          {question.tags && question.tags.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-xs text-gray-500 mt-1">Tags:</span>
              <div className="flex flex-wrap gap-1">
                {question.tags.slice(0, 4).map((tag, idx) => (
                  <TagComponent key={idx} text={tag} variant="warning" />
                ))}
                {question.tags.length > 4 && (
                  <span className="text-xs text-gray-500 mt-1">+{question.tags.length - 4}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Question Table Component
  const QuestionTable = ({ questions }: { questions: QuestionItem[] }) => {
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
                        onClick={() => openEdit(question)}
                        className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => remove(question.id)}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-6">
          <QuestionBankQuickActions />
          
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
                  {items.length} questions loaded
                </span>
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={load}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button 
                onClick={openCreate}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                Create Question
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Filter Sidebar */}
        <FilterSidebar 
          isOpen={filterOpen}
          onClose={() => setFilterOpen(false)}
          filters={filters}
          onFilterChange={handleFilterChange}
        />

        {/* Main Content */}
        <div className="flex-1 p-6 max-w-7xl mx-auto">
          {/* Enhanced Search & Controls */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Search & Filter</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>View mode:</span>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                    title="Grid View"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                    title="Table View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 flex-wrap">
              {/* Enhanced Search */}
              <div className="flex-1 min-w-80">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search questions by content, category, skills..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all duration-300 ${
                  filterOpen 
                    ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-md' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {Object.values(filters).some(v => v) && (
                  <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                    {Object.values(filters).filter(v => v).length}
                  </span>
                )}
              </button>
            </div>

            {/* Active Filters Display */}
            {Object.values(filters).some(v => v) && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-700">Active filters:</span>
                  {Object.entries(filters).map(([key, value]) => 
                    value ? (
                      <span key={key} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {key}: {value}
                        <button 
                          onClick={() => handleFilterChange(key, "")}
                          className="hover:bg-blue-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ) : null
                  )}
                  <button 
                    onClick={() => setFilters({ type: "", level: "", topics: "", fields: "", skills: "", category: "", tags: "", difficulty: "" })}
                    className="text-xs text-gray-600 hover:text-gray-800 underline"
                  >
                    Clear all
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800 font-medium">An error occurred</span>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <LoadingSpinner size="lg" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Questions</h3>
                <p className="text-gray-600">Please wait while we fetch your questions...</p>
              </div>
            </div>
          )}

          {/* Content */}
          {!loading && !error && (
            <>
              {/* Enhanced Stats Bar */}
              <div className="mb-6 bg-white rounded-xl border p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <p className="text-gray-600">
                      Showing <span className="font-bold text-gray-900">{items.length}</span> questions
                    </p>
                    {Object.values(filters).some(v => v) && (
                      <p className="text-sm text-blue-600">
                        <Filter className="w-4 h-4 inline mr-1" />
                        Filtered results
                      </p>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Last updated: Not yet loaded'}
                  </div>
                </div>
              </div>

              {/* Questions Display */}
              {items.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {Object.values(filters).some(v => v) || search 
                      ? "No questions match your current filters. Try adjusting your search criteria."
                      : "Get started by creating your first question to build your question bank."
                    }
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    {(Object.values(filters).some(v => v) || search) && (
                      <button
                        onClick={() => {
                          setSearch("");
                          setFilters({ type: "", level: "", topics: "", fields: "", skills: "", category: "", tags: "", difficulty: "" });
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Clear Filters
                      </button>
                    )}
                    <button
                      onClick={openCreate}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create First Question
                    </button>
                  </div>
                </div>
              ) : (
                <div className={viewMode === 'grid' ? 
                  "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : 
                  ""
                }>
                  {viewMode === 'grid' ? (
                    items.map((question) => (
                      <QuestionCard key={question.id} question={question} />
                    ))
                  ) : (
                    <QuestionTable questions={items} />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Enhanced Form Modal */}
      {formOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editing ? "Edit Question" : "Create New Question"}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {editing ? "Update question information" : "Add a new question to the bank"}
                  </p>
                </div>
                <button 
                  onClick={() => setFormOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="p-6 space-y-6">
                {/* Question Content Section */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Question Content
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question <span className="text-red-500">*</span>
                      </label>
                      <textarea 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-24" 
                        placeholder="Enter question content..."
                        value={stem} 
                        onChange={(e) => setStem(e.target.value)} 
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Explanation</label>
                      <textarea 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-20" 
                        placeholder="Explain the correct answer..."
                        value={explanation} 
                        onChange={(e) => setExplanation(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>

                {/* Question Properties Section */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Question Properties
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question Type <span className="text-red-500">*</span>
                      </label>
                      <select 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                        value={qType} 
                        onChange={(e) => setQType(e.target.value)}
                      >
                        <option value="single_choice">Single Choice</option>
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="free_text">Free Text</option>
                        <option value="scale">Scale</option>
                        <option value="coding">Coding</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                      <select 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                        value={qLevel} 
                        onChange={(e) => setQLevel(e.target.value)}
                      >
                        <option value="">Select level</option>
                        <option value="junior">Junior</option>
                        <option value="middle">Middle</option>
                        <option value="senior">Senior</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                      <select 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                        value={difficulty} 
                        onChange={(e) => setDifficulty(e.target.value)}
                      >
                        <option value="">Select difficulty</option>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <input 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                        placeholder="Frontend, Backend..."
                        value={category} 
                        onChange={(e) => setCategory(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>

                {/* Metadata Section */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Additional Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Topics (comma separated)</label>
                      <input 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                        placeholder="React, JavaScript, Programming..."
                        value={topics} 
                        onChange={(e) => setTopics(e.target.value)} 
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fields (comma separated)</label>
                      <input 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                        placeholder="Frontend, Backend, DevOps..."
                        value={fields} 
                        onChange={(e) => setFields(e.target.value)} 
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Skills (comma separated)</label>
                      <input 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                        placeholder="React, Vue, Angular..."
                        value={skills} 
                        onChange={(e) => setSkills(e.target.value)} 
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma separated)</label>
                      <input 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                        placeholder="react, hooks, components..."
                        value={tags} 
                        onChange={(e) => setTags(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>

                {/* Options Section */}
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-yellow-900 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Options
                    </h3>
                    <button 
                      className="flex items-center gap-2 px-3 py-1 bg-yellow-200 text-yellow-800 rounded-lg hover:bg-yellow-300 transition-colors text-sm" 
                      onClick={addOption}
                    >
                      <Plus className="w-4 h-4" />
                      Add Option
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {options.map((option, idx) => (
                      <div key={idx} className="flex gap-3 items-start">
                        <div className="flex-1">
                          <input 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                            placeholder={`Option ${idx + 1}`} 
                            value={option.text} 
                            onChange={(e) => updateOption(idx, { text: e.target.value })} 
                          />
                        </div>
                        <label className="flex items-center gap-2 min-w-fit">
                          <input 
                            type="checkbox" 
                            checked={!!option.isCorrect} 
                            onChange={(e) => updateOption(idx, { isCorrect: e.target.checked })} 
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Correct</span>
                        </label>
                        <button 
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                          onClick={() => removeOption(idx)}
                          title="Remove option"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
              <button 
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors" 
                onClick={() => setFormOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" 
                onClick={submitForm}
              >
                <Save className="w-4 h-4" />
                {editing ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}