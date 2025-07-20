"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Brain,
  Zap,
  Users,
  Trophy,
  Clock,
  Target,
  Sparkles,
  ArrowRight,
  Play,
  BarChart3,
  CheckCircle2,
  Timer,
  Award,
  TrendingUp,
  Rocket,
  BookOpen,
  Lightbulb,
} from "lucide-react"
import type { QuizConfig } from "./QuizPanel"

interface QuizStartProps {
  config: QuizConfig
  fields: string[]
  topics: string[]
  onChange: (config: QuizConfig) => void
  onStart: () => void
  isLoading: boolean
  error: string | null
}

export default function QuizStart({ config, fields, topics, onChange, onStart, isLoading, error }: QuizStartProps) {
  const [isFieldOpen, setIsFieldOpen] = useState(false)
  const [isTopicOpen, setIsTopicOpen] = useState(false)
  const [fieldInputValue, setFieldInputValue] = useState(config.field)
  const [topicInputValue, setTopicInputValue] = useState(config.topic)
  const fieldDropdownRef = useRef<HTMLDivElement>(null)
  const topicDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fieldDropdownRef.current && !fieldDropdownRef.current.contains(event.target as Node)) {
        setIsFieldOpen(false)
      }
      if (topicDropdownRef.current && !topicDropdownRef.current.contains(event.target as Node)) {
        setIsTopicOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredFields = fields.filter((field) => field.toLowerCase().includes(fieldInputValue.toLowerCase()))

  const filteredTopics = topics.filter((topic) => topic.toLowerCase().includes(topicInputValue.toLowerCase()))

  const handleFieldSelect = (field: string) => {
    setFieldInputValue(field)
    onChange({ ...config, field: field })
    setIsFieldOpen(false)
  }

  const handleTopicSelect = (topic: string) => {
    setTopicInputValue(topic)
    onChange({ ...config, topic: topic })
    setIsTopicOpen(false)
  }

  const experienceLevels = [
    { value: "junior", label: "Junior", icon: "🔥", description: "0-2 năm kinh nghiệm" },
    { value: "middle", label: "Middle", icon: "⚡", description: "2-5 năm kinh nghiệm" },
    { value: "senior", label: "Senior", icon: "🚀", description: "5+ năm kinh nghiệm" },
  ]

  const questionOptions = [
    { value: 5, label: "5 câu hỏi", duration: "~5 phút", icon: "⚡" },
    { value: 10, label: "10 câu hỏi", duration: "~10 phút", icon: "🎯" },
    { value: 15, label: "15 câu hỏi", duration: "~15 phút", icon: "🔥" },
    { value: 20, label: "20 câu hỏi", duration: "~20 phút", icon: "🏆" },
  ]

  const timeLimitOptions = [
    { value: 10, label: "10 phút", type: "Nhanh", icon: "⚡", color: "from-green-400 to-emerald-400" },
    { value: 15, label: "15 phút", type: "Tiêu chuẩn", icon: "🎯", color: "from-blue-400 to-cyan-400" },
    { value: 30, label: "30 phút", type: "Chi tiết", icon: "🔥", color: "from-purple-400 to-pink-400" },
    { value: 45, label: "45 phút", type: "Toàn diện", icon: "🏆", color: "from-orange-400 to-red-400" },
  ]

  const isFormValid = config.field.trim() !== "" && config.topic.trim() !== ""

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/25">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center animate-bounce">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Interview Quiz
              </h1>
              <p className="text-purple-600 font-medium">Smart AI Configuration</p>
            </div>
          </div>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Chuẩn bị cho cuộc phỏng vấn với AI thông minh và nhà tuyển dụng chuyên nghiệp
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">50K+</div>
              <div className="text-sm text-gray-500">Phỏng vấn</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">98%</div>
              <div className="text-sm text-gray-500">Thành công</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">4.9★</div>
              <div className="text-sm text-gray-500">Đánh giá</div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Quiz Configuration</h2>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">{error}</div>
                )}

                <div className="space-y-8">
                  {/* Field */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-white" />
                      </div>
                      <Label htmlFor="field" className="text-lg font-semibold text-gray-700">
                        Field
                      </Label>
                    </div>
                    <div className="relative" ref={fieldDropdownRef}>
                      <Input
                        id="field"
                        placeholder="Type or select a field"
                        value={fieldInputValue}
                        onChange={(e) => {
                          setFieldInputValue(e.target.value)
                          onChange({ ...config, field: e.target.value })
                          setIsFieldOpen(true)
                        }}
                        onFocus={() => setIsFieldOpen(true)}
                        className="h-14 text-base border-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl bg-white/70 backdrop-blur-sm shadow-lg"
                      />
                      {config.field && (
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        </div>
                      )}
                      {isFieldOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white/95 backdrop-blur-lg border border-white/50 rounded-xl shadow-2xl max-h-60 overflow-auto">
                          {filteredFields.length > 0 ? (
                            filteredFields.map((field) => (
                              <div
                                key={field}
                                className="px-4 py-3 hover:bg-purple-50 cursor-pointer transition-colors"
                                onClick={() => handleFieldSelect(field)}
                              >
                                {field}
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-gray-500">No fields found</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Topic */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                        <Lightbulb className="w-4 h-4 text-white" />
                      </div>
                      <Label htmlFor="topic" className="text-lg font-semibold text-gray-700">
                        Topic
                      </Label>
                    </div>
                    <div className="relative" ref={topicDropdownRef}>
                      <Input
                        id="topic"
                        placeholder="Type or select a topic"
                        value={topicInputValue}
                        onChange={(e) => {
                          setTopicInputValue(e.target.value)
                          onChange({ ...config, topic: e.target.value })
                          setIsTopicOpen(true)
                        }}
                        onFocus={() => setIsTopicOpen(true)}
                        className="h-14 text-base border-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl bg-white/70 backdrop-blur-sm shadow-lg"
                      />
                      {config.topic && (
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        </div>
                      )}
                      {isTopicOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white/95 backdrop-blur-lg border border-white/50 rounded-xl shadow-2xl max-h-60 overflow-auto">
                          {filteredTopics.length > 0 ? (
                            filteredTopics.map((topic) => (
                              <div
                                key={topic}
                                className="px-4 py-3 hover:bg-purple-50 cursor-pointer transition-colors"
                                onClick={() => handleTopicSelect(topic)}
                              >
                                {topic}
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-gray-500">No topics found</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Experience Level */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-white" />
                      </div>
                      <Label htmlFor="experience" className="text-lg font-semibold text-gray-700">
                        Experience Level
                      </Label>
                    </div>
                    <div className="flex flex-col gap-4">
                      {experienceLevels.map((level) => {
                        const selected = config.level === level.value;
                        return (
                          <button
                            key={level.value}
                            type="button"
                            onClick={() => onChange({ ...config, level: level.value })}
                            className={`
                              flex items-center gap-3 px-4 py-3 rounded-xl transition
                              ${selected
                                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                                : "bg-gray-100 text-gray-700 opacity-60 hover:opacity-100"}
                              border-2 ${selected ? "border-purple-500" : "border-transparent"}
                              focus:outline-none
                            `}
                          >
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 text-xl">
                              {level.icon}
                            </span>
                            <div className="flex flex-col text-left">
                              <span className="font-semibold">{level.label}</span>
                              <span className="text-xs">{level.description}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Number of Questions & Time Limit */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Number of Questions */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                          <Target className="w-4 h-4 text-white" />
                        </div>
                        <Label className="text-lg font-semibold text-gray-700">Number of Questions (1-50)</Label>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {questionOptions.map((option) => (
                          <div
                            key={option.value}
                            onClick={() => onChange({ ...config, questionCount: option.value })}
                            className={`relative group p-4 rounded-xl cursor-pointer transition-all duration-300 border-2 ${
                              config.questionCount === option.value
                                ? "bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/50 shadow-lg shadow-orange-500/20"
                                : "bg-white/50 border-gray-200 hover:border-orange-300 hover:bg-orange-50/50"
                            }`}
                          >
                            <div className="text-center">
                              <div className="text-2xl mb-2">{option.icon}</div>
                              <div className="font-semibold text-gray-800">{option.label}</div>
                              <div className="text-xs text-gray-500">{option.duration}</div>
                            </div>
                            {config.questionCount === option.value && (
                              <div className="absolute top-2 right-2 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Time Limit */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center">
                          <Timer className="w-4 h-4 text-white" />
                        </div>
                        <Label className="text-lg font-semibold text-gray-700">Time Limit (minutes, 1-120)</Label>
                      </div>

                      <div className="space-y-3">
                        {timeLimitOptions.map((option) => (
                          <div
                            key={option.value}
                            onClick={() => onChange({ ...config, timeLimit: option.value })}
                            className={`group p-4 rounded-xl cursor-pointer transition-all duration-300 border-2 ${
                              config.timeLimit === option.value
                                ? "bg-gradient-to-r " +
                                  option.color.replace("400", "500/10") +
                                  " border-indigo-500/50 shadow-lg shadow-indigo-500/20"
                                : "bg-white/50 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="text-xl">{option.icon}</div>
                                <div>
                                  <div className="font-semibold text-gray-800">{option.label}</div>
                                  <div className="text-xs text-gray-500">{option.type}</div>
                                </div>
                              </div>
                              <Clock className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                            </div>
                            {config.timeLimit === option.value && (
                              <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div className={`h-full bg-gradient-to-r ${option.color} rounded-full animate-pulse`} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Start Button */}
                  <div className="pt-6">
                    <div className="relative inline-block w-full">
                      {/* Glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur-xl opacity-30 animate-pulse" />

                      <button
                        onClick={onStart}
                        disabled={!isFormValid || isLoading}
                        className="relative w-full h-16 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold text-lg text-white shadow-2xl shadow-purple-500/25 transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 border border-white/20"
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center gap-3">
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Đang khởi tạo quiz...</span>
                            <Rocket className="w-6 h-6 animate-bounce" />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-3">
                            <Play className="w-6 h-6" />
                            <span>Start Quiz</span>
                            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                          </div>
                        )}

                        {/* Animated border */}
                        <div className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 bg-clip-border animate-pulse opacity-50" />
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Features */}
            <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-800">AI Features</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0 animate-pulse" />
                    <div>
                      <div className="text-sm font-medium text-gray-800">AI-Powered Experience</div>
                      <div className="text-xs text-gray-600">Phân tích thông minh real-time</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0 animate-pulse" />
                    <div>
                      <div className="text-sm font-medium text-gray-800">Secure & Private</div>
                      <div className="text-xs text-gray-600">Bảo mật và riêng tư tuyệt đối</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0 animate-pulse" />
                    <div>
                      <div className="text-sm font-medium text-gray-800">Detailed Feedback</div>
                      <div className="text-xs text-gray-600">Phản hồi chi tiết và cải thiện</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Live Stats */}
            <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-800">Thống kê thời gian thực</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Tỷ lệ thành công</span>
                      <span className="text-green-600 font-medium">98.7%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse"
                        style={{ width: "98.7%" }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Điểm trung bình</span>
                      <span className="text-blue-600 font-medium">8.9/10</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-pulse"
                        style={{ width: "89%" }}
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Người dùng hoạt động</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium text-gray-800">2,647</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Achievements */}
            <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-800">Hướng dẫn phỏng vấn</h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                    <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-sm">
                      <div className="text-gray-800 font-medium">Đọc kỹ câu hỏi</div>
                      <div className="text-gray-600 text-xs">Trước khi trả lời</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-sm">
                      <div className="text-gray-800 font-medium">Quản lý thời gian</div>
                      <div className="text-gray-600 text-xs">Hợp lý cho mỗi câu</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
