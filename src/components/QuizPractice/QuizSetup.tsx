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
  Tag,
  TrendingUp,
  Star
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

interface CategoryData {
  id: string;
  name: string;
  topics: Array<{name: string; skills: string[]}>;
  skills: string[];
  fields: string[];
  levels: string[];
  questionCount: number;
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
  categoriesData: CategoryData[];
  facetCats: string[];
  facetTopics: string[];
  facetFields: string[];
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
  categoriesData,
  facetCats,
  facetTopics, // eslint-disable-line @typescript-eslint/no-unused-vars
  facetFields, // eslint-disable-line @typescript-eslint/no-unused-vars
  onStart,
  loading
}: QuizSetupProps) {
  const { userId } = useAuth();
  
  // State for filtered options based on cascade filtering
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [filteredTopics, setFilteredTopics] = useState<Array<{name: string; skills: string[]}>>([]);
  
  // State for loading topics
  const [loadingTopicsSkills, setLoadingTopicsSkills] = useState(false);
  
  // User preferences state
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [isPreferencesApplied, setIsPreferencesApplied] = useState(false);
  


  // Reset selections when mode changes to ensure modes are independent
  useEffect(() => {
    // Clear all selections when switching modes
    setCategory('');
    setTopic('');
    setSkill('');
    setLevel('');
    setCount('');
    setQuestionSetId('');
    setSelectedSkills([]);
    setFilteredTopics([]);
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

  // Client-side filtering logic dựa trên hierarchy: Category → Skills → Topics
  useEffect(() => {
    if (!category) {
      setSelectedSkills([]);
      setFilteredTopics([]);
      return;
    }

    // Filter skills based on selected category
    const selectedCategoryData = categoriesData.find(cat => cat.name === category);
    if (selectedCategoryData) {
      // Only validate and update selectedSkills if needed (avoid infinite loop)
      setSelectedSkills(prev => {
        const validSelectedSkills = prev.filter(skill => selectedCategoryData.skills.includes(skill));
        // Only update if different to avoid re-render
        return validSelectedSkills.length !== prev.length ? validSelectedSkills : prev;
      });
    } else {
      setSelectedSkills([]);
      setFilteredTopics([]);
    }
  }, [category, categoriesData]);

  // Build topics filtering based on selected skills
  useEffect(() => {
    if (mode !== 'quick') return;
    
    setLoadingTopicsSkills(true);
    
    // Find selected category data
    const selectedCategoryData = categoriesData.find(cat => cat.name === category);
    
    if (selectedCategoryData && selectedSkills.length > 0) {
      // Filter topics that contain at least one of the selected skills
      const relevantTopics = selectedCategoryData.topics.filter(topicData => 
        topicData.skills.some(skill => selectedSkills.includes(skill))
      );
      setFilteredTopics(relevantTopics);
    } else if (selectedCategoryData && selectedSkills.length === 0) {
      // Show all topics when no skills selected yet
      setFilteredTopics(selectedCategoryData.topics);
    } else {
      setFilteredTopics([]);
    }
    
    setLoadingTopicsSkills(false);
  }, [mode, category, selectedSkills, categoriesData]);

  // Separate effect to handle topic validation when filtered topics change
  useEffect(() => {
    if (mode !== 'quick' || !topic) return;
    
    // Reset topic if current topic is not in filtered results
    if (filteredTopics.length > 0 && !filteredTopics.some(t => t.name === topic)) {
      setTopic('');
    }
  }, [mode, topic, filteredTopics, setTopic]);

  // Validate and reset level when topic changes in quick mode
  useEffect(() => {
    if (mode !== 'quick' || !category || !topic) return;
    
    const selectedCategoryData = categoriesData.find(cat => cat.name === category);
    const availableLevels = selectedCategoryData?.levels || [];
    
    // Reset level if current level is not available in the selected category/topic
    if (level && !availableLevels.includes(level)) {
      setLevel('');
    }
  }, [mode, category, topic, level, categoriesData, setLevel]);



  // Auto-apply preferences for Skill Mastery mode
  useEffect(() => {
    if (mode === 'topic' && userPreferences?.preferredJobRole && !isPreferencesApplied) {
      const { preferredJobRole } = userPreferences;
      
      // Auto-apply preferences without user action
      setCategory(preferredJobRole.category?.name || '');
      setLevel(preferredJobRole.level || 'junior'); // Auto-set level from preference
      setCount('10');
      
      setIsPreferencesApplied(true);
      
      toast.success(`Auto-applied preferences for ${preferredJobRole.title} (${preferredJobRole.level}) ⚡`);
    }
  }, [mode, userPreferences, isPreferencesApplied, setCategory, setLevel, setCount]);

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
      description: 'Personalized training based on your preferences',
      icon: <Target className="w-6 h-6" />,
      color: 'from-purple-500 to-purple-600'
    }
  ];

  return (
    <div className="w-full max-w-full mx-auto space-y-8 overflow-x-hidden">
      {/* Mode Selection */}
      <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
        <CardHeader>
          <h1 className="text-3xl font-bold text-gray-800">Quiz Practice Mode</h1>
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
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">📚</span>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-700">Select Question Set</h4>
                </div>
                
                {/* Question Sets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
                  {sets.map((set) => (
                    <button
                      key={set.id}
                      onClick={() => setQuestionSetId(set.id)}
                      className={`relative group p-6 rounded-xl cursor-pointer transition-all duration-300 border-2 text-left ${
                        questionSetId === set.id
                          ? 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-500/50 shadow-lg'
                          : 'bg-white/50 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className={`font-semibold text-base leading-tight ${
                              questionSetId === set.id ? 'text-blue-800' : 'text-gray-800'
                            }`}>
                              {set.name}
                            </h5>
                            {set.description && (
                              <p className={`text-sm mt-2 line-clamp-2 ${
                                questionSetId === set.id ? 'text-blue-600' : 'text-gray-600'
                              }`}>
                                {set.description}
                              </p>
                            )}
                          </div>
                          {questionSetId === set.id && (
                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                              <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                            </div>
                          )}
                        </div>
                        
                        {/* Question count and level badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {set.questionCount !== undefined && (
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                              questionSetId === set.id
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {set.questionCount} questions
                            </div>
                          )}
                          {set.level && (
                            <div className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                              questionSetId === set.id
                                ? set.level === 'junior' ? 'bg-green-100 text-green-700' :
                                  set.level === 'middle' ? 'bg-blue-100 text-blue-700' :
                                  set.level === 'senior' ? 'bg-purple-100 text-purple-700' :
                                  'bg-gray-100 text-gray-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {set.level}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Question Set Details */}
              {questionSetId && (() => {
                const selectedSet = sets.find(set => set.id === questionSetId);
                return selectedSet && (
                  <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 rounded-xl border-2 border-blue-200 shadow-sm">
                    {/* Header with Set Name */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-sm">
                          <span className="text-white text-lg">✨</span>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-blue-900">{selectedSet.name}</h4>
                          <p className="text-sm text-blue-600">Ready to start this question set</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-medium">
                          Selected
                        </div>
                      </div>
                    </div>

                    {/* Key Stats in Balanced Layout */}
                    <div className="flex flex-wrap justify-center gap-3 mb-4">
                      {selectedSet.questionCount !== undefined && (
                        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-blue-200 text-center hover:shadow-md transition-shadow min-w-[120px] flex-1 max-w-[160px]">
                          <div className="text-2xl font-bold text-blue-700 mb-1">{selectedSet.questionCount}</div>
                          <div className="text-sm text-blue-600 font-medium">Questions</div>
                        </div>
                      )}
                      
                      {selectedSet.level && (
                        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-blue-200 text-center hover:shadow-md transition-shadow min-w-[120px] flex-1 max-w-[160px]">
                          <div className={`text-2xl font-bold mb-1 capitalize ${
                            selectedSet.level === 'junior' ? 'text-green-600' :
                            selectedSet.level === 'middle' ? 'text-blue-600' :
                            selectedSet.level === 'senior' ? 'text-purple-600' :
                            'text-gray-600'
                          }`}>
                            {selectedSet.level}
                          </div>
                          <div className="text-sm text-blue-600 font-medium">Level</div>
                        </div>
                      )}

                      {selectedSet.skills && selectedSet.skills.length > 0 && (
                        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-blue-200 text-center hover:shadow-md transition-shadow min-w-[120px] flex-1 max-w-[160px]">
                          <div className="text-2xl font-bold text-blue-700 mb-1">{selectedSet.skills.length}</div>
                          <div className="text-sm text-blue-600 font-medium">Skills</div>
                        </div>
                      )}

                      {selectedSet.topics && selectedSet.topics.length > 0 && (
                        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-blue-200 text-center hover:shadow-md transition-shadow min-w-[120px] flex-1 max-w-[160px]">
                          <div className="text-2xl font-bold text-blue-700 mb-1">{selectedSet.topics.length}</div>
                          <div className="text-sm text-blue-600 font-medium">Topics</div>
                        </div>
                      )}

                      {selectedSet.fields && selectedSet.fields.length > 0 && (
                        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-blue-200 text-center hover:shadow-md transition-shadow min-w-[120px] flex-1 max-w-[160px]">
                          <div className="text-2xl font-bold text-blue-700 mb-1">{selectedSet.fields.length}</div>
                          <div className="text-sm text-blue-600 font-medium">Fields</div>
                        </div>
                      )}
                    </div>

                    {/* Description - Compact */}
                    {selectedSet.description && (
                      <div className="mb-4 p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-blue-200">
                        <p className="text-gray-700 text-sm leading-relaxed">{selectedSet.description}</p>
                      </div>
                    )}

                    {/* Content Preview - Balanced Layout */}
                    <div className="flex flex-wrap justify-center gap-4">
                      {/* Skills Display - Show All */}
                      {selectedSet.skills && selectedSet.skills.length > 0 && (
                        <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-blue-200 flex-1 min-w-[300px]">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-blue-600">💡</span>
                            <h6 className="text-sm font-semibold text-blue-800">Skills ({selectedSet.skills.length})</h6>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedSet.skills.map((skill, idx) => (
                              <span key={idx} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Topics Display - Show All */}
                      {selectedSet.topics && selectedSet.topics.length > 0 && (
                        <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-blue-200 flex-1 min-w-[300px]">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-indigo-600">📚</span>
                            <h6 className="text-sm font-semibold text-blue-800">Topics ({selectedSet.topics.length})</h6>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedSet.topics.map((topic, idx) => (
                              <span key={idx} className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-colors">
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Fields Display - Show All */}
                      {selectedSet.fields && selectedSet.fields.length > 0 && (
                        <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-blue-200 flex-1 min-w-[300px]">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-purple-600">🏢</span>
                            <h6 className="text-sm font-semibold text-blue-800">Fields ({selectedSet.fields.length})</h6>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedSet.fields.map((field, idx) => (
                              <span key={idx} className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors">
                                {field}
                              </span>
                            ))}
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
              {/* Main Configuration Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Left Column - Category & Skills Selection */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-2xl border border-green-100">
                    <div className="mb-4">
                      <h5 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                          <Tag className="w-3 h-3 text-white" />
                        </div>
                        Content Selection
                      </h5>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Category Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          1. Choose Category
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



                      {/* Topic Selection - Only show when category is selected */}
                      {category && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            2. Choose Topic {loadingTopicsSkills && <span className="text-xs text-gray-500 animate-pulse ml-1">(Loading...)</span>}
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
                                {(() => {
                                  const selectedCategoryData = categoriesData.find(cat => cat.name === category);
                                  if (!selectedCategoryData) return null;
                                  
                                  return selectedCategoryData.topics.map((topicData) => (
                                    <option key={topicData.name} value={topicData.name}>
                                      {topicData.name}
                                    </option>
                                  ));
                                })()}
                              </select>
                              {/* Topic Preview */}
                              {(() => {
                                if (!topic) return null;
                                const selectedCategoryData = categoriesData.find(cat => cat.name === category);
                                const selectedTopicData = selectedCategoryData?.topics.find(t => t.name === topic);
                                
                                return selectedTopicData && (
                                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="text-xs text-blue-600 font-medium mb-2">
                                      Topic: {selectedTopicData.name}
                                    </div>
                                    <div className="text-xs text-blue-500 mb-2">
                                      Skills you&apos;ll practice in this topic:
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {selectedTopicData.skills.map((skill, idx) => (
                                        <span 
                                          key={idx} 
                                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                                        >
                                          {skill}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Level & Quiz Settings */}
                <div className="space-y-6">
                  
                  {/* Experience Level */}
                  <div className={`bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-100 ${!topic ? 'opacity-50 pointer-events-none' : ''}`}>
                    <h5 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-3 h-3 text-white" />
                      </div>
                      Experience Level
                    </h5>
                    
                    {(() => {
                      if (!topic) {
                        return (
                          <div className="text-center py-8 text-gray-500">
                            <p className="text-sm">Select a topic to view available levels.</p>
                          </div>
                        );
                      }

                      const selectedCategoryData = categoriesData.find(cat => cat.name === category);
                      const availableLevels = selectedCategoryData?.levels || [];
                      
                      if (availableLevels.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500">
                            <p className="text-sm">No levels available for this topic</p>
                          </div>
                        );
                      }

                      const levelConfig = {
                        junior: { label: "Junior", description: "0-2 years", color: "from-green-500 to-emerald-500", emoji: "🌱" },
                        middle: { label: "Middle", description: "2-5 years", color: "from-blue-500 to-cyan-500", emoji: "🚀" },
                        senior: { label: "Senior", description: "5+ years", color: "from-purple-500 to-pink-500", emoji: "⭐" },
                      };

                      const gridCols = availableLevels.length === 1 ? 'grid-cols-1' : 
                                     availableLevels.length === 2 ? 'grid-cols-2' : 'grid-cols-3';

                      return (
                        <div className={`grid ${gridCols} gap-2`}>
                          {availableLevels.map((levelValue) => {
                            const lvl = levelConfig[levelValue as keyof typeof levelConfig];
                            if (!lvl) return null;
                            
                            return (
                              <button
                                key={levelValue}
                                type="button"
                                onClick={() => setLevel(levelValue)}
                                className={`p-3 rounded-xl transition-all border-2 text-center ${
                                  level === levelValue
                                    ? `bg-gradient-to-r ${lvl.color} text-white shadow-lg border-transparent`
                                    : "bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700"
                                }`}
                              >
                                <div className="text-lg mb-1">{lvl.emoji}</div>
                                <div className="font-semibold text-sm">{lvl.label}</div>
                                <div className="text-xs opacity-90">{lvl.description}</div>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Quiz Settings */}
                  <div className={`bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-2xl border border-orange-100 ${!topic || !level ? 'opacity-50 pointer-events-none' : ''}`}>
                    <h5 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                        <Target className="w-3 h-3 text-white" />
                      </div>
                      Quiz Settings
                    </h5>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { questions: "5", timeLimit: "10", label: "5 questions - 10 minutes", type: "Quick", color: "from-green-400 to-emerald-400" },
                        { questions: "10", timeLimit: "20", label: "10 questions - 20 minutes", type: "Standard", color: "from-blue-400 to-cyan-400" },
                        { questions: "15", timeLimit: "30", label: "15 questions - 30 minutes", type: "Extended", color: "from-purple-400 to-pink-400" },
                        { questions: "20", timeLimit: "40", label: "20 questions - 40 minutes", type: "Comprehensive", color: "from-orange-400 to-red-400" },
                      ].map((setting) => (
                        <div
                          key={setting.questions}
                          onClick={() => setCount(setting.questions)}
                          className={`relative group p-4 rounded-xl cursor-pointer transition-all duration-300 border-2 ${
                            count === setting.questions
                              ? `bg-gradient-to-r ${setting.color.replace("400", "500/10")} border-orange-500/50 shadow-lg`
                              : "bg-white/50 border-gray-200 hover:border-orange-300 hover:bg-orange-50/50"
                          }`}
                        >
                          <div className="text-center">
                            <div className="font-bold text-gray-800 text-sm mb-1">{setting.label}</div>
                            <div className="text-xs text-gray-500">{setting.type}</div>
                          </div>
                          {count === setting.questions && (
                            <div className="absolute top-2 right-2 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
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

          {/* Topic Practice Mode - All in One Screen */}
          {mode === 'topic' && (
            <div className="space-y-8">
              {/* Skills Selection from Preferences */}
              {isPreferencesApplied && userPreferences?.preferredJobRole && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-blue-800">
                        {userPreferences.preferredJobRole.title} Skills
                      </h4>
                      <p className="text-sm text-blue-600">
                        {userPreferences.preferredJobRole.category?.name} • Choose your focus area
                      </p>
                    </div>
                  </div>

                  {/* Experience Level Display */}
                  {level && (
                    <div className="mb-4 p-3 bg-white/60 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        <div>
                          <span className="text-sm font-medium text-blue-800">Experience Level: </span>
                          <span className="text-sm font-semibold text-blue-900">
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* User Skills Selection as Cards */}
                  {userPreferences?.skills && userPreferences.skills.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {userPreferences.skills.map((skillOption, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setCategory(userPreferences.preferredJobRole?.category?.name || '');
                            setSkill(skillOption);
                          }}
                          className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                            skill === skillOption
                              ? 'border-blue-500 bg-blue-500 text-white shadow-lg'
                              : 'border-blue-200 hover:border-blue-400 hover:bg-blue-50 bg-white'
                          }`}
                        >
                          <div className={`p-2 rounded-lg transition-colors ${
                            skill === skillOption
                              ? 'bg-white/20'
                              : 'bg-blue-500 group-hover:bg-blue-600'
                          }`}>
                            <Target className={`w-4 h-4 ${
                              skill === skillOption ? 'text-white' : 'text-white'
                            }`} />
                          </div>
                          <div>
                            <span className={`font-medium ${
                              skill === skillOption ? 'text-white' : 'text-blue-800'
                            }`}>
                              {skillOption}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}



              {/* Quiz Settings - Always visible */}
              <div className={`space-y-4 ${!category || !skill ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-700">Quiz Settings</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-4 max-w-4xl mx-auto justify-center">
                  {[
                    { questions: "5", timeLimit: "10", label: "5 questions - 10 minutes", type: "Quick", color: "from-green-400 to-emerald-400" },
                    { questions: "10", timeLimit: "20", label: "10 questions - 20 minutes", type: "Standard", color: "from-blue-400 to-cyan-400" },
                    { questions: "15", timeLimit: "30", label: "15 questions - 30 minutes", type: "Extended", color: "from-purple-400 to-pink-400" },
                    { questions: "20", timeLimit: "40", label: "20 questions - 40 minutes", type: "Comprehensive", color: "from-orange-400 to-red-400" },
                  ].map((setting) => (
                    <div
                      key={setting.questions}
                      onClick={() => setCount(setting.questions)}
                      className={`relative group p-6 rounded-xl cursor-pointer transition-all duration-300 border-2 ${
                        count === setting.questions
                          ? `bg-gradient-to-r ${setting.color.replace("400", "500/10")} border-orange-500/50 shadow-lg`
                          : "bg-white/50 border-gray-200 hover:border-orange-300 hover:bg-orange-50/50"
                      }`}
                    >
                      <div className="text-center">
                        <div className="font-bold text-gray-800 text-base mb-2">{setting.label}</div>
                        <div className="text-sm text-gray-500">{setting.type}</div>
                      </div>
                      {count === setting.questions && (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                          <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}


        </CardContent>
      </Card>

      {/* Start Button */}
      <div className="text-center">
        <Button
          onClick={() => {
            // Set skill prop to first selected skill for backward compatibility
            if (selectedSkills.length > 0) {
              setSkill(selectedSkills[0]);
            }
            onStart();
          }}
          disabled={loading || (mode === 'company' && !questionSetId) || (mode === 'quick' && (!category || !topic || !level || !count)) || (mode === 'topic' && (!category || !skill))}
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

