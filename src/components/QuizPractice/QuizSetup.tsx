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
  Hash,
  Tag,
  TrendingUp
} from 'lucide-react';

interface QuizSetupProps {
  mode: 'quick' | 'topic' | 'company';
  setMode: (mode: 'quick' | 'topic' | 'company') => void;
  category: string;
  setCategory: (category: string) => void;
  topic: string;
  setTopic: (topic: string) => void;
  tags: string;
  setTags: (tags: string) => void;
  count: string;
  setCount: (count: string) => void;
  level: string;
  setLevel: (level: string) => void;
  questionSetId: string;
  setQuestionSetId: (id: string) => void;
  sets: { id: string; name: string }[];
  facetCats: string[];
  facetTopics: string[];
  facetTags: string[];
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
  tags,
  setTags,
  count,
  setCount,
  level,
  setLevel,
  questionSetId,
  setQuestionSetId,
  sets,
  facetCats,
  facetTopics,
  facetTags,
  onStart,
  loading
}: QuizSetupProps) {
  // State for filtered topics and tags based on selected category
  const [filteredTopics, setFilteredTopics] = useState<string[]>(facetTopics);
  const [filteredTags, setFilteredTags] = useState<string[]>(facetTags);
  const [loadingFilters, setLoadingFilters] = useState(false);

  // Effect to update filtered topics and tags when category changes
  useEffect(() => {
    const fetchFilteredFacets = async () => {
      if (!category) {
        // No category selected, use all topics and tags
        setFilteredTopics(facetTopics);
        setFilteredTags(facetTags);
        return;
      }

      setLoadingFilters(true);
      try {
        const response = await fetch(`/api/quiz/facets/filtered?category=${encodeURIComponent(category)}`);
        if (response.ok) {
          const data = await response.json();
          setFilteredTopics(data.data?.topics || []);
          setFilteredTags(data.data?.tags || []);
          
          // Reset topic and tags if they're not in the filtered list
          if (topic && !data.data?.topics?.includes(topic)) {
            setTopic('');
          }
          if (tags && !data.data?.tags?.includes(tags)) {
            setTags('');
          }
        }
      } catch (error) {
        console.error('Error fetching filtered facets:', error);
        // Fallback to original lists on error
        setFilteredTopics(facetTopics);
        setFilteredTags(facetTags);
      } finally {
        setLoadingFilters(false);
      }
    };

    fetchFilteredFacets();
  }, [category, facetTopics, facetTags, topic, tags, setTopic, setTags]);

  // Update filtered lists when base facets change
  useEffect(() => {
    if (!category) {
      setFilteredTopics(facetTopics);
      setFilteredTags(facetTags);
    }
  }, [facetTopics, facetTags, category]);

  const quickPresets = [
    {
      name: "Frontend Basics",
      icon: <BookOpen className="w-4 h-4" />,
      color: "bg-blue-500",
      onClick: () => {
        setCategory('Frontend');
        setTopic('React');
        setTags('');
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
        setTags('');
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
        setTags('');
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
        setTags('');
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
      title: 'Topic Focus',
      description: 'Focus on specific topics and skills',
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
      <Card className="border-0 shadow-lg">
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
      <Card className="border-0 shadow-lg">
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

          {/* Quick & Topic Mode */}
          {(mode === 'quick' || mode === 'topic') && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-800">Question Filters</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Category
                    {category && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {filteredTopics.length} topics, {filteredTags.length} tags
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
                    <Hash className="w-4 h-4 inline mr-1" />
                    Tags
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    disabled={loadingFilters}
                  >
                    <option value="">Any Tags</option>
                    {filteredTags.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                  {loadingFilters && (
                    <p className="text-xs text-gray-500 mt-1">Loading tags...</p>
                  )}
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Quick Presets */}
          {(mode === 'quick' || mode === 'topic') && (
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
          disabled={loading || (mode === 'company' && !questionSetId)}
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

