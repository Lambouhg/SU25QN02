"use client"

import { useState, useEffect, useCallback } from "react"
import DashboardLayout from "@/components/dashboard/DashboardLayout"
import { Card, CardContent } from "@/components/ui/card"
import {
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  X,
  Search,
  BookOpen,
  Filter,
  Lightbulb,
  Star,
  Eye,
  Grid3X3,
  List,
  Bookmark,
} from "lucide-react"
import toast from "react-hot-toast"
import { useAuth } from "@clerk/nextjs"

interface Question {
  id: string
  stem: string  // Updated from 'question' to 'stem' to match new API
  explanation?: string
  fields?: string[]
  topics?: string[]
  skills?: string[]
  level?: string
  difficulty?: string
  category?: string
  tags?: string[]
  options?: Array<{
    id: string
    text: string
    isCorrect: boolean
    order: number
  }>
}

interface UserPreferences {
  preferredJobRoleId?: string
  preferredLanguage?: string
  autoStartWithPreferences?: boolean
  skills?: string[]  // User's own skills
  preferredJobRole?: {
    id: string
    title: string
    level: string
    category?: {
      name: string
      skills?: string[]
    }
    specialization?: {
      name: string
    }
  }
}

export default function ReviewQuestionPage() {
  const { userId } = useAuth()
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterField, setFilterField] = useState("all")
  const [filterTopic, setFilterTopic] = useState("all")
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])  // New: for multiple topics
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid")
  const [showFlashCards, setShowFlashCards] = useState(false)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [flashCardQuestions, setFlashCardQuestions] = useState<Question[]>([])
  const [isShuffled, setIsShuffled] = useState(false)
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false)
  
  // User preferences state
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null)
  const [isPreferencesApplied, setIsPreferencesApplied] = useState(false)

  // Load user preferences on component mount
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!userId) return
      
      try {
        const response = await fetch('/api/profile/interview-preferences')
        if (response.ok) {
          const preferences = await response.json()
          setUserPreferences(preferences)
          
          // Auto-apply preferences if user has them and autoStartWithPreferences is enabled
          // DISABLED: Let user manually choose filters
          /*
          if (preferences.autoStartWithPreferences && preferences.preferredJobRole) {
            const { preferredJobRole } = preferences
            
              // Map JobCategory.name to field
              if (preferredJobRole.category?.name) {
                setFilterField(preferredJobRole.category.name)
              }
            
            // Map ALL JobCategory.skills to selectedTopics
              // Do NOT auto-select skills, only set filterTopic to "all"
              if (preferredJobRole.category?.skills && preferredJobRole.category.skills.length > 0) {
                setFilterTopic("all")
              }
            
            setIsPreferencesApplied(true)
            toast.success(`Applied preferences for ${preferredJobRole.title} with ${preferredJobRole.category?.skills?.length || 0} skills`, {
              duration: 3000,
              icon: '⚡'
            })
          }
          */
        }
      } catch (error) {
        console.error('Error loading user preferences:', error)
      }
    }

    loadUserPreferences()
  }, [userId])

  // Fetch questions từ question bank mới
  const fetchQuestions = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      
      // Update API parameters to match new API
      if (filterField !== "all") {
        params.append("fields", filterField)
      }
      
      // Use selectedTopics for multiple topic filtering
      if (selectedTopics.length > 0) {
        params.append("topics", selectedTopics.join(","))
      } else if (filterTopic !== "all") {
        params.append("topics", filterTopic)
      }
      
      if (searchQuery) {
        params.append("search", searchQuery)
      }
      
      // Set high page size for review mode
      params.append("pageSize", "100")
      
      // 🔍 DEBUG: Show API call details
      const timestamp = Date.now()
      const apiUrl = `/api/questions?${params.toString()}&_t=${timestamp}`
      console.log('🔍 API Call Details:', {
        url: apiUrl,
        filterField,
        filterTopic,
        selectedTopics,
        searchQuery,
        paramsString: params.toString(),
        timestamp
      })
      
      // Use public API endpoint for review with cache-busting
      const response = await fetch(apiUrl, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        }
      })
      console.log('🔍 API Response Status:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        url: response.url
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('🔍 API Error Response:', errorText)
        throw new Error(`Failed to fetch questions: ${response.status} ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('🔍 API Response Body:', {
        hasData: !!result.data,
        dataLength: result.data?.length || 0,
        totalQuestions: result.total || 0,
        error: result.error
      })
      
      console.log('🔍 Questions loaded:', result.data?.length || 0)
      if (result.data && result.data.length > 0) {
        console.log('🔍 Sample question topics:', result.data.slice(0, 3).map((q: Question) => ({ 
          stem: q.stem.substring(0, 50) + '...', 
          topics: q.topics 
        })))
      }
      setQuestions(result.data || [])
    } catch (error) {
      console.error('🔍 Fetch Questions Error:', error)
      toast.error(`Failed to load questions: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }, [filterField, filterTopic, selectedTopics, searchQuery])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  // Filter questions theo field/topic và search query
  let filteredQuestions = questions
 
  // 🔧 SIMPLIFIED: Since API already filters by category, only apply additional client-side filters if needed
  
  if (filterField !== "all") {
    // Check both fields and category for broader matching
    const beforeFilter = filteredQuestions.length
    filteredQuestions = filteredQuestions.filter((q) => 
      q.fields?.some(field => field.toLowerCase() === filterField.toLowerCase()) ||
      q.category?.toLowerCase() === filterField.toLowerCase()
    )
    console.log('🔍 After field/category filter:', { filterField, before: beforeFilter, after: filteredQuestions.length })
  }
  
  // Filter by selected topics (multiple selection) - Case insensitive
  if (selectedTopics.length > 0) {
    console.log('🔍 Filtering by selected topics:', selectedTopics)
    const beforeTopicFilter = filteredQuestions.length
    filteredQuestions = filteredQuestions.filter((q) => {
      const hasMatchingTopic = q.topics?.some(topic => 
        selectedTopics.some(selectedTopic => 
          topic.toLowerCase() === selectedTopic.toLowerCase()
        )
      )
      const hasMatchingSkill = q.skills?.some(skill => 
        selectedTopics.some(selectedTopic => 
          skill.toLowerCase() === selectedTopic.toLowerCase()
        )
      )
      return hasMatchingTopic || hasMatchingSkill
    })
    console.log('🔍 After topic/skill filter:', { selectedTopics, before: beforeTopicFilter, after: filteredQuestions.length })
  } else if (filterTopic !== "all") {
    // Fallback to single topic filter if no selected topics - Case insensitive
    filteredQuestions = filteredQuestions.filter((q) => 
      q.topics?.some(topic => topic.toLowerCase() === filterTopic.toLowerCase()) ||
      q.skills?.some(skill => skill.toLowerCase() === filterTopic.toLowerCase())
    )
  }
  
  if (searchQuery) {
    filteredQuestions = filteredQuestions.filter(
      (q) =>
        q.stem.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.explanation?.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }
  if (showBookmarkedOnly) {
    filteredQuestions = filteredQuestions.filter((q) => bookmarkedQuestions.has(q.id))
  }

  // Lấy danh sách field và topic
  const fields = Array.from(new Set(questions.flatMap((q) => q.fields || [])))
  const topics =
    filterField !== "all"
      ? Array.from(new Set(questions.filter((q) => q.fields?.includes(filterField)).flatMap((q) => q.topics || [])))
      : []

  // Flash Card Functions
  const shuffleCards = () => {
    const shuffled = [...flashCardQuestions].sort(() => Math.random() - 0.5)
    setFlashCardQuestions(shuffled)
    setCurrentCardIndex(0)
    setIsFlipped(false)
    setIsShuffled(true)
    toast.success("Cards shuffled! 🔀")
  }

  const nextCard = () => {
    if (currentCardIndex < flashCardQuestions.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
      setIsFlipped(false)
    }
  }

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1)
      setIsFlipped(false)
    }
  }

  const flipCard = () => {
    setIsFlipped(!isFlipped)
  }

  const closeFlashCards = () => {
    setShowFlashCards(false)
    setCurrentCardIndex(0)
    setIsFlipped(false)
    setIsShuffled(false)
  }

  const toggleBookmark = (questionId: string) => {
    const newBookmarks = new Set(bookmarkedQuestions)
    if (newBookmarks.has(questionId)) {
      newBookmarks.delete(questionId)
      toast.success("Removed from bookmarks")
    } else {
      newBookmarks.add(questionId)
      toast.success("Added to bookmarks ⭐")
    }
    setBookmarkedQuestions(newBookmarks)
  }

  const applyUserPreferences = () => {
    if (userPreferences?.preferredJobRole) {
      const { preferredJobRole } = userPreferences
      
      // 🔧 FIXED: Now use category filter since API has field mapping
      if (preferredJobRole.category?.name) {
        setFilterField(preferredJobRole.category.name) // Use actual category name
      } else {
        setFilterField("all") // Fallback to all if no category
      }
      
      // Auto-select user's skills to show relevant questions immediately
      setFilterTopic("all")
      if (userPreferences.skills && userPreferences.skills.length > 0) {
        setSelectedTopics(userPreferences.skills) // Auto-select user's skills
        console.log('🔍 Auto-selected user skills:', userPreferences.skills)
      } else {
        setSelectedTopics([]) // No skills to select
      }
      
      setIsPreferencesApplied(true)
      console.log('🔍 Applied preferences (FIXED - with category filter):', {
        originalCategory: preferredJobRole.category?.name,
        filterField: preferredJobRole.category?.name || "all",
        filterTopic: "all",
        selectedTopics: userPreferences.skills || [],
        userSkillsCount: userPreferences.skills?.length || 0
      })
      toast.success(`Applied category and skills filter (${preferredJobRole.category?.name || 'all'} + ${userPreferences.skills?.length || 0} skills).`, {
        duration: 4000,
        icon: '⚡'
      })
    }
  }

  const toggleSkillFilter = (skill: string) => {
    setSelectedTopics(prev => {
      // Case insensitive comparison
      const isSelected = prev.some(s => s.toLowerCase() === skill.toLowerCase())
      if (isSelected) {
        // Remove skill (case insensitive)
        const newSelected = prev.filter(s => s.toLowerCase() !== skill.toLowerCase())
        toast.success(`Removed ${skill} filter`, { duration: 2000 })
        return newSelected
      } else {
        // Add skill
        const newSelected = [...prev, skill]
        toast.success(`Added ${skill} filter`, { duration: 2000 })
        return newSelected
      }
    })
  }

  const clearAllFilters = () => {
    setFilterField("all")
    setFilterTopic("all")
    setSelectedTopics([])
    setSearchQuery("")
    setIsPreferencesApplied(false)
    toast.success("Filters cleared")
  }



  const currentCard = flashCardQuestions[currentCardIndex]

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
              <BookOpen className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-xl font-semibold text-gray-700 mb-2">Loading Knowledge Base...</p>
            <p className="text-sm text-gray-500">Preparing your study materials</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div >
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Knowledge Explorer</h1>
                <p className="text-gray-600">Discover and study question explanations at your own pace</p>
              </div>
            </div>
          </div>

          {/* Search and Filter Section */}
          <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="🔍 Search questions or explanations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                />
              </div>

              {/* Preferences Applied Indicator */}
              {isPreferencesApplied && userPreferences?.preferredJobRole && (
                <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <Star className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-blue-900">
                          Applied Your Preferences
                        </h4>
                        <p className="text-xs text-blue-700">
                          Skills-based filtering applied
                          {userPreferences.skills && userPreferences.skills.length > 0 && (
                            <>
                              <br />
                              <span>Your Skills: {userPreferences.skills.length} available</span>
                            </>
                          )}
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
                  
                  {/* User Skills Display - Use user's actual skills instead of category skills */}
                  {isPreferencesApplied && (
                    <div className="space-y-2">
                      {userPreferences?.skills && userPreferences.skills.length > 0 ? (
                        <>
                          <div className="text-xs font-medium text-blue-800 mb-2">
                            Your Skills - Click to filter: ({selectedTopics.length} selected)
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {userPreferences.skills.map((skill, index) => {
                              // Case insensitive selection check
                              const isSelected = selectedTopics.some(s => s.toLowerCase() === skill.toLowerCase())
                              return (
                                <button
                                  key={index}
                                  onClick={() => toggleSkillFilter(skill)}
                                  className={`px-3 py-1 text-xs font-medium rounded-full border transition-all hover:shadow-md ${
                                    isSelected
                                      ? 'bg-blue-500 text-white border-blue-600 shadow-sm'
                                      : 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200'
                                  }`}
                                >
                                  {skill}
                                  {isSelected && ' ✓'}
                                </button>
                              )
                            })}
                          </div>
                          {selectedTopics.length > 0 && (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-blue-700">
                                Filtering by {selectedTopics.length} skill(s)
                              </span>
                              <button
                                onClick={() => setSelectedTopics([])}
                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                              >
                                Clear skill filters
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="text-xs font-medium text-yellow-800 mb-1">
                            No Skills Found
                          </div>
                          <div className="text-xs text-yellow-700">
                            Add skills to your profile to enable skill-based filtering.
                            <br />
                            <button 
                              onClick={() => window.location.href = '/profile'}
                              className="text-yellow-800 hover:text-yellow-900 underline mt-1 inline-block"
                            >
                              Go to Profile →
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
                  >
                    <Filter className="w-4 h-4" />
                    Filters {showFilters ? "▲" : "▼"}
                  </button>
                  
                  {/* Apply Preferences Button */}
                  {userPreferences?.preferredJobRole && !isPreferencesApplied && (
                    <button
                      onClick={applyUserPreferences}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-all"
                    >
                      <Star className="w-4 h-4" />
                      Apply My Preferences
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowBookmarkedOnly((v) => !v)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${showBookmarkedOnly ? "bg-yellow-100 text-yellow-700 border border-yellow-400" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    <Star className="w-4 h-4" />
                    {showBookmarkedOnly ? "Bookmarked Only" : "Show Bookmarked"}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Specializations</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setFilterField("all")
                          setFilterTopic("all")
                        }}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${filterField === "all" ? "bg-blue-600 text-white" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"}`}
                      >
                        All Specializations
                      </button>
                      {fields.map((field) => (
                        <button
                          key={field}
                          onClick={() => {
                            setFilterField(field)
                            setFilterTopic("all")
                          }}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${filterField === field ? "bg-blue-600 text-white" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"}`}
                        >
                          {field}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filterField !== "all" && topics.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Topics</label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setFilterTopic("all")}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${filterTopic === "all" ? "bg-purple-600 text-white" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"}`}
                        >
                          All Topics
                        </button>
                        {topics.map((topic) => (
                          <button
                            key={topic}
                            onClick={() => setFilterTopic(topic)}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${filterTopic === topic ? "bg-purple-600 text-white" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"}`}
                          >
                            {topic}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={clearAllFilters}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-all"
                    >
                      Clear all filters
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={() => {
                if (filteredQuestions.length === 0) {
                  toast.error("No questions to study!")
                  return
                }
                setFlashCardQuestions(filteredQuestions)
                setCurrentCardIndex(0)
                setIsFlipped(false)
                setShowFlashCards(true)
                toast.success(`Starting flashcards with ${filteredQuestions.length} questions`)
              }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:scale-105 transition-all"
            >
              <CreditCard className="w-5 h-5" />
              {(() => {
                const isAll = filterField === "all" && filterTopic === "all" && !searchQuery && !showBookmarkedOnly;
                return isAll
                  ? "Start Flashcards (All)"
                  : `Start Flashcards (All Filtered ${filteredQuestions.length})`;
              })()}
            </button>

            <button
              onClick={() => window.location.href = "/quiz"}
              className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white font-medium rounded-xl border border-green-700 hover:bg-green-700 transition-all"
            >
              <List className="w-4 h-4" />
              Start New Quiz
            </button>

            <button
              onClick={() => window.location.href = "/avatar-interview"}
              className="flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white font-medium rounded-xl border border-indigo-700 hover:bg-indigo-700 transition-all"
            >
              <BookOpen className="w-4 h-4" />
              Start Interview with AI
            </button>
          </div>

          {/* Questions Display */}
          {filteredQuestions.length === 0 ? (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Questions Found</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery
                    ? "Try adjusting your search terms or filters"
                    : "Select a field and topic to view questions"}
                </p>
                {(filterField !== "all" || filterTopic !== "all" || searchQuery) && (
                  <button
                    onClick={clearAllFilters}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                  >
                    Clear Filters
                  </button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "space-y-6"}>
              {filteredQuestions.map((question, index) => (
                <Card
                  key={question.id || index}
                  className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group"
                >
                  <CardContent className="p-6">
                    {/* Question Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                            {index + 1}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {question.fields?.map((field) => (
                              <span
                                key={field}
                                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full border border-blue-200"
                              >
                                {field}
                              </span>
                            ))}
                            {question.topics?.map((topic) => (
                              <span
                                key={topic}
                                className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full border border-purple-200"
                              >
                                {topic}
                              </span>
                            ))}
                            {question.skills?.map((skill) => (
                              <span
                                key={skill}
                                className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full border border-green-200"
                              >
                                {skill}
                              </span>
                            ))}
                            {question.level && (
                              <span
                                className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full border border-orange-200"
                              >
                                {question.level}
                              </span>
                            )}
                            {question.difficulty && (
                              <span
                                className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full border border-red-200"
                              >
                                {question.difficulty}
                              </span>
                            )}
                            {question.category && (
                              <span
                                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full border border-gray-200"
                              >
                                {question.category}
                              </span>
                            )}
                          </div>
                        </div>
                        <h3 className="font-semibold text-gray-800 mb-3 leading-relaxed">{question.stem}</h3>
                      </div>
                      <button
                        onClick={() => toggleBookmark(question.id)}
                        className={`p-2 rounded-lg transition-all ${bookmarkedQuestions.has(question.id) ? "bg-yellow-100 text-yellow-600" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}
                      >
                        <Bookmark className={`w-4 h-4 ${bookmarkedQuestions.has(question.id) ? "fill-current" : ""}`} />
                      </button>
                    </div>

                    {/* Explanation */}
                    {question.explanation && (
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Explanation</span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{question.explanation}</p>
                      </div>
                    )}

                    {!question.explanation && (
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                        <p className="text-sm text-gray-500">No explanation available for this question</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Flash Cards Modal */}
          {showFlashCards && currentCard && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Flashcard Study Mode</h2>
                      <p className="text-sm text-gray-600">
                        Card {currentCardIndex + 1} of {flashCardQuestions.length}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={shuffleCards}
                      className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all duration-300"
                      title="Shuffle Cards"
                    >
                      <Shuffle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={closeFlashCards}
                      className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-300"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="px-6 py-3 bg-gray-50">
                  <div className="flex justify-between text-xs text-gray-600 mb-2">
                    <span>Study Progress</span>
                    <span>{Math.round(((currentCardIndex + 1) / flashCardQuestions.length) * 100)}% Complete</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${((currentCardIndex + 1) / flashCardQuestions.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-8">
                  <div className="flex items-center gap-2 mb-6 flex-wrap">
                    {currentCard.fields?.map((field) => (
                      <span
                        key={field}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full border border-blue-200"
                      >
                        📂 {field}
                      </span>
                    ))}
                    {currentCard.topics?.map((topic) => (
                      <span
                        key={topic}
                        className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full border border-purple-200"
                      >
                        🎯 {topic}
                      </span>
                    ))}
                    {currentCard.skills?.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full border border-green-200"
                      >
                        🔧 {skill}
                      </span>
                    ))}
                    {currentCard.level && (
                      <span
                        className="px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full border border-orange-200"
                      >
                        📊 {currentCard.level}
                      </span>
                    )}
                    {currentCard.difficulty && (
                      <span
                        className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full border border-red-200"
                      >
                        🎚️ {currentCard.difficulty}
                      </span>
                    )}
                  </div>

                  <div
                    className={`relative w-full h-80 cursor-pointer transition-transform duration-700 transform-style-preserve-3d ${isFlipped ? "rotate-y-180" : ""}`}
                    onClick={flipCard}
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    {/* Front Side - Question */}
                    <div
                      className={`absolute inset-0 w-full h-full backface-hidden rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col items-center justify-center p-8 ${isFlipped ? "rotate-y-180" : ""}`}
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      <div className="text-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 leading-relaxed">
                          {currentCard.stem}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 bg-white/50 px-4 py-2 rounded-full">
                        <Eye className="w-4 h-4" />
                        Click to reveal explanation
                      </div>
                    </div>

                    {/* Back Side - Explanation */}
                    <div
                      className={`absolute inset-0 w-full h-full backface-hidden rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 p-8 rotate-y-180 ${isFlipped ? "" : "rotate-y-180"}`}
                      style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                    >
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Lightbulb className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="text-lg font-semibold text-purple-800 mb-4">💡 Explanation</h4>
                        <p className="text-base text-gray-700 leading-relaxed max-w-2xl">
                          {currentCard.explanation || "No explanation available for this question."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={prevCard}
                    disabled={currentCardIndex === 0}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${currentCardIndex === 0 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-sm"}`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full border">
                      {currentCardIndex + 1} / {flashCardQuestions.length}
                    </span>
                    {isShuffled && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full border border-blue-200">
                        🔀 Shuffled
                      </span>
                    )}
                  </div>

                  <button
                    onClick={nextCard}
                    disabled={currentCardIndex === flashCardQuestions.length - 1}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${currentCardIndex === flashCardQuestions.length - 1 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg"}`}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
