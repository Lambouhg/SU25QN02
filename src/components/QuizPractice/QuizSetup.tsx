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
  Clock,
  Tag,
  TrendingUp,
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
  sets: { id: string; name: string; description?: string; topics?: string[]; fields?: string[]; skills?: string[]; level?: string; questionCount?: number }[];
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
  facetTopics,
  facetFields, // eslint-disable-line @typescript-eslint/no-unused-vars
  facetSkills,
  onStart,
  loading
}: QuizSetupProps) {
  const { userId } = useAuth();
  
  // State for filtered options based on cascade filtering
  const [filteredSkills, setFilteredSkills] = useState<string[]>(facetSkills);
  
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

  // Client-side filtering logic (no API calls needed)
  useEffect(() => {
    // Simple client-side filtering based on category selection
    if (!category) {
      setFilteredSkills(facetSkills);
      return;
    }

    // For now, use all skills when category is selected
    // This can be enhanced with more sophisticated filtering logic if needed
    setFilteredSkills(facetSkills);
    
    // Only reset skill selection if it's not available in filtered results
    if (skill && facetSkills.length > 0 && !facetSkills.includes(skill)) {
      setSkill('');
    }
  }, [category, skill, facetSkills, setSkill]);

  // Update filtered lists when base facets change
  useEffect(() => {
    if (!category && !skill) {
      setFilteredSkills(facetSkills);
    }
  }, [facetSkills, category, skill]);

  // Build topics-skills mapping from facet data (client-side)
  useEffect(() => {
    if (mode !== 'quick') return;
    
    setLoadingTopicsSkills(true);
    
    // Create simple topics-skills mapping from available facets
    // This is a simplified version - can be enhanced based on your needs
    const topicsMapping = facetTopics.map(topic => ({
      topic: topic,
      skills: facetSkills.filter(skill => 
        // Simple matching logic - you can enhance this
        topic.toLowerCase().includes(skill.toLowerCase()) || 
        skill.toLowerCase().includes(topic.toLowerCase())
      )
    })).filter(item => item.skills.length > 0);
    
    setTopicsWithSkills(topicsMapping);
    setLoadingTopicsSkills(false);
  }, [mode, category, facetTopics, facetSkills]);

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
                    {sets.map((set) => {
                      const skills = set.skills && set.skills.length > 0 ? ` • ${set.skills.slice(0, 3).join(', ')}${set.skills.length > 3 ? '...' : ''}` : '';
                      const level = set.level ? ` [${set.level.charAt(0).toUpperCase() + set.level.slice(1)}]` : '';
                      const questionCount = set.questionCount !== undefined ? ` (${set.questionCount} questions)` : '';
                      return (
                        <option key={set.id} value={set.id}>
                          {set.name}{level}{questionCount}{skills}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Question Set Details */}
              {questionSetId && (() => {
                const selectedSet = sets.find(set => set.id === questionSetId);
                return selectedSet && (
                  <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <h5 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white">ℹ</span>
                      </div>
                      Question Set Details
                    </h5>

                    {/* Description */}
                    {selectedSet.description && (
                      <div className="mb-4 p-3 bg-white rounded-lg border border-blue-100">
                        <p className="text-sm text-gray-700 leading-relaxed">{selectedSet.description}</p>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-4">
                      {selectedSet.questionCount !== undefined && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-blue-100">
                          <span className="text-blue-600 font-medium text-sm">📝</span>
                          <span className="text-blue-800 font-semibold text-sm">{selectedSet.questionCount} Questions</span>
                        </div>
                      )}
                      {selectedSet.level && (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                          selectedSet.level === 'junior' ? 'bg-green-100 text-green-800' :
                          selectedSet.level === 'middle' ? 'bg-blue-100 text-blue-800' :
                          selectedSet.level === 'senior' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          <span>🎯</span>
                          <span>{selectedSet.level.charAt(0).toUpperCase() + selectedSet.level.slice(1)} Level</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {/* Skills */}
                      {selectedSet.skills && selectedSet.skills.length > 0 && (
                        <div>
                          <span className="text-xs text-blue-600 font-medium mb-2 block">💡 Skills:</span>
                          <div className="flex flex-wrap gap-1">
                            {selectedSet.skills.slice(0, 8).map((skill, idx) => (
                              <span key={idx} className="px-2 py-1 bg-white border border-blue-200 text-blue-700 rounded-md text-xs">
                                {skill}
                              </span>
                            ))}
                            {selectedSet.skills.length > 8 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
                                +{selectedSet.skills.length - 8} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Topics */}
                      {selectedSet.topics && selectedSet.topics.length > 0 && (
                        <div>
                          <span className="text-xs text-blue-600 font-medium mb-2 block">📚 Topics:</span>
                          <div className="flex flex-wrap gap-1">
                            {selectedSet.topics.slice(0, 6).map((topic, idx) => (
                              <span key={idx} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md text-xs">
                                {topic}
                              </span>
                            ))}
                            {selectedSet.topics.length > 6 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
                                +{selectedSet.topics.length - 6} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Fields */}
                      {selectedSet.fields && selectedSet.fields.length > 0 && (
                        <div>
                          <span className="text-xs text-blue-600 font-medium mb-2 block">🏢 Fields:</span>
                          <div className="flex flex-wrap gap-1">
                            {selectedSet.fields.slice(0, 6).map((field, idx) => (
                              <span key={idx} className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs">
                                {field}
                              </span>
                            ))}
                            {selectedSet.fields.length > 6 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
                                +{selectedSet.fields.length - 6} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Quick Mode - Topic Practice */}
          {mode === 'quick' && (
            <div className="space-y-6">
              <div className="text-center">
                <h4 className="text-2xl font-bold text-gray-800 mb-2">Topic Practice</h4>
                <p className="text-gray-600">Choose your category, topic, and configure your quiz</p>
              </div>

              {/* Main Configuration Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Left Column - Category & Topic Selection */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-2xl border border-green-100">
                    <h5 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <Tag className="w-3 h-3 text-white" />
                      </div>
                      Content Selection
                    </h5>
                    
                    <div className="space-y-4">
                      {/* Category Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category
                        </label>
                        <select
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        >
                          <option value="">Choose a category...</option>
                          {facetCats.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Topic Selection */}
                      <div className={!category ? 'opacity-50 pointer-events-none' : ''}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Topic {loadingTopicsSkills && <span className="text-xs text-gray-500 animate-pulse ml-1">(Loading...)</span>}
                        </label>
                        {loadingTopicsSkills ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="inline-block w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        ) : (
                          <div>
                            <select
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              value={topic}
                              onChange={(e) => setTopic(e.target.value)}
                            >
                              <option value="">Choose a topic...</option>
                              {topicsWithSkills.map((topicItem) => (
                                <option key={topicItem.topic} value={topicItem.topic}>
                                  {topicItem.topic} ({topicItem.skills.length} skills)
                                </option>
                              ))}
                            </select>
                            
                            {/* Skills Preview */}
                            {(() => {
                              const selectedTopic = topic ? topicsWithSkills.find(t => t.topic === topic) : null;
                              return selectedTopic && (
                                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <div className="text-xs text-blue-600 font-medium mb-2">
                                    Related Skills:
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {selectedTopic.skills.slice(0, 6).map((skill, idx) => (
                                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                        {skill}
                                      </span>
                                    ))}
                                    {selectedTopic.skills.length > 6 && (
                                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                        +{selectedTopic.skills.length - 6} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Level & Quiz Settings */}
                <div className="space-y-6">
                  
                  {/* Experience Level */}
                  <div className={`bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-100 ${!category || !topic ? 'opacity-50 pointer-events-none' : ''}`}>
                    <h5 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-3 h-3 text-white" />
                      </div>
                      Experience Level
                    </h5>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: "junior", label: "Junior", description: "0-2 years", color: "from-green-500 to-emerald-500", emoji: "🌱" },
                        { value: "middle", label: "Middle", description: "2-5 years", color: "from-blue-500 to-cyan-500", emoji: "🚀" },
                        { value: "senior", label: "Senior", description: "5+ years", color: "from-purple-500 to-pink-500", emoji: "⭐" },
                      ].map((lvl) => (
                        <button
                          key={lvl.value}
                          type="button"
                          onClick={() => setLevel(lvl.value)}
                          className={`p-3 rounded-xl transition-all border-2 text-center ${
                            level === lvl.value
                              ? `bg-gradient-to-r ${lvl.color} text-white shadow-lg border-transparent`
                              : "bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700"
                          }`}
                        >
                          <div className="text-lg mb-1">{lvl.emoji}</div>
                          <div className="font-semibold text-sm">{lvl.label}</div>
                          <div className="text-xs opacity-90">{lvl.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quiz Settings */}
                  <div className={`bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-2xl border border-orange-100 ${!category || !topic || !level ? 'opacity-50 pointer-events-none' : ''}`}>
                    <h5 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                        <Clock className="w-3 h-3 text-white" />
                      </div>
                      Quiz Length
                    </h5>
                    
                    <select
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                      value={count}
                      onChange={(e) => setCount(e.target.value)}
                    >
                      <option value="">Choose duration...</option>
                      <option value="5">⚡ Quick - 5 questions (~10 min)</option>
                      <option value="10">📝 Standard - 10 questions (~20 min)</option>
                      <option value="15">📚 Extended - 15 questions (~30 min)</option>
                      <option value="20">🎯 Comprehensive - 20 questions (~40 min)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Progress Summary */}
              {(category || topic || level || count) && (
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Category:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${category ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                        {category || 'Not selected'}
                      </span>
                    </div>
                    <div className="w-px h-4 bg-gray-300"></div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Topic:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${topic ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>
                        {topic || 'Not selected'}
                      </span>
                    </div>
                    <div className="w-px h-4 bg-gray-300"></div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Level:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${level ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-500'}`}>
                        {level ? level.charAt(0).toUpperCase() + level.slice(1) : 'Not selected'}
                      </span>
                    </div>
                    <div className="w-px h-4 bg-gray-300"></div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Questions:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${count ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-500'}`}>
                        {count || 'Not selected'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Topic Practice Mode - All in One Screen */}
          {mode === 'topic' && (
            <div className="space-y-8">
              <div className="text-center">
                <h4 className="text-xl font-bold text-gray-800 mb-2">Topic Practice Setup</h4>
                <p className="text-gray-600 text-sm">Configure all settings in one place</p>
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
                    
                    <div className="max-w-md">
                      <select
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                        value=""
                        onChange={(e) => {
                          const preset = [
                            { name: "Frontend Development", category: "Software Development", skill: "React" },
                            { name: "Backend Development", category: "Software Development", skill: "Node.js" },
                            { name: "Cloud", category: "DevOps", skill: "AWS" },
                            { name: "DevOps", category: "DevOps", skill: "Docker" },
                            { name: "Mobile", category: "Software Development", skill: "React Native" },
                            { name: "Database", category: "Data Science", skill: "SQL" }
                          ].find(p => p.name === e.target.value);
                          
                          if (preset) {
                            setCategory(preset.category);
                            setSkill(preset.skill);
                          }
                        }}
                      >
                        <option value="">Choose a quick preset...</option>
                        <option value="Frontend Development">Frontend Development (React)</option>
                        <option value="Backend Development">Backend Development (Node.js)</option>
                        <option value="Cloud">Cloud (AWS)</option>
                        <option value="DevOps">DevOps (Docker)</option>
                        <option value="Mobile">Mobile (React Native)</option>
                        <option value="Database">Database (SQL)</option>
                      </select>
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
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Level Selection - Always visible */}
              <div className={`space-y-4 ${!category || !skill ? 'opacity-50 pointer-events-none' : ''}`}>
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

              {/* Quiz Settings - Always visible */}
              <div className={`space-y-4 ${!category || !skill || !level ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-700">Quiz Settings</h4>
                </div>
                
                <div className="max-w-md">
                  <select
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                  >
                    <option value="">Choose quiz length...</option>
                    <option value="5">5 questions - 10 minutes (Quick)</option>
                    <option value="10">10 questions - 20 minutes (Standard)</option>
                    <option value="15">15 questions - 30 minutes (Extended)</option>
                    <option value="20">20 questions - 40 minutes (Comprehensive)</option>
                  </select>
                </div>
              </div>
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

