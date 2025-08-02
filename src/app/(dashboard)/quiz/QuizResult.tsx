"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "react-hot-toast"
import { Trophy, Clock, Target, CheckCircle2, XCircle, BookOpen, RotateCcw, History, Bookmark, Brain, Sparkles, Award, TrendingUp,} from "lucide-react"
import type { Quiz, Question } from "./QuizPanel"

// Extended types for quiz results
interface QuestionResult extends Question {
  isCorrect?: boolean;
  userSelectedIndexes?: number[];
}

interface QuizResultData extends Quiz {
  questions: QuestionResult[];
}

interface QuizResultProps {
  quiz: QuizResultData
  onNewQuiz: () => void
  onViewProfile?: () => void // made optional for compatibility
}

export default function QuizResult({ quiz, onNewQuiz }: QuizResultProps) {
  const router = useRouter()
  const [savedQuestionIds, setSavedQuestionIds] = useState<string[]>([])
  const [showSaveWarning, setShowSaveWarning] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)

  useEffect(() => {
    const fetchSavedQuestions = async () => {
      try {
        const response = await fetch("/api/users/saved-questions")
        if (!response.ok) throw new Error("Failed to fetch saved questions")
        const data = await response.json()
        setSavedQuestionIds(data.map((q: { id: string }) => q.id))
      } catch (error) {
        console.error("Error fetching saved questions:", error)
        toast.error("Failed to load saved questions.")
      }
    }
    fetchSavedQuestions()
  }, [])

  // Get incorrect questions that haven't been saved
  const getUnsavedIncorrectQuestions = () => {
    const unsaved = quiz.questions.filter(question => {
      // Kiểm tra xem question có thông tin isCorrect không (từ API submit)
      const questionResult = question as QuestionResult;
      const isIncorrect = questionResult.isCorrect === false; // Chỉ false mới là sai
      const isNotSaved = !savedQuestionIds.includes(question.id)
      
      console.log(`Question ${question.id}:`, {
        isIncorrect,
        isNotSaved,
        userSelectedIndexes: questionResult.userSelectedIndexes,
        isCorrect: questionResult.isCorrect
      })
      
      return isIncorrect && isNotSaved
    })
    
    console.log('Quiz questions:', quiz.questions)
    console.log('Saved question IDs:', savedQuestionIds)
    console.log('Unsaved incorrect questions:', unsaved)
    return unsaved
  }

  const unsavedIncorrectCount = getUnsavedIncorrectQuestions().length

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const handleSaveQuestion = async (questionId: string) => {
    try {
      const response = await fetch("/api/users/saved-questions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ questionId }),
      })
      if (!response.ok) {
        throw new Error("Failed to toggle save question")
      }
      const { message } = await response.json()
      if (savedQuestionIds.includes(questionId)) {
        setSavedQuestionIds(savedQuestionIds.filter((id) => id !== questionId))
        toast.success(message || "Question unsaved successfully!")
      } else {
        setSavedQuestionIds([...savedQuestionIds, questionId])
        toast.success(message || "Question saved successfully!")
      }
    } catch (error) {
      console.error("Error toggling saved question:", error)
      toast.error("Failed to save/unsave question.")
    }
  }

  const correctAnswers = quiz.questions.filter((q) => (q as QuestionResult).isCorrect === true).length
  const isPassingScore = quiz.score >= 70

  const handleRetryQuiz = async () => {
    try {
      const response = await fetch(`/api/quizzes/${quiz.id}/retry`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to retry quiz');
      const newQuiz = await response.json();
      router.push(`/quiz/${newQuiz.id || newQuiz._id}`);
    } catch (error) {
      console.error('Error retrying quiz:', error);
      toast.error('Failed to retry quiz');
    }
  };

  // Handle navigation with warning
  const handleNavigation = (action: string, callback: () => void) => {
    console.log('handleNavigation called with action:', action)
    console.log('unsavedIncorrectCount:', unsavedIncorrectCount)
    if (unsavedIncorrectCount > 0) {
      console.log('Showing save warning popup')
      setShowSaveWarning(true)
      setPendingNavigation(action)
    } else {
      console.log('No unsaved questions, proceeding with navigation')
      callback()
    }
  }

  const handleConfirmNavigation = () => {
    setShowSaveWarning(false)
    if (pendingNavigation === 'newQuiz') {
      onNewQuiz()
    } else if (pendingNavigation === 'history') {
      router.push("/history")
    } else if (pendingNavigation === 'saved') {
      router.push("/saved")
    } else if (pendingNavigation === 'retry') {
      handleRetryQuiz()
    }
    setPendingNavigation(null)
  }

  const handleCancelNavigation = () => {
    setShowSaveWarning(false)
    setPendingNavigation(null)
  }

  // Save all incorrect questions at once
  const handleSaveAllIncorrect = async () => {
    const unsavedIncorrect = getUnsavedIncorrectQuestions()
    let savedCount = 0

    for (const question of unsavedIncorrect) {
      try {
        const response = await fetch("/api/users/saved-questions", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ questionId: question.id }),
        })
        if (response.ok) {
          savedCount++
          setSavedQuestionIds(prev => [...prev, question.id])
        }
      } catch (error) {
        console.error("Error saving question:", error)
      }
    }

    if (savedCount > 0) {
      toast.success(`Successfully saved ${savedCount} questions for later study!`)
      setShowSaveWarning(false)
      setPendingNavigation(null)
    } else {
      toast.error("Failed to save questions. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="relative">
              <div
                className={`w-16 h-16 bg-gradient-to-r ${isPassingScore ? "from-green-500 to-emerald-500" : "from-orange-500 to-red-500"} rounded-2xl flex items-center justify-center shadow-2xl`}
              >
                {isPassingScore ? <Trophy className="w-8 h-8 text-white" /> : <Brain className="w-8 h-8 text-white" />}
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center animate-bounce">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                {isPassingScore ? "Congratulations!!!" : "Quiz Completed!"}
              </h1>
              <p className="text-purple-600 font-medium">Your Results</p>
            </div>
          </div>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            {isPassingScore
              ? "Excellent work! You have demonstrated strong knowledge in this area."
              : "Good effort! Review the explanations below to improve your understanding."}
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Score Card */}
            <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className={`text-6xl font-bold mb-4 ${isPassingScore ? "text-green-600" : "text-orange-600"}`}>
                    {quiz.score}%
                  </div>

                  <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200">
                      <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-800">{quiz.totalQuestions}</div>
                      <div className="text-sm text-gray-600">Questions</div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                      <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-800">{correctAnswers}</div>
                      <div className="text-sm text-gray-600">Correct</div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
                      <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-800">{formatTime(quiz.timeUsed)}</div>
                      <div className="text-sm text-gray-600">Time Used</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur-lg opacity-30 animate-pulse" />
                    <button
                      onClick={() => handleNavigation('newQuiz', onNewQuiz)}
                      className="relative w-full flex items-center justify-center gap-3 h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl font-bold text-white shadow-lg transition-all duration-300 transform hover:scale-105"
                    >
                      <RotateCcw className="w-5 h-5" />
                      Start New Quiz
                    </button>
                  </div>

                  <button
                    onClick={() => handleNavigation('history', () => router.push("/history"))}
                    className="w-full flex items-center justify-center gap-3 h-14 bg-white/70 hover:bg-white/90 border-2 border-gray-200 hover:border-purple-300 rounded-xl font-semibold text-gray-700 hover:text-purple-700 shadow-lg transition-all duration-300 transform hover:scale-105"
                  >
                    <History className="w-5 h-5" />
                    Your Quiz History
                  </button>

                  <button
                    onClick={() => handleNavigation('saved', () => router.push("/saved"))}
                    className="w-full flex items-center justify-center gap-3 h-14 bg-white/70 hover:bg-white/90 border-2 border-gray-200 hover:border-orange-300 rounded-xl font-semibold text-gray-700 hover:text-orange-700 shadow-lg transition-all duration-300 transform hover:scale-105"
                  >
                    <Bookmark className="w-5 h-5" />
                    Your Saved Questions
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Question Review */}
            <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">Question Review</h3>
                </div>

                <div className="space-y-6">
                  {quiz.questions.map((question, qIndex) => {
                    // Sử dụng thông tin từ question result (có từ API submit)
                    const questionResult = question as QuestionResult;
                    const isCorrect = questionResult.isCorrect;
                    const userSelectedIndexes = questionResult.userSelectedIndexes || [];
                    const isSaved = savedQuestionIds.includes(question.id)

                    return (
                      <div
                        key={question.id}
                        className={`p-6 border-2 rounded-xl transition-all duration-300 ${
                          isCorrect
                            ? "border-green-200 bg-gradient-to-r from-green-50 to-emerald-50"
                            : "border-red-200 bg-gradient-to-r from-red-50 to-orange-50"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                                isCorrect ? "bg-green-500" : "bg-red-500"
                              }`}
                            >
                              {qIndex + 1}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-800 text-lg mb-2">{question.question}</h4>
                              <div className="flex items-center gap-2 mb-3">
                                {isCorrect ? (
                                  <>
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    <span className="text-green-700 font-medium">Correct</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-5 h-5 text-red-600" />
                                    <span className="text-red-700 font-medium">Incorrect</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleSaveQuestion(question.id)}
                            className={`p-2 rounded-lg transition-all duration-300 ${
                              isSaved
                                ? "bg-orange-100 text-orange-700 border border-orange-300 hover:bg-orange-200"
                                : isCorrect
                                ? "bg-green-100 text-green-700 border border-green-300 hover:bg-green-200"
                                : "bg-red-100 text-red-700 border border-red-300 hover:bg-red-200"
                            }`}
                            title={isSaved ? "Unsave Question" : "Save Question"}
                          >
                            <Bookmark className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
                          </button>
                        </div>

                        <div className="ml-11 space-y-3">
                          {question.answers.map((answer, aIndex) => {
                            // Note: Answer mapping functionality available for future use if needed
                            // const questionMapping = quiz.answerMapping?.[question.id];
                            // const originalIndex = questionMapping ? questionMapping[aIndex] : aIndex;
                            
                            const userSelectedThisAnswer = userSelectedIndexes.includes(aIndex);
                            const isThisAnswerCorrect = answer.isCorrect;
                            const isQuestionCorrect = isCorrect;

                            let answerClass = "p-3 rounded-lg border "
                            let iconClass = ""

                            // Logic hiển thị màu sắc mới:
                            // - Nếu user đúng: chỉ hiện xanh cho đáp án user chọn
                            // - Nếu user sai: hiện đỏ cho đáp án user chọn sai, xanh cho đáp án đúng
                            if (isQuestionCorrect) {
                              // User trả lời đúng - chỉ hiện xanh cho đáp án user chọn
                              if (userSelectedThisAnswer) {
                                answerClass += "border-green-300 bg-green-100 text-green-800"
                                iconClass = "text-green-600"
                              } else {
                                answerClass += "border-gray-200 bg-gray-50 text-gray-600"
                              }
                            } else {
                              // User trả lời sai - hiện đỏ cho đáp án user chọn sai, xanh cho đáp án đúng
                              if (userSelectedThisAnswer && !isThisAnswerCorrect) {
                                answerClass += "border-red-300 bg-red-100 text-red-800"
                                iconClass = "text-red-600"
                              } else if (isThisAnswerCorrect) {
                                answerClass += "border-green-300 bg-green-50 text-green-700"
                                iconClass = "text-green-500"
                              } else {
                                answerClass += "border-gray-200 bg-gray-50 text-gray-600"
                              }
                            }

                            return (
                              <div key={aIndex} className={answerClass}>
                                <div className="flex items-center gap-3">
                                  {isQuestionCorrect && userSelectedThisAnswer && (
                                    <CheckCircle2 className={`w-5 h-5 ${iconClass}`} />
                                  )}
                                  {!isQuestionCorrect && userSelectedThisAnswer && !isThisAnswerCorrect && (
                                    <XCircle className={`w-5 h-5 ${iconClass}`} />
                                  )}
                                  {!isQuestionCorrect && isThisAnswerCorrect && (
                                    <CheckCircle2 className={`w-5 h-5 ${iconClass}`} />
                                  )}
                                  <span className="font-medium">{answer.content}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {question.explanation && (
                          <div className="mt-4 ml-11 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start gap-2">
                              <BookOpen className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="font-semibold text-blue-800">Explanation:</span>
                                <p className="text-blue-700 mt-1">{question.explanation}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Performance Summary */}
            <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-800">Performance Summary</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Accuracy</span>
                      <span className={`font-medium ${isPassingScore ? "text-green-600" : "text-orange-600"}`}>
                        {quiz.score}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full animate-pulse ${
                          isPassingScore
                            ? "bg-gradient-to-r from-green-400 to-emerald-400"
                            : "bg-gradient-to-r from-orange-400 to-red-400"
                        }`}
                        style={{ width: `${quiz.score}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Time Efficiency</span>
                      <span className="text-blue-600 font-medium">
                        {Math.round((quiz.timeUsed / (quiz.timeLimit * 60)) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-pulse"
                        style={{ width: `${Math.round((quiz.timeUsed / (quiz.timeLimit * 60)) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-200">
                    <div className="text-center">
                      <div className={`text-lg font-bold ${isPassingScore ? "text-green-600" : "text-orange-600"}`}>
                        {isPassingScore ? "Excellent!" : "Keep Learning!"}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {isPassingScore ? "You have mastered this topic" : "Review and try again"}
                      </div>
                      {!isPassingScore && (
                        <button
                          onClick={() => handleNavigation('retry', handleRetryQuiz)}
                          className="mt-3 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold shadow transition"
                        >
                          Try Again
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Study Recommendations */}
            <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-800">Study Recommendations</h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-sm">
                      <div className="text-gray-800 font-medium">Review saved questions</div>
                      <div className="text-gray-600 text-xs">Focus on weak areas</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-sm">
                      <div className="text-gray-800 font-medium">Practice more quizzes</div>
                      <div className="text-gray-600 text-xs">Build confidence</div>
                    </div>
                  </div>

                  {unsavedIncorrectCount > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                      <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                        <Bookmark className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-sm">
                        <div className="text-gray-800 font-medium">Save incorrect questions</div>
                        <div className="text-gray-600 text-xs">{unsavedIncorrectCount} questions to save</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Save Warning Modal */}
      {showSaveWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bookmark className="w-8 h-8 text-white" />
              </div>
                             <h3 className="text-xl font-bold text-gray-800 mb-2">Save Your Progress?</h3>
               <p className="text-gray-600 mb-6">
                 We noticed you haven&apos;t saved {unsavedIncorrectCount} question{unsavedIncorrectCount > 1 ? 's' : ''} (incorrect). 
                 Would you like to save them for later study?
               </p>
               
               <div className="space-y-3">
                 <button
                   onClick={handleSaveAllIncorrect}
                   className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
                 >
                   Save All & Continue
                 </button>
                <button
                  onClick={handleConfirmNavigation}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-all duration-300"
                >
                  Continue Without Saving
                </button>
                <button
                  onClick={handleCancelNavigation}
                  className="w-full text-gray-500 hover:text-gray-700 font-medium py-2 px-6 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}