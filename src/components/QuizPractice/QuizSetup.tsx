"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { 
  Play, 
  Target, 
  Zap, 
  Building2, 
  BookOpen,
  Clock,
  Tag,
  TrendingUp,
  CheckCircle2,
  ChevronLeft,
  Star,
  X
} from 'lucide-react';

interface UserPreferences {
  preferredJobRoleId?: string;
  preferredLanguage?: string;
  autoStartWithPreferences?: boolean;
  skills?: string[];
  preferredJobRole?: {
    id: string;
    title: string;
    level: string;
    category?: {
      name: string;
      skills?: string[];
    };
    specialization?: {
      name: string;
    };
  };
}

interface QuizSetupProps {
  mode: 'quick' | 'topic' | 'company';
  setMode: (mode: 'quick' | 'topic' | 'company') => void;
  category: string;
  setCategory: (category: string) => void;
  topic: string;
  setTopic: (topic: string) => void;
  count: string;
  setCount: (count: string) => void;
  level: string;
  setLevel: (level: string) => void;
  field: string;
  setField: (field: string) => void;
  skill: string;
  setSkill: (skill: string) => void;
  questionSetId: string;
  setQuestionSetId: (id: string) => void;
  sets: { id: string; name: string }[];
  facetCats: string[];
  facetTopics: string[];
  facetFields: string[];
  facetSkills: string[];
  onStart: () => void;
  loading: boolean;
}

export default function QuizSetup({
  mode,
  setMode,
  category,
  setCategory,
  topic,
  setTopic,
  count,
  setCount,
  level,
  setLevel,
  field, // eslint-disable-line @typescript-eslint/no-unused-vars
  setField, // eslint-disable-line @typescript-eslint/no-unused-vars
  skill,
  setSkill,
  questionSetId,
  setQuestionSetId,
  sets,
  facetCats,
  facetTopics, // eslint-disable-line @typescript-eslint/no-unused-vars
  facetFields, // eslint-disable-line @typescript-eslint/no-unused-vars
  facetSkills,
  onStart,
  loading
}: QuizSetupProps) {
  const { userId } = useAuth();
  
  // State for filtered options based on cascade filtering
  const [filteredSkills, setFilteredSkills] = useState<string[]>(facetSkills);
  const [loadingFilters, setLoadingFilters] = useState(false);
  
  // State for topics-skills mapping
  const [topicsWithSkills, setTopicsWithSkills] = useState<Array<{topic: string; skills: string[]}>>([]);
  const [loadingTopicsSkills, setLoadingTopicsSkills] = useState(false);
  
  // User preferences state
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [isPreferencesApplied, setIsPreferencesApplied] = useState(false);
  
  // State for progression system
  const [userProgress, setUserProgress] = useState<Record<string, {
    category: string;
    topic: string;
    levels: {
      junior: { unlocked: boolean; bestScore: number; attempts: number };
      middle: { unlocked: boolean; bestScore: number; attempts: number };
      senior: { unlocked: boolean; bestScore: number; attempts: number };
    };
  }>>({});
  const [loadingProgress, setLoadingProgress] = useState(false);

  // Reset selections when mode changes to ensure modes are independent
  useEffect(() => {
    // Clear all selections when switching modes
    setCategory('');
    setTopic('');
    setSkill('');
    setLevel('');
    setCount('');
    setQuestionSetId('');
    setIsPreferencesApplied(false);
  }, [mode, setCategory, setTopic, setSkill, setLevel, setCount, setQuestionSetId]);

  // Load user preferences on component mount
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!userId) return;
      
      try {
        const response = await fetch('/api/profile/interview-preferences');
        if (response.ok) {
          const preferences = await response.json();
          setUserPreferences(preferences);
        }
      } catch (error) {
        console.error('Error loading user preferences:', error);
      }
    };

    loadUserPreferences();
  }, [userId]);

  // Effect to update filtered options with cascade filtering
  useEffect(() => {
    const fetchFilteredFacets = async () => {
      // Build query parameters for cascade filtering
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (skill) params.append('skill', skill);

      // If no filters selected, use all options
      if (!category && !skill) {
        setFilteredSkills(facetSkills);
        return;
      }

      setLoadingFilters(true);
      try {
        const response = await fetch(`/api/quiz/facets/filtered?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          
          // Update filtered lists
          setFilteredSkills(data.data?.skills || []);
          
          // Only reset selections if they're not available in filtered results
          if (skill && data.data?.skills && !data.data.skills.includes(skill)) {
            setSkill('');
          }
        }
      } catch (error) {
        console.error('Error fetching filtered facets:', error);
        // Fallback to original lists on error
        setFilteredSkills(facetSkills);
      } finally {
        setLoadingFilters(false);
      }
    };

    fetchFilteredFacets();
  }, [category, skill, level, facetSkills, setSkill, setLevel]);

  // Update filtered lists when base facets change
  useEffect(() => {
    if (!category && !skill) {
      setFilteredSkills(facetSkills);
    }
  }, [facetSkills, category, skill]);

  // Fetch topics-skills mapping for Quick Practice mode
  useEffect(() => {
    const fetchTopicsSkills = async () => {
      if (mode !== 'quick') return;
      
      setLoadingTopicsSkills(true);
      try {
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        
        const response = await fetch(`/api/quiz/topics-skills?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setTopicsWithSkills(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching topics-skills mapping:', error);
      } finally {
        setLoadingTopicsSkills(false);
      }
    };

    fetchTopicsSkills();
  }, [mode, category]);

  // Fetch user progress for progression system
  const fetchUserProgress = async (category: string, skill: string) => {
    if (!category || !skill) return;
    
    setLoadingProgress(true);
    try {
      const response = await fetch(`/api/quiz/progress?category=${encodeURIComponent(category)}&skill=${encodeURIComponent(skill)}`);
      if (response.ok) {
        const data = await response.json();
        const progressKey = `${category}-${skill}`;
        setUserProgress(prev => ({
          ...prev,
          [progressKey]: data
        }));
      }
    } catch (error) {
      console.error('Error fetching user progress:', error);
    } finally {
      setLoadingProgress(false);
    }
  };

  // Effect to fetch progress when selections change
  useEffect(() => {
    if (mode === 'topic' && category && skill) {
      fetchUserProgress(category, skill);
    }
  }, [mode, category, skill]);

  // Apply user preferences function
  const applyUserPreferences = () => {
    if (userPreferences?.preferredJobRole) {
      const { preferredJobRole } = userPreferences;
      
      // Don't auto-select anything - just mark preferences as applied
      // User will select skill from the buttons, then category will be set
      setCategory('');
      setSkill('');
      setLevel('');
      setCount('10');
      
      setIsPreferencesApplied(true);
      
      toast.success(`Applied preferences for ${preferredJobRole.title} ⚡`);
    }
  };

  // Clear all filters function
  const clearAllFilters = () => {
    setCategory('');
    setTopic('');
    setSkill('');
    setLevel('');
    setCount('');
    setIsPreferencesApplied(false);
    toast.success("Filters cleared");
  };

  const modeCards: Array<{
    id: 'quick' | 'topic' | 'company';
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
  }> = [
    {
      id: 'company',
      title: 'Question Sets',
      description: 'Practice with curated question collections',
      icon: <Building2 className="w-6 h-6" />,
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'quick',
      title: 'Topic Practice',
      description: 'Practice by selecting category and topic',
      icon: <Zap className="w-6 h-6" />,
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'topic',
      title: 'Skill Mastery',
      description: 'Progressive training with unlockable levels',
      icon: <Target className="w-6 h-6" />,
      color: 'from-purple-500 to-purple-600'
    }
  ];

  return (
    <div className="w-full max-w-full mx-auto space-y-8 overflow-x-hidden">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
            <Play className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Quiz Practice</h1>
        </div>
        <p className="text-gray-600 text-lg">Choose your practice mode and start learning</p>
      </div>

      {/* Mode Selection */}
      <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-800">Choose Practice Mode</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {modeCards.map((modeCard) => (
              <button
                key={modeCard.id}
                onClick={() => setMode(modeCard.id)}
                className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                  mode === modeCard.id
                    ? `border-transparent bg-gradient-to-r ${modeCard.color} text-white shadow-lg`
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  {modeCard.icon}
                  <h3 className="font-semibold">{modeCard.title}</h3>
                </div>
                <p className={`text-sm text-left ${mode === modeCard.id ? 'text-white/90' : 'text-gray-600'}`}>
                  {modeCard.description}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-800">Configuration</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Company Mode */}
          {mode === 'company' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-800">Question Set</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Question Set
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={questionSetId}
                    onChange={(e) => setQuestionSetId(e.target.value)}
                  >
                    <option value="">-- Choose a set --</option>
                    {sets.map((set) => (
                      <option key={set.id} value={set.id}>
                        {set.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Quick Mode */}
          {mode === 'quick' && (
            <div className="space-y-8">
              {/* Step 1: Select Category and Topic */}
              {!topic && (
                <div className="space-y-8">
                  <div className="text-center">
                    <h4 className="text-xl font-bold text-gray-800 mb-2">Step 1: Choose Category & Topic</h4>
                    <p className="text-gray-600 text-sm">Select a category and then choose a topic</p>
                  </div>

                  {/* Category Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                        <Tag className="w-4 h-4 text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-700">Select Category</h4>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {facetCats.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setCategory(cat)}
                          className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 group ${
                            category === cat
                              ? 'border-green-500 bg-green-50 shadow-md'
                              : 'border-gray-200 hover:border-green-300 hover:shadow-md'
                          }`}
                        >
                          <div className={`p-2 rounded-lg transition-transform duration-200 ${
                            category === cat
                              ? 'bg-green-500 text-white'
                              : 'bg-green-500 group-hover:scale-110'
                          }`}>
                            <Tag className="w-4 h-4 text-white" />
                          </div>
                          <div className="text-left flex-1">
                            <div className={`font-semibold text-sm ${
                              category === cat ? 'text-green-800' : 'text-gray-800'
                            }`}>{cat}</div>
                            <div className="text-xs text-gray-500">Category</div>
                          </div>
                          {category === cat && (
                            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                              <CheckCircle2 className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Topic Selection - Only show when category is selected */}
                  {category && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-white" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-700">Select Topic</h4>
                        {loadingTopicsSkills && <span className="ml-2 text-xs text-gray-500 animate-pulse">Loading topics...</span>}
                      </div>

                      {loadingTopicsSkills ? (
                        <div className="text-center py-8">
                          <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-gray-600 mt-2">Loading topics...</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {topicsWithSkills.map((topicItem) => (
                            <button
                              key={topicItem.topic}
                              onClick={() => setTopic(topicItem.topic)}
                              className={`p-4 rounded-xl border-2 transition-all duration-200 text-left relative h-full flex flex-col items-start justify-start ${
                                topic === topicItem.topic
                                  ? 'border-blue-500 bg-blue-50 shadow-md'
                                  : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                              }`}
                            >
                              {/* Selected Indicator */}
                              {topic === topicItem.topic && (
                                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                  <CheckCircle2 className="w-3 h-3 text-white" />
                                </div>
                              )}
                              
                              {/* Topic Title Section - Fixed at top */}
                              <div className="w-full mb-3">
                                <div className="flex items-start gap-3">
                                  <div className={`p-2 rounded-lg transition-all duration-200 flex-shrink-0 ${
                                    topic === topicItem.topic
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100'
                                  }`}>
                                    <BookOpen className="w-4 h-4" />
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className={`font-semibold text-base leading-tight ${
                                      topic === topicItem.topic ? 'text-blue-800' : 'text-gray-800'
                                    }`}>
                                      {topicItem.topic}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Skills Section - Fixed position */}
                              <div className="w-full pt-3 border-t border-gray-100">
                                <div className="text-xs text-gray-500">
                                  <div className="font-medium text-gray-600 mb-2">
                                    Skills: {topicItem.skills.length}
                                  </div>
                                  <div className="space-y-1 min-h-[60px]">
                                    {topicItem.skills.slice(0, 3).map((skill, idx) => (
                                      <div key={idx} className="truncate">• {skill}</div>
                                    ))}
                                    {topicItem.skills.length > 3 && (
                                      <div className="text-gray-400">+ {topicItem.skills.length - 3} more</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Configure Quiz */}
              {category && topic && (
                <div className="space-y-8">
                  <div className="text-center">
                    <h4 className="text-xl font-bold text-gray-800 mb-2">Step 2: Configure Your Quiz</h4>
                    <p className="text-gray-600 text-sm">Choose level and quiz settings</p>
                  </div>

                  <div className="flex items-center justify-center gap-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600">Category:</span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        {category}
                      </span>
                    </div>
                    <div className="w-px h-8 bg-gray-300"></div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600">Topic:</span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {topic}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setTopic('');
                        setLevel('');
                        setCount('');
                      }}
                      className="flex items-center gap-1 px-3 py-1 bg-white/80 hover:bg-white text-green-600 hover:text-green-700 rounded-lg text-xs font-medium transition-colors"
                    >
                      <ChevronLeft className="w-3 h-3" />
                      Change Topic
                    </button>
                  </div>

                  {/* Level and Count Configuration */}
                  <div className="space-y-6">
                    <div className="space-y-6">
                      {/* Level Selection */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-white" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-700">Experience Level</h4>
                        </div>

                        <div className="flex flex-row gap-4 justify-center w-full">
                          {[
                            { value: "junior", label: "Junior", description: "0-2 years experience" },
                            { value: "middle", label: "Middle", description: "2-5 years experience" },
                            { value: "senior", label: "Senior", description: "5+ years experience" },
                          ].map((lvl) => (
                            <button
                              key={lvl.value}
                              type="button"
                              onClick={() => setLevel(lvl.value)}
                              className={`flex-1 flex flex-col items-center justify-center gap-1 h-28 text-lg font-bold rounded-full transition border-2 mx-1 min-w-[120px] max-w-[200px] ${
                                level === lvl.value
                                  ? "bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg border-green-500"
                                  : "bg-gray-100 text-gray-700 opacity-60 hover:opacity-100 border-transparent hover:bg-green-50"
                              } focus:outline-none`}
                              style={{ minWidth: 0 }}
                            >
                              <span className="text-2xl">🎯</span>
                              <span>{lvl.label}</span>
                              <span className="text-xs font-normal">{lvl.description}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Quiz Settings */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                            <Clock className="w-4 h-4 text-white" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-700">Quiz Settings</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { questions: 5, label: "5 questions - 10 minutes", type: "Quick", color: "from-green-400 to-emerald-400" },
                            { questions: 10, label: "10 questions - 20 minutes", type: "Standard", color: "from-blue-400 to-cyan-400" },
                            { questions: 15, label: "15 questions - 30 minutes", type: "Extended", color: "from-purple-400 to-pink-400" },
                            { questions: 20, label: "20 questions - 40 minutes", type: "Comprehensive", color: "from-orange-400 to-red-400" },
                          ].map((setting) => (
                            <div
                              key={setting.questions}
                              onClick={() => {
                                setCount(setting.questions.toString());
                              }}
                              className={`relative group p-4 rounded-xl cursor-pointer transition-all duration-300 border-2 ${
                                count === setting.questions.toString()
                                  ? `bg-gradient-to-r ${setting.color.replace("400", "500/10")} border-orange-500/50 shadow-lg`
                                  : "bg-white/50 border-gray-200 hover:border-orange-300 hover:bg-orange-50/50"
                              }`}
                            >
                              <div className="text-center">
                                <div className="font-bold text-gray-800 text-base mb-1">{setting.label}</div>
                                <div className="text-sm text-gray-500">{setting.type}</div>
                              </div>
                              {count === setting.questions.toString() && (
                                <div className="absolute top-2 right-2 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                                  <CheckCircle2 className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Progressive Training Mode */}
          {mode === 'topic' && (
            <div className="space-y-8">
              {/* Step 1: Select Category and Skill */}
              {(!category || !skill) && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h4 className="text-xl font-bold text-gray-800 mb-2">Step 1: Choose Your Learning Path</h4>
                    <p className="text-gray-600 text-sm">Select specialization and skill for your practice</p>
                  </div>

                  {/* Apply Preferences Section */}
                  <div className="flex justify-center">
                    {userPreferences?.preferredJobRole && !isPreferencesApplied && (
                      <button
                        onClick={applyUserPreferences}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-all"
                      >
                        <Star className="w-4 h-4" />
                        Apply My Preferences
                      </button>
                    )}
                  </div>

                  {/* Preferences Applied Indicator with Skills Selection */}
                  {isPreferencesApplied && userPreferences?.preferredJobRole && (
                    <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                            <Star className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-blue-800">
                              Preferences Applied: {userPreferences.preferredJobRole.title}
                            </h4>
                            <p className="text-xs text-blue-600">
                              {userPreferences.preferredJobRole.category?.name} • Level: {userPreferences.preferredJobRole.level}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={clearAllFilters}
                          className="flex items-center gap-1 px-3 py-1 bg-white/80 hover:bg-white text-blue-600 hover:text-blue-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          <X className="w-3 h-3" />
                          Clear
                        </button>
                      </div>
                      
                      {/* User Skills Selection as Buttons */}
                      {userPreferences?.skills && userPreferences.skills.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-blue-700">Choose a skill to practice:</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {userPreferences.skills.map((skillOption, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  setCategory(userPreferences.preferredJobRole?.category?.name || '');
                                  setSkill(skillOption);
                                }}
                                className="flex items-center gap-2 p-3 rounded-lg border border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group text-left"
                              >
                                <div className="p-1 rounded bg-blue-500 group-hover:bg-blue-600 transition-colors">
                                  <Target className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-sm font-medium text-blue-800 group-hover:text-blue-900">
                                  {skillOption}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quick Presets and Manual Selection - Only show when preferences not applied */}
                  {!isPreferencesApplied && (
                    <>
                      {/* Quick Presets for Progressive Training */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <Zap className="w-4 h-4 text-white" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-700">Quick Presets</h4>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {[
                            { 
                              name: "Frontend Development", 
                              category: "Software Development", 
                              skill: "React", 
                              icon: <BookOpen className="w-4 h-4" />, 
                              color: "bg-blue-500" 
                            },
                            { 
                              name: "Backend Development", 
                              category: "Software Development", 
                              skill: "Node.js", 
                              icon: <Target className="w-4 h-4" />, 
                              color: "bg-green-500" 
                            },
                            { 
                              name: "Cloud", 
                              category: "DevOps", 
                              skill: "AWS", 
                              icon: <Building2 className="w-4 h-4" />, 
                              color: "bg-purple-500" 
                            },
                            { 
                              name: "DevOps", 
                              category: "DevOps", 
                              skill: "Docker", 
                              icon: <Clock className="w-4 h-4" />, 
                              color: "bg-orange-500" 
                            },
                            { 
                              name: "Mobile", 
                              category: "Software Development", 
                              skill: "React Native", 
                              icon: <TrendingUp className="w-4 h-4" />, 
                              color: "bg-pink-500" 
                            },
                            { 
                              name: "Database", 
                              category: "Data Science", 
                              skill: "SQL", 
                              icon: <Tag className="w-4 h-4" />, 
                              color: "bg-cyan-500" 
                            }
                          ].map((preset, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                setCategory(preset.category);
                                setSkill(preset.skill);
                              }}
                              className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-200 group"
                            >
                              <div className={`p-2 rounded-lg ${preset.color} group-hover:scale-110 transition-transform duration-200`}>
                                {preset.icon}
                              </div>
                              <div className="text-left flex-1">
                                <div className="font-semibold text-gray-800 text-sm">{preset.name}</div>
                                <div className="text-xs text-gray-500">{preset.skill}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                  {/* Manual Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                        <Tag className="w-4 h-4 text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-700">Manual Selection</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Tag className="w-4 h-4 inline mr-1" />
                          Category
                        </label>
                        <select
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        >
                          <option value="">Select Category</option>
                          {facetCats.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Target className="w-4 h-4 inline mr-1" />
                          Skill
                        </label>
                        <select
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          value={skill}
                          onChange={(e) => setSkill(e.target.value)}
                        >
                          <option value="">Select Skill</option>
                          {filteredSkills.map((skl) => (
                            <option key={skl} value={skl}>
                              {skl}
                            </option>
                          ))}
                        </select>
                        {loadingFilters && (
                          <p className="text-xs text-gray-500 mt-1">Loading skills...</p>
                        )}
                      </div>
                    </div>
                  </div>
                    </>
                  )}
                </div>
              )}

              {/* Step 2: Level Selection and Quiz Settings */}
              {category && skill && (
                <div className="space-y-8">
                  <div className="text-center">
                    <h4 className="text-xl font-bold text-gray-800 mb-2">Step 2: Configure Your Quiz</h4>
                    <p className="text-gray-600 text-sm">Choose level and quiz settings</p>
                  </div>

                  <div className="flex items-center justify-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600">Specialization:</span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                        {category}
                      </span>
                    </div>
                    <div className="w-px h-8 bg-gray-300"></div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600">Skill:</span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        {skill}
                      </span>
                    </div>
                  </div>

                  {/* Level Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <Target className="w-4 h-4 text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-700">Experience Level</h4>
                      {loadingProgress && <span className="ml-2 text-xs text-gray-500 animate-pulse">Checking unlocks...</span>}
                    </div>

                    {loadingProgress ? (
                      <div className="text-center py-8">
                        <div className="inline-block w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-600 mt-2">Loading your progress...</p>
                      </div>
                    ) : (
                      <div className="flex flex-row gap-4 justify-center w-full">
                        {[
                          { value: "junior", label: "Junior", description: "0-2 years experience" },
                          { value: "middle", label: "Middle", description: "2-5 years experience" },
                          { value: "senior", label: "Senior", description: "5+ years experience" },
                        ].map((lvl) => {
                          const progressKey = `${category}-${skill}`;
                          const levelData = userProgress[progressKey]?.levels[lvl.value as keyof typeof userProgress[typeof progressKey]['levels']];
                          const isUnlocked = lvl.value === 'junior' || (levelData?.unlocked ?? false);
                          const bestScore = levelData?.bestScore ?? 0;
                          let tooltip = "";

                          if (lvl.value === "middle" && !isUnlocked) {
                            tooltip = "Unlock by scoring ≥ 9 in Junior quizzes for this skill.";
                          }
                          if (lvl.value === "senior" && !isUnlocked) {
                            tooltip = "Unlock by scoring ≥ 9 in Middle quizzes for this skill.";
                          }

                          return (
                              <button
                                key={lvl.value}
                                type="button"
                                onClick={() => { if (isUnlocked) { setLevel(lvl.value); } }}
                                className={`flex-1 flex flex-col items-center justify-center gap-1 h-28 text-lg font-bold rounded-full transition border-2 mx-1 min-w-[120px] max-w-[200px] ${
                                  level === lvl.value
                                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg border-purple-500"
                                    : isUnlocked
                                    ? "bg-gray-100 text-gray-700 opacity-60 hover:opacity-100 border-transparent hover:bg-purple-50"
                                    : "bg-gray-100 text-gray-400 opacity-40 border-transparent cursor-not-allowed"
                                } focus:outline-none`}
                                style={{ minWidth: 0 }}
                                disabled={!isUnlocked}
                                title={tooltip}
                              >
                               <span className="text-2xl">🎯</span>
                               <span>{lvl.label}</span>
                               <span className="text-xs font-normal">{lvl.description}</span>
                               {isUnlocked && bestScore > 0}
                               {!isUnlocked && tooltip && (
                                 <span className="text-xs text-red-500 mt-1 text-center px-2 leading-tight">{tooltip}</span>
                               )}
                              </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Quiz Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                        <Clock className="w-4 h-4 text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-700">Quiz Settings</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { questions: 5, label: "5 questions - 10 minutes", type: "Quick", color: "from-green-400 to-emerald-400" },
                        { questions: 10, label: "10 questions - 20 minutes", type: "Standard", color: "from-blue-400 to-cyan-400" },
                        { questions: 15, label: "15 questions - 30 minutes", type: "Extended", color: "from-purple-400 to-pink-400" },
                        { questions: 20, label: "20 questions - 40 minutes", type: "Comprehensive", color: "from-orange-400 to-red-400" },
                      ].map((setting) => (
                        <div
                          key={setting.questions}
                          onClick={() => {
                            setCount(setting.questions.toString());
                          }}
                          className={`relative group p-4 rounded-xl cursor-pointer transition-all duration-300 border-2 ${
                            count === setting.questions.toString()
                              ? `bg-gradient-to-r ${setting.color.replace("400", "500/10")} border-orange-500/50 shadow-lg`
                              : "bg-white/50 border-gray-200 hover:border-orange-300 hover:bg-orange-50/50"
                          }`}
                        >
                          <div className="text-center">
                            <div className="font-bold text-gray-800 text-base mb-1">{setting.label}</div>
                            <div className="text-sm text-gray-500">{setting.type}</div>
                          </div>
                          {count === setting.questions.toString() && (
                            <div className="absolute top-2 right-2 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                              <CheckCircle2 className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-center pt-4">
                    <Button variant="outline" onClick={() => {
                      setSkill('');
                      setLevel('');
                    }} className="flex items-center gap-2 text-sm">
                      <ChevronLeft className="w-4 h-4" />
                      Back to selection
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}


        </CardContent>
      </Card>

      {/* Start Button */}
      <div className="text-center">
        <Button
          onClick={onStart}
          disabled={loading || (mode === 'company' && !questionSetId) || (mode === 'quick' && (!category || !topic || !count)) || (mode === 'topic' && (!category || !skill || !level))}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-12 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Starting Quiz...
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-2" />
              Start Quiz
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

