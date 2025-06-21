"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Briefcase, Brain, Award, BookOpen, Clock } from 'lucide-react';
import { ResultsSummary } from '@/components/ui/test-mode/ResultsSummary';
import { InterviewChat } from '@/components/ui/test-mode/InterviewChat';
import { extractTopics, generateQuestionsForTopic, evaluateAnswer } from '@/services/interviewService';
import { startSpeechRecognition, stopSpeechRecognition, textToSpeech } from '@/utils/speech/azureSpeechUtils';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import ReactMarkdown from 'react-markdown';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Share2, MessageSquare } from "lucide-react";
import StartScreen from './StartScreen';
import InterviewScreen from './InterviewScreen';
import ResultScreen from './ResultScreen';

const CATEGORY_ROLE_OPTIONS = [
  {
    category: "Software Development",
    roles: [
      "Frontend Developer",
      "Backend Developer",
      "Fullstack Developer",
      "Mobile Developer",
      "Game Developer",
      "Embedded Systems Developer",
      "Desktop Application Developer"
    ]
  },
  {
    category: "Web Development",
    roles: [
      "Web Developer",
      "WordPress Developer",
      "Web Designer",
      "Web Performance Engineer"
    ]
  },
  {
    category: "Software Testing (QA)",
    roles: [
      "Manual Tester",
      "Automation Tester",
      "QA Engineer",
      "Test Lead"
    ]
  },
  {
    category: "DevOps & Infrastructure",
    roles: [
      "DevOps Engineer",
      "Site Reliability Engineer (SRE)",
      "System Administrator",
      "Cloud Engineer"
    ]
  },
  {
    category: "Data & AI",
    roles: [
      "Data Analyst",
      "Data Scientist",
      "Data Engineer",
      "Machine Learning Engineer",
      "Business Intelligence Engineer"
    ]
  },
  {
    category: "Information Security",
    roles: [
      "Security Analyst",
      "Penetration Tester",
      "SOC Analyst",
      "Security Engineer",
      "GRC Specialist"
    ]
  },
  {
    category: "Artificial Intelligence & Deep Learning",
    roles: [
      "AI Researcher",
      "Deep Learning Engineer",
      "NLP Engineer"
    ]
  },
  {
    category: "Design & User Experience",
    roles: [
      "UI/UX Designer",
      "Product Designer",
      "Interaction Designer"
    ]
  },
  {
    category: "Management & Business Analysis",
    roles: [
      "Project Manager",
      "Product Owner",
      "Scrum Master",
      "Business Analyst"
    ]
  },
  {
    category: "Support & Technical",
    roles: [
      "IT Support",
      "Desktop Support Engineer",
      "Technical Support Specialist"
    ]
  },
  {
    category: "Networking & Systems",
    roles: [
      "Network Administrator",
      "Network Engineer",
      "System Engineer",
      "Cloud Infrastructure Engineer"
    ]
  },
  {
    category: "Emerging Technologies",
    roles: [
      "Blockchain Developer",
      "Web3 Developer",
      "Prompt Engineer",
      "AR/VR Developer"
    ]
  }
];

const levelOptions = ['Junior', 'Mid-level', 'Senior', 'Lead'];
const LANGUAGES = [
  { key: 'vi', value: 'vi-VN', label: 'Tiếng Việt' },
  { key: 'en', value: 'en-US', label: 'English' }
];

export interface ConversationMessage {
  id: string | number;
  sender: 'user' | 'ai';
  text: string;
  isError?: boolean;
  timestamp?: string;
}

interface RealTimeScores {
  fundamental: number;
  logic: number;
  language: number;
  suggestions: {
    fundamental: string;
    logic: string;
    language: string;
  };
}

interface EvaluationScores {
  fundamentalKnowledge: number;
  logicalReasoning: number;
  languageFluency: number;
  overall: number;
}

interface HistoryStage {
  question: string;
  answer: string;
  evaluation: {
    scores: {
      fundamental: number;
      logic: number;
      language: number;
    };
    suggestions: {
      fundamental: string;
      logic: string;
      language: string;
    };
  };
  topic: string;
  timestamp: string;
}

interface InterviewState {
  phase: 'introduction' | 'interviewing' | 'completed';
  topics: string[];
  currentTopicIndex: number;
  questions: string[];
  currentQuestionIndex: number;
}

// Định nghĩa lại createMessage đúng vị trí
const createMessage = (sender: 'user' | 'ai', text: string, isError = false): ConversationMessage => ({
  id: Date.now(), sender, text, timestamp: new Date().toISOString(), isError
});

export default function TestPanel() {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [interviewing, setInterviewing] = useState(false);
  const [category, setCategory] = useState(CATEGORY_ROLE_OPTIONS[0].category);
  const [position, setPosition] = useState('Frontend Developer');
  const [level, setLevel] = useState('Junior');
  const [language, setLanguage] = useState('vi-VN');
  const [duration, setDuration] = useState(15);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const messageListRef = useRef<HTMLDivElement | null>(null);

  // Speech states
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState('vi-VN');
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [speechRecognizer, setSpeechRecognizer] = useState<sdk.SpeechRecognizer | null>(null);

  const [interviewState, setInterviewState] = useState<InterviewState>({
    phase: 'introduction',
    topics: [],
    currentTopicIndex: 0,
    questions: [],
    currentQuestionIndex: 0
  });

  // NEW: Track if initial AI message has been sent
  const [hasSentInitialMessage, setHasSentInitialMessage] = useState(false);
  const [history, setHistory] = useState<HistoryStage[]>([]);

  const [showResult, setShowResult] = useState(false);

  // Thêm state lưu điểm real-time
  const [realTimeScores, setRealTimeScores] = useState<RealTimeScores>({
    fundamental: 0,
    logic: 0,
    language: 0,
    suggestions: {
      fundamental: '',
      logic: '',
      language: ''
    }
  });

  // Thêm state lưu feedback cuối cùng
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);

  const addHistoryStage = (stage: HistoryStage) => {
    setHistory(prev => [...prev, stage]);
  };

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [conversation]);

  // NEW: Send initial AI message only on client after interviewing starts
  useEffect(() => {
    if (interviewing && !hasSentInitialMessage) {
      const initialMessage = createMessage('ai', `Hello! I am the AI Interviewer. Today we will conduct an interview for the position of ${position} (${level}). First, could you briefly introduce yourself and your work experience?`);
      setConversation([initialMessage]);
      if (isSpeechEnabled && isSpeakerOn) {
        speakAiResponse(initialMessage.text);
      }
      setHasSentInitialMessage(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewing]);

  // Debug: log mỗi khi showResult hoặc interviewing thay đổi
  useEffect(() => {
    console.log('[DEBUG] showResult:', showResult, '| interviewing:', interviewing);
  }, [showResult, interviewing]);

  // Speech handlers
  const startSpeechInteraction = async () => {
    if (!isSpeechEnabled) return;
    setIsListening(true);
    const recognizer = await startSpeechRecognition(
      (text: string) => {
        if (text.trim()) {
          setMessage(text);
          handleSendMessage();
        }
      },
      (error: unknown) => {
        console.error("Speech recognition error:", error);
        setIsListening(false);
      },
      voiceLanguage
    );
    setSpeechRecognizer(recognizer);
  };

  const stopSpeechInteraction = async () => {
    setIsListening(false);
    if (speechRecognizer) {
      try {
        await stopSpeechRecognition(speechRecognizer);
        setSpeechRecognizer(null);
      } catch (error) {
        console.error("Error stopping speech recognition:", error);
      }
    }
  };

  const toggleSpeechRecognition = () => {
    if (isListening) {
      stopSpeechInteraction();
    } else {
      startSpeechInteraction();
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(prev => !prev);
  };

  const speakAiResponse = async (text: string) => {
    if (!isSpeakerOn || !isSpeechEnabled) return;
    try {
      setIsAiSpeaking(true);
      await textToSpeech(text, voiceLanguage);
    } catch (error) {
      console.error("Error in text-to-speech:", error);
    } finally {
      setIsAiSpeaking(false);
    }
  };

  const startInterview = () => {
    setShowResult(false);
    setInterviewing(true);
    setInterviewState({
      phase: 'introduction',
      topics: [],
      currentTopicIndex: 0,
      questions: [],
      currentQuestionIndex: 0
    });
    setHasSentInitialMessage(false);
    setHistory([]);
    setRealTimeScores({
      fundamental: 0,
      logic: 0,
      language: 0,
      suggestions: {
        fundamental: '',
        logic: '',
        language: ''
      }
    });
    setConversation([]);
    setMessage('');
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    const userMessage = createMessage('user', message);
    addMessageToConversation(setConversation, userMessage, speakAiResponse, isSpeechEnabled, isSpeakerOn);
    setMessage('');
    setIsAiThinking(true);
    try {
      switch (interviewState.phase) {
        case 'introduction':
          await handleIntroductionPhase(
            message,
            setConversation,
            setInterviewState,
            speakAiResponse,
            isSpeechEnabled,
            isSpeakerOn,
            position
          );
          break;
        case 'interviewing':
          await handleInterviewingPhase(
            message,
            interviewState,
            setInterviewState,
            setConversation,
            setInterviewing,
            speakAiResponse,
            isSpeechEnabled,
            isSpeakerOn
          );
          break;
        case 'completed':
          break;
      }
    } catch {
      const errorMessage = createMessage(
        'ai',
        'Sorry, an error occurred while ending the interview. Please try again.',
        true
      );
      addMessageToConversation(setConversation, errorMessage, speakAiResponse, isSpeechEnabled, isSpeakerOn);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Hàm tóm tắt history cho AI
  const getHistorySummary = () => {
    if (history.length === 0) return '';
    return history.map((stage, idx) =>
      `Question ${idx + 1}: ${stage.question}\nAnswer: ${stage.answer}`
    ).join('\n\n');
  };

  // Phase handling functions
  const handleIntroductionPhase = async (
    message: string,
    setConversation: React.Dispatch<React.SetStateAction<ConversationMessage[]>>,
    setInterviewState: React.Dispatch<React.SetStateAction<InterviewState>>,
    speakAiResponse: (text: string) => void,
    isSpeechEnabled: boolean,
    isSpeakerOn: boolean,
    position: string
  ) => {
    const topics = await extractTopics(message);
    if (!topics || topics.length === 0) {
      const clarificationMessage = createMessage(
        'ai',
        `I noticed you didn't introduce yourself and your work experience. Could you briefly introduce yourself and your work experience in the field of ${position}?`
      );
      addMessageToConversation(setConversation, clarificationMessage, speakAiResponse, isSpeechEnabled, isSpeakerOn);
      return;
    }
    const technicalKeywords = ['frontend', 'backend', 'fullstack', 'react', 'angular', 'vue', 'javascript', 'html', 'css', 'api', 'database', 'sql', 'python', 'java', 'c++', 'c#', 'devops', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'mobile', 'ios', 'android', 'qa', 'testing', 'ui/ux', 'next.js', 'tailwind css'];
    const prioritizedTopics = topics.sort((a: string, b: string) => {
      const aIsTechnical = technicalKeywords.some(keyword => a.toLowerCase().includes(keyword)) ? 1 : 0;
      const bIsTechnical = technicalKeywords.some(keyword => b.toLowerCase().includes(keyword)) ? 1 : 0;
      return bIsTechnical - aIsTechnical;
    });
    const firstTopic = prioritizedTopics[0];
    const questions = await generateQuestionsForTopic(firstTopic);
    if (!questions || questions.length === 0) {
      const noQuestionsMessage = createMessage(
        'ai',
        `Sorry, I'm having trouble creating detailed questions about the topic ${firstTopic}. Would you like to try introducing it again or focusing on other skills?`
      );
      addMessageToConversation(setConversation, noQuestionsMessage, speakAiResponse, isSpeechEnabled, isSpeakerOn);
      return;
    }
    setInterviewState({
      phase: 'interviewing',
      topics,
      currentTopicIndex: 0,
      questions,
      currentQuestionIndex: 0
    });
    // Cảm ơn sau phần giới thiệu
    const thankMessage = createMessage(
      'ai',
      `Thank you for introducing yourself and your work experience! Now let's start with professional questions.\n\n${questions[0]}`
    );
    addMessageToConversation(setConversation, thankMessage, speakAiResponse, isSpeechEnabled, isSpeakerOn);
  };

  const handleInterviewingPhase = async (
    message: string,
    interviewState: InterviewState,
    setInterviewState: React.Dispatch<React.SetStateAction<InterviewState>>,
    setConversation: React.Dispatch<React.SetStateAction<ConversationMessage[]>>,
    setInterviewing: React.Dispatch<React.SetStateAction<boolean>>,
    speakAiResponse: (text: string) => void,
    isSpeechEnabled: boolean,
    isSpeakerOn: boolean
  ) => {
    // FIX: Always evaluate answer against the last question sent
    const lastQuestionIndex = interviewState.currentQuestionIndex;
    const currentQuestion = interviewState.questions[lastQuestionIndex];
    if (!currentQuestion) {
      const errorMessage = createMessage(
        'ai',
        'Sorry, an error occurred while processing the current question. Let\'s try switching to a different topic.',
        true
      );
      addMessageToConversation(setConversation, errorMessage, speakAiResponse, isSpeechEnabled, isSpeakerOn);
      await handleQuestionTransition(interviewState, setInterviewState, setConversation, setInterviewing, speakAiResponse, isSpeechEnabled, isSpeakerOn);
      return;
    }
    const evaluation = await evaluateAnswer(currentQuestion, message, getHistorySummary());
    // Cập nhật điểm real-time
    if (evaluation && evaluation.scores) {
      setRealTimeScores({
        fundamental: evaluation.scores.fundamental,
        logic: evaluation.scores.logic,
        language: evaluation.scores.language,
        suggestions: evaluation.suggestions || realTimeScores.suggestions
      });
    }
    // Lưu vào history
    addHistoryStage({
      question: currentQuestion,
      answer: message,
      evaluation,
      topic: interviewState.topics[interviewState.currentTopicIndex],
      timestamp: new Date().toISOString()
    });
    if (!evaluation || typeof evaluation.isComplete === 'undefined') {
      const errorMessage = createMessage(
        'ai',
        'Sorry, an error occurred while evaluating your answer. Let\'s try switching to the next question.',
        true
      );
      addMessageToConversation(setConversation, errorMessage, speakAiResponse, isSpeechEnabled, isSpeakerOn);
      await handleQuestionTransition(interviewState, setInterviewState, setConversation, setInterviewing, speakAiResponse, isSpeechEnabled, isSpeakerOn);
      return;
    }
    // --- Markdown formatting improvement ---
    let responseText = `**Answer Evaluation:**\n`;
    if (evaluation.strengths && evaluation.strengths.length > 0) {
      responseText += `- **Strengths:**\n`;
      responseText += evaluation.strengths.map((s: string) => `  - ${s}`).join("\n") + "\n";
    }
    if (evaluation.missingPoints && evaluation.missingPoints.length > 0) {
      responseText += `- **Missing Points to Improve:**\n`;
      responseText += evaluation.missingPoints.map((p: string) => `  - ${p}`).join("\n") + "\n";
    }
    if (evaluation.suggestedImprovements && evaluation.suggestedImprovements.length > 0) {
      responseText += `- **Suggested Improvements:**\n`;
      responseText += evaluation.suggestedImprovements.map((i: string) => `  - ${i}`).join("\n") + "\n";
    }
    let nextQuestion = '';
    if (evaluation.followUpQuestions && evaluation.followUpQuestions.length > 0) {
      nextQuestion = evaluation.followUpQuestions[0];
    }
    // set feedback thay vì add vào chat
    setLastFeedback(responseText);
    // Nếu vẫn muốn AI hỏi tiếp, chỉ add câu hỏi tiếp theo vào chat
    if (nextQuestion) {
      const nextQuestionMessage = createMessage('ai', nextQuestion);
      addMessageToConversation(setConversation, nextQuestionMessage, speakAiResponse, isSpeechEnabled, isSpeakerOn);
    }
    if (evaluation.isComplete && (!evaluation.followUpQuestions || evaluation.followUpQuestions.length === 0)) {
      await handleQuestionTransition(interviewState, setInterviewState, setConversation, setInterviewing, speakAiResponse, isSpeechEnabled, isSpeakerOn);
    }
  };

  // Fix: increment currentQuestionIndex only AFTER sending the next question
  const handleQuestionTransition = async (
    interviewState: InterviewState,
    setInterviewState: React.Dispatch<React.SetStateAction<InterviewState>>,
    setConversation: React.Dispatch<React.SetStateAction<ConversationMessage[]>>,
    setInterviewing: React.Dispatch<React.SetStateAction<boolean>>,
    speakAiResponse: (text: string) => void,
    isSpeechEnabled: boolean,
    isSpeakerOn: boolean
  ) => {
    const nextQuestionIndex = interviewState.currentQuestionIndex + 1;
    if (nextQuestionIndex < interviewState.questions.length) {
      const nextQuestion = createMessage('ai', interviewState.questions[nextQuestionIndex]);
      addMessageToConversation(setConversation, nextQuestion, speakAiResponse, isSpeechEnabled, isSpeakerOn);
      setInterviewState((prev: InterviewState) => ({
        ...prev,
        currentQuestionIndex: nextQuestionIndex
      }));
      return;
    }
    await handleTopicTransition(interviewState, setInterviewState, setConversation, setInterviewing, speakAiResponse, isSpeechEnabled, isSpeakerOn);
  };

  const handleTopicTransition = async (
    interviewState: InterviewState,
    setInterviewState: React.Dispatch<React.SetStateAction<InterviewState>>,
    setConversation: React.Dispatch<React.SetStateAction<ConversationMessage[]>>,
    setInterviewing: React.Dispatch<React.SetStateAction<boolean>>,
    speakAiResponse: (text: string) => void,
    isSpeechEnabled: boolean,
    isSpeakerOn: boolean
  ) => {
    const nextTopicIndex = interviewState.currentTopicIndex + 1;
    if (nextTopicIndex < interviewState.topics.length) {
      const nextTopic = interviewState.topics[nextTopicIndex];
      const nextTopicQuestions = await generateQuestionsForTopic(nextTopic);
      if (!nextTopicQuestions || nextTopicQuestions.length === 0) {
        const noQuestionsMessage = createMessage(
          'ai',
          `Sorry, I'm having trouble creating detailed questions about the topic ${nextTopic}. We can switch to a different topic or end the interview.`
        );
        addMessageToConversation(setConversation, noQuestionsMessage, speakAiResponse, isSpeechEnabled, isSpeakerOn);
        const nextNextTopicIndex = nextTopicIndex + 1;
        if (nextNextTopicIndex < interviewState.topics.length) {
          setInterviewState((prev: InterviewState) => ({
            ...prev,
            currentTopicIndex: nextNextTopicIndex,
            questions: [],
            currentQuestionIndex: 0
          }));
        } else {
          await endInterview(setInterviewState, setInterviewing, setConversation, speakAiResponse, isSpeechEnabled, isSpeakerOn);
        }
        return;
      }
      setInterviewState((prev: InterviewState) => ({
        ...prev,
        currentTopicIndex: nextTopicIndex,
        questions: nextTopicQuestions,
        currentQuestionIndex: 0
      }));
      const nextQuestion = createMessage('ai', nextTopicQuestions[0]);
      addMessageToConversation(setConversation, nextQuestion, speakAiResponse, isSpeechEnabled, isSpeakerOn);
      return;
    }
    await endInterview(setInterviewState, setInterviewing, setConversation, speakAiResponse, isSpeechEnabled, isSpeakerOn);
  };

  const endInterview = async (
    setInterviewState: React.Dispatch<React.SetStateAction<InterviewState>>,
    setInterviewing: React.Dispatch<React.SetStateAction<boolean>>,
    setConversation: React.Dispatch<React.SetStateAction<ConversationMessage[]>>,
    speakAiResponse: (text: string) => void,
    isSpeechEnabled: boolean,
    isSpeakerOn: boolean
  ) => {
    console.log('[DEBUG] endInterview called');
    setInterviewState((prev: InterviewState) => ({
      ...prev,
      phase: 'completed'
    }));
    const endingMessage = createMessage(
      'ai',
      'Thank you for participating in the interview. We will summarize the results now.'
    );
    addMessageToConversation(setConversation, endingMessage, speakAiResponse, isSpeechEnabled, isSpeakerOn);
    setInterviewing(false);
    setShowResult(true);

    // Gọi API lưu kết quả xuống DB
    try {
      await fetch('/api/test-mode/test-panel-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration,
          position,
          level,
          history,
          realTimeScores,
        })
      });
    } catch (error) {
      console.error('Error saving interview result:', error);
    }
  };

  // Hàm luyện tập lại
  const handleReset = () => {
    console.log('[DEBUG] handleReset called');
    setShowResult(false);
    setInterviewing(false);
    setConversation([]);
    setMessage('');
    setInterviewState({
      phase: 'introduction',
      topics: [],
      currentTopicIndex: 0,
      questions: [],
      currentQuestionIndex: 0
    });
  };

  // Hàm tính điểm trung bình cho 3 tiêu chí
  const calculateFinalScores = (): EvaluationScores => {
    if (history.length === 0) {
      return {
        fundamentalKnowledge: 0,
        logicalReasoning: 0,
        languageFluency: 0,
        overall: 0
      };
    }

    // Lọc ra các stage có đánh giá hợp lệ
    const validStages = history.filter(stage => 
      stage.evaluation?.scores && 
      typeof stage.evaluation.scores.fundamental === 'number' &&
      typeof stage.evaluation.scores.logic === 'number' &&
      typeof stage.evaluation.scores.language === 'number'
    );

    if (validStages.length === 0) {
      return {
        fundamentalKnowledge: 0,
        logicalReasoning: 0,
        languageFluency: 0,
        overall: 0
      };
    }

    // Tính tổng điểm cho từng tiêu chí
    const totalScores = validStages.reduce((acc, stage) => ({
      fundamentalKnowledge: acc.fundamentalKnowledge + stage.evaluation.scores.fundamental,
      logicalReasoning: acc.logicalReasoning + stage.evaluation.scores.logic,
      languageFluency: acc.languageFluency + stage.evaluation.scores.language
    }), {
      fundamentalKnowledge: 0,
      logicalReasoning: 0,
      languageFluency: 0
    });

    // Tính điểm trung bình
    const averageScores = {
      fundamentalKnowledge: totalScores.fundamentalKnowledge / validStages.length,
      logicalReasoning: totalScores.logicalReasoning / validStages.length,
      languageFluency: totalScores.languageFluency / validStages.length
    };

    // Tính điểm tổng thể
    return {
      ...averageScores,
      overall: (averageScores.fundamentalKnowledge + averageScores.logicalReasoning + averageScores.languageFluency) / 3
    };
  };

  const addMessageToConversation = (
    setConversation: React.Dispatch<React.SetStateAction<ConversationMessage[]>>,
    message: ConversationMessage,
    speakAiResponse: (text: string) => void,
    isSpeechEnabled: boolean,
    isSpeakerOn: boolean
  ) => {
    setConversation(prev => [...prev, message]);
    if (isSpeechEnabled && isSpeakerOn && message.sender === 'ai') {
      speakAiResponse(message.text);
    }
  };

  const onEndInterview = async () => {
    console.log('[DEBUG] onEndInterview called');
    await endInterview(setInterviewState, setInterviewing, setConversation, speakAiResponse, isSpeechEnabled, isSpeakerOn);
  };

  // Timer component cho phỏng vấn
  const Timer = ({ duration }: { duration: number }) => {
    const [timeLeft, setTimeLeft] = useState(duration * 60); // convert to seconds

    useEffect(() => {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }, []);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    // Tính phần trăm thời gian còn lại
    const timePercentage = (timeLeft / (duration * 60)) * 100;
    
    // Đổi màu theo thời gian còn lại
    const getTimerColor = () => {
      if (timePercentage > 50) return "text-green-700 bg-green-50 border-green-200";
      if (timePercentage > 20) return "text-amber-700 bg-amber-50 border-amber-200";
      return "text-red-700 bg-red-50 border-red-200";
    };
    
    return (
      <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors duration-300 ${getTimerColor()}`}>
        <Clock className="h-4 w-4" />
        <span className="font-mono font-medium">{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}</span>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {showResult ? (
            <ResultScreen
              results={{
                duration,
                position,
                level,
                scores: calculateFinalScores(),
                messages: conversation,
                timestamp: new Date().toISOString(),
              }}
              realTimeScores={realTimeScores}
              onReset={handleReset}
            />
          ) : !interviewing ? (
            <StartScreen
              category={category}
              position={position}
              level={level}
              language={language}
              duration={duration}
              setCategory={setCategory}
              setPosition={setPosition}
              setLevel={setLevel}
              setLanguage={setLanguage}
              setDuration={setDuration}
              setIsSpeechEnabled={setIsSpeechEnabled}
              isSpeechEnabled={isSpeechEnabled}
              startInterview={startInterview}
              CATEGORY_ROLE_OPTIONS={CATEGORY_ROLE_OPTIONS}
              LANGUAGES={LANGUAGES}
              levelOptions={levelOptions}
            />
          ) : (
            <InterviewScreen
              position={position}
              isSpeechEnabled={isSpeechEnabled}
              voiceLanguage={voiceLanguage as 'vi-VN' | 'en-US'}
              isListening={isListening}
              isSpeakerOn={isSpeakerOn}
              isAiSpeaking={isAiSpeaking}
              conversation={conversation}
              message={message}
              isAiThinking={isAiThinking}
              onToggleLanguage={() => setVoiceLanguage(prev => prev === 'vi-VN' ? 'en-US' : 'vi-VN')}
              onToggleSpeechRecognition={toggleSpeechRecognition}
              onToggleSpeaker={toggleSpeaker}
              onSpeechToggle={() => setIsSpeechEnabled(prev => !prev)}
              onMessageChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
              onSendMessage={handleSendMessage}
              messageListRef={messageListRef}
              duration={duration}
              onEndInterview={onEndInterview}
              realTimeScores={realTimeScores}
              lastFeedback={lastFeedback}
            />
          )}
        </div>
        <div className="space-y-6">
          {/* Card tiêu chí đánh giá */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white">
              <CardTitle className="flex items-center gap-2">
                <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Evaluation criteria
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center space-x-3 p-3.5 bg-blue-50 rounded-lg border border-blue-100 hover:border-blue-300 transition-colors">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Basic knowledge</h4>
                  <p className="text-sm text-gray-600 mt-0.5">Evaluate basic knowledge, knowledge related to the topic.</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3.5 bg-amber-50 rounded-lg border border-amber-100 hover:border-amber-300 transition-colors">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Logical thinking</h4>
                  <p className="text-sm text-gray-600 mt-0.5">Evaluate problem-solving and reasoning capabilities.</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3.5 bg-green-50 rounded-lg border border-green-100 hover:border-green-300 transition-colors">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Award className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Language proficiency</h4>
                  <p className="text-sm text-gray-600 mt-0.5">Evaluate vocabulary usage and grammatical accuracy.</p>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Card lý do luyện tập */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2 bg-gradient-to-r from-indigo-50 to-white">
              <CardTitle className="flex items-center gap-2">
                <svg className="h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Why should you practice interviewing?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-start space-x-3.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold flex-shrink-0 shadow-sm">1</div>
                <div>
                  <h4 className="font-medium text-gray-900">Build confidence</h4>
                  <p className="text-sm text-gray-600 mt-1">Practicing beforehand helps you feel more confident when participating in the actual interview.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold flex-shrink-0 shadow-sm">2</div>
                <div>
                  <h4 className="font-medium text-gray-900">Improve answering skills</h4>
                  <p className="text-sm text-gray-600 mt-1">Receive detailed feedback to help you improve answering interview questions.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold flex-shrink-0 shadow-sm">3</div>
                <div>
                  <h4 className="font-medium text-gray-900">Prepare thoroughly</h4>
                  <p className="text-sm text-gray-600 mt-1">Get familiar with common questions in your field.</p>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Card vị trí đã chọn */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-white">
              <CardTitle className="flex items-center gap-2">
                <svg className="h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Selected position
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Field:</span>
                  <Badge variant="outline" className="bg-gray-50 text-gray-800 hover:bg-gray-100">{category}</Badge>
                </div>
                <Separator className="my-0.5" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Position:</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-800 hover:bg-blue-100 border-blue-200">{position}</Badge>
                </div>
                <Separator className="my-0.5" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Level:</span>
                  <Badge variant="outline" className="bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-200">{level}</Badge>
                </div>
                <Separator className="my-0.5" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Time:</span>
                  <Badge variant="outline" className="bg-green-50 text-green-800 hover:bg-green-100 border-green-200">{duration} minutes</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
