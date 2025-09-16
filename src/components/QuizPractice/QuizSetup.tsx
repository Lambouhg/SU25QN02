"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  ChevronLeft
} from 'lucide-react';

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
  questionSetId: string;
  setQuestionSetId: (id: string) => void;
  sets: { id: string; name: string }[];
  facetCats: string[];
  facetTopics: string[];
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
  questionSetId,
  setQuestionSetId,
  sets,
  facetCats,
  facetTopics,
  onStart,
  loading
}: QuizSetupProps) {
  // State for filtered topics based on selected category
  const [filteredTopics, setFilteredTopics] = useState<string[]>(facetTopics);
  const [loadingFilters, setLoadingFilters] = useState(false);
  
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

  // Effect to update filtered topics when category changes
  useEffect(() => {
    const fetchFilteredFacets = async () => {
      if (!category) {
        // No category selected, use all topics
        setFilteredTopics(facetTopics);
        return;
      }

      setLoadingFilters(true);
      try {
        const response = await fetch(`/api/quiz/facets/filtered?category=${encodeURIComponent(category)}`);
        if (response.ok) {
          const data = await response.json();
          setFilteredTopics(data.data?.topics || []);
          
          // Reset topic if it's not in the filtered list
          if (topic && !data.data?.topics?.includes(topic)) {
            setTopic('');
          }
        }
      } catch (error) {
        console.error('Error fetching filtered facets:', error);
        // Fallback to original list on error
        setFilteredTopics(facetTopics);
      } finally {
        setLoadingFilters(false);
      }
    };

    fetchFilteredFacets();
  }, [category, facetTopics, topic, setTopic]);

  // Update filtered lists when base facets change
  useEffect(() => {
    if (!category) {
      setFilteredTopics(facetTopics);
    }
  }, [facetTopics, category]);

  // Fetch user progress for progression system
  const fetchUserProgress = async (category: string, topic: string) => {
    if (!category || !topic) return;
    
    setLoadingProgress(true);
    try {
      const response = await fetch(`/api/quiz/progress?category=${encodeURIComponent(category)}&topic=${encodeURIComponent(topic)}`);
      if (response.ok) {
        const data = await response.json();
        const progressKey = `${category}-${topic}`;
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
    if (mode === 'topic' && category && topic) {
      fetchUserProgress(category, topic);
    }
  }, [mode, category, topic]);

  const quickPresets = [
    {
      name: "Frontend Basics",
      icon: <BookOpen className="w-4 h-4" />,
      color: "bg-blue-500",
      onClick: () => {
        setCategory('Frontend');
        setTopic('React');
        setLevel('junior');
        setCount('10');
      }
    },
    {
      name: "Backend API",
      icon: <Target className="w-4 h-4" />,
      color: "bg-green-500",
      onClick: () => {
        setCategory('Backend');
        setTopic('HTTP');
        setLevel('junior');
        setCount('10');
      }
    },
    {
      name: "DevOps",
      icon: <Building2 className="w-4 h-4" />,
      color: "bg-purple-500",
      onClick: () => {
        setCategory('DevOps');
        setTopic('');
        setLevel('junior');
        setCount('10');
      }
    },
    {
      name: "Quick Test",
      icon: <Zap className="w-4 h-4" />,
      color: "bg-orange-500",
      onClick: () => {
        setCategory('');
        setTopic('');
        setLevel('');
        setCount('5');
      }
    }
  ];

  const modeCards: Array<{
    id: 'quick' | 'topic' | 'company';
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
  }> = [
    {
      id: 'company',
      title: 'Company Sets',
      description: 'Practice with curated question sets',
      icon: <Building2 className="w-6 h-6" />,
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'quick',
      title: 'Quick Practice',
      description: 'Random questions for quick review',
      icon: <Zap className="w-6 h-6" />,
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'topic',
      title: 'Progressive Training',
      description: 'Unlock levels by mastering topics',
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
                <p className={`text-sm ${mode === modeCard.id ? 'text-white/90' : 'text-gray-600'}`}>
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
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-800">Question Filters</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Category
                    {category && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {filteredTopics.length} topics available
                      </Badge>
                    )}
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">Any Category</option>
                    {facetCats.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <BookOpen className="w-4 h-4 inline mr-1" />
                    Topic
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    disabled={loadingFilters}
                  >
                    <option value="">Any Topic</option>
                    {filteredTopics.map((top) => (
                      <option key={top} value={top}>
                        {top}
                      </option>
                    ))}
                  </select>
                  {loadingFilters && (
                    <p className="text-xs text-gray-500 mt-1">Loading topics...</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <TrendingUp className="w-4 h-4 inline mr-1" />
                    Level
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                  >
                    <option value="">Any Level</option>
                    <option value="junior">Junior</option>
                    <option value="middle">Middle</option>
                    <option value="senior">Senior</option>
                  </select>
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Number of Questions
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    placeholder="Enter number of questions"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Progressive Training Mode */}
          {mode === 'topic' && (
            <div className="space-y-8">
              {/* Step 1: Select Category and Topic */}
              {(!category || !topic) && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h4 className="text-xl font-bold text-gray-800 mb-2">Step 1: Choose Your Learning Path</h4>
                    <p className="text-gray-600 text-sm">Select specialization and topic for your practice</p>
                  </div>

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
                          category: "Frontend Development", 
                          topic: "React", 
                          icon: <BookOpen className="w-4 h-4" />, 
                          color: "bg-blue-500" 
                        },
                        { 
                          name: "Backend Development", 
                          category: "Backend Development", 
                          topic: "APIs", 
                          icon: <Target className="w-4 h-4" />, 
                          color: "bg-green-500" 
                        },
                        { 
                          name: "Cloud", 
                          category: "Cloud", 
                          topic: "AWS", 
                          icon: <Building2 className="w-4 h-4" />, 
                          color: "bg-purple-500" 
                        },
                        { 
                          name: "DevOps", 
                          category: "DevOps", 
                          topic: "Docker", 
                          icon: <Clock className="w-4 h-4" />, 
                          color: "bg-orange-500" 
                        },
                        { 
                          name: "Mobile", 
                          category: "Mobile", 
                          topic: "React Native", 
                          icon: <TrendingUp className="w-4 h-4" />, 
                          color: "bg-pink-500" 
                        },
                        { 
                          name: "Database", 
                          category: "Database", 
                          topic: "RDBMS", 
                          icon: <Tag className="w-4 h-4" />, 
                          color: "bg-cyan-500" 
                        }
                      ].map((preset, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setCategory(preset.category);
                            setTopic(preset.topic);
                          }}
                          className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-200 group"
                        >
                          <div className={`p-2 rounded-lg ${preset.color} group-hover:scale-110 transition-transform duration-200`}>
                            {preset.icon}
                          </div>
                          <div className="text-left flex-1">
                            <div className="font-semibold text-gray-800 text-sm">{preset.name}</div>
                            <div className="text-xs text-gray-500">{preset.topic}</div>
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
                          Specialization
                          {category && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {filteredTopics.length} topics available
                            </Badge>
                          )}
                        </label>
                        <select
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        >
                          <option value="">Select Specialization</option>
                          {facetCats.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <BookOpen className="w-4 h-4 inline mr-1" />
                          Topic
                        </label>
                        <select
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          disabled={!category || loadingFilters}
                        >
                          <option value="">Select Topic</option>
                          {filteredTopics.map((top) => (
                            <option key={top} value={top}>
                              {top}
                            </option>
                          ))}
                        </select>
                        {loadingFilters && (
                          <p className="text-xs text-gray-500 mt-1">Loading topics...</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Level Selection and Quiz Settings */}
              {category && topic && (
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
                      <span className="text-sm font-medium text-gray-600">Topic:</span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        {topic}
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
                          const progressKey = `${category}-${topic}`;
                          const levelData = userProgress[progressKey]?.levels[lvl.value as keyof typeof userProgress[typeof progressKey]['levels']];
                          const isUnlocked = lvl.value === 'junior' || (levelData?.unlocked ?? false);
                          const bestScore = levelData?.bestScore ?? 0;
                          let tooltip = "";

                          if (lvl.value === "middle" && !isUnlocked) {
                            tooltip = "Unlock by scoring ≥ 9 in Junior quizzes for this topic.";
                          }
                          if (lvl.value === "senior" && !isUnlocked) {
                            tooltip = "Unlock by scoring ≥ 9 in Middle quizzes for this topic.";
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
                    <Button variant="outline" onClick={() => setTopic('')} className="flex items-center gap-2 text-sm">
                      <ChevronLeft className="w-4 h-4" />
                      Back to topic selection
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Presets */}
          {mode === 'quick' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">Quick Presets</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {quickPresets.map((preset, index) => (
                  <button
                    key={index}
                    onClick={preset.onClick}
                    className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200"
                  >
                    <div className={`p-1 rounded ${preset.color}`}>
                      {preset.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Start Button */}
      <div className="text-center">
        <Button
          onClick={onStart}
          disabled={loading || (mode === 'company' && !questionSetId) || (mode === 'quick' && !count) || (mode === 'topic' && (!category || !topic || !level))}
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

