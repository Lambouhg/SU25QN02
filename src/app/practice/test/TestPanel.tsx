"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Container, Typography, Box, CircularProgress } from '@mui/material';
import PreInterviewSetup from '@/components/InterviewPractice/PreInterviewSetup';
import { InterviewChat } from '@/components/ui/test-mode/InterviewChat';
import InterviewGuidelines from '@/components/InterviewPractice/InterviewGuidelines';
import { extractTopics, generateQuestionsForTopic, evaluateAnswer } from '@/services/interviewService';
import { startSpeechRecognition, stopSpeechRecognition, textToSpeech } from '@/utils/speech/azureSpeechUtils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Briefcase, MessageSquare, Brain, Award } from 'lucide-react';
import { ResultsSummary } from '@/components/ui/test-mode/ResultsSummary';

const CATEGORY_ROLE_OPTIONS = [
  {
    category: "Phát triển phần mềm",
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
    category: "Kiểm thử phần mềm (QA)",
    roles: [
      "Manual Tester",
      "Automation Tester",
      "QA Engineer",
      "Test Lead"
    ]
  },
  {
    category: "DevOps & Hạ tầng",
    roles: [
      "DevOps Engineer",
      "Site Reliability Engineer (SRE)",
      "System Administrator",
      "Cloud Engineer"
    ]
  },
  {
    category: "Dữ liệu & AI",
    roles: [
      "Data Analyst",
      "Data Scientist",
      "Data Engineer",
      "Machine Learning Engineer",
      "Business Intelligence Engineer"
    ]
  },
  {
    category: "Bảo mật thông tin",
    roles: [
      "Security Analyst",
      "Penetration Tester",
      "SOC Analyst",
      "Security Engineer",
      "GRC Specialist"
    ]
  },
  {
    category: "Trí tuệ nhân tạo & Deep Learning",
    roles: [
      "AI Researcher",
      "Deep Learning Engineer",
      "NLP Engineer"
    ]
  },
  {
    category: "Thiết kế & Trải nghiệm người dùng",
    roles: [
      "UI/UX Designer",
      "Product Designer",
      "Interaction Designer"
    ]
  },
  {
    category: "Quản lý & Phân tích nghiệp vụ",
    roles: [
      "Project Manager",
      "Product Owner",
      "Scrum Master",
      "Business Analyst"
    ]
  },
  {
    category: "Hỗ trợ & Kỹ thuật",
    roles: [
      "IT Support",
      "Desktop Support Engineer",
      "Technical Support Specialist"
    ]
  },
  {
    category: "Mạng & Hệ thống",
    roles: [
      "Network Administrator",
      "Network Engineer",
      "System Engineer",
      "Cloud Infrastructure Engineer"
    ]
  },
  {
    category: "Công nghệ mới",
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

const createMessage = (sender: string, text: string, isError = false) => ({
  id: Date.now(), sender, text, timestamp: new Date().toISOString(), isError
});

const addMessageToConversation = (
  setConversation: React.Dispatch<React.SetStateAction<any[]>>,
  message: any,
  speakAiResponse: (text: string) => void,
  isSpeechEnabled: boolean,
  isSpeakerOn: boolean
) => {
  setConversation(prev => [...prev, message]);
  if (isSpeechEnabled && isSpeakerOn && message.sender === 'ai') {
    speakAiResponse(message.text);
  }
};

export default function TestPanel() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<any[]>([]);
  const [interviewing, setInterviewing] = useState(false);
  const [category, setCategory] = useState(CATEGORY_ROLE_OPTIONS[0].category);
  const [position, setPosition] = useState('Frontend Developer');
  const [level, setLevel] = useState('Junior');
  const [language, setLanguage] = useState('vi-VN');
  const [duration, setDuration] = useState(15);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

  // Speech states
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState('vi-VN');
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [speechRecognizer, setSpeechRecognizer] = useState<any>(null);

  const [interviewState, setInterviewState] = useState({
    phase: 'introduction',
    topics: [],
    currentTopicIndex: 0,
    questions: [],
    currentQuestionIndex: 0
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // NEW: Track if initial AI message has been sent
  const [hasSentInitialMessage, setHasSentInitialMessage] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const [showResult, setShowResult] = useState(false);

  const addHistoryStage = (stage: any) => {
    setHistory(prev => [...prev, stage]);
  };

  useEffect(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [conversation]);

  // NEW: Send initial AI message only on client after interviewing starts
  useEffect(() => {
    if (interviewing && !hasSentInitialMessage) {
      const initialMessage = {
        id: Date.now(),
        sender: 'ai',
        text: `Xin chào! Tôi là AI Interviewer. Hôm nay chúng ta sẽ tiến hành phỏng vấn cho vị trí ${position} (${level}). Trước tiên, bạn có thể giới thiệu ngắn gọn về bản thân và kinh nghiệm làm việc của mình không?`,
        timestamp: new Date().toISOString()
      };
      setConversation([initialMessage]);
      if (isSpeechEnabled && isSpeakerOn) {
        speakAiResponse(initialMessage.text);
      }
      setHasSentInitialMessage(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewing]);

  // Speech handlers
  const startSpeechInteraction = () => {
    if (!isSpeechEnabled) return;
    setIsListening(true);
    const recognizer = startSpeechRecognition(
      (text: string) => {
        if (text.trim()) {
          setMessage(text);
          handleSendMessage();
        }
      },
      (error: any) => {
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
    setInterviewing(true);
    setInterviewState({
      phase: 'introduction',
      topics: [],
      currentTopicIndex: 0,
      questions: [],
      currentQuestionIndex: 0
    });
    setHasSentInitialMessage(false);
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
          setIsAnalyzing(true);
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
    } catch (error) {
      const errorMessage = createMessage(
        'ai',
        'Xin lỗi, đã có lỗi xảy ra trong quá trình phỏng vấn. Vui lòng thử lại hoặc bắt đầu lại cuộc phỏng vấn.',
        true
      );
      addMessageToConversation(setConversation, errorMessage, speakAiResponse, isSpeechEnabled, isSpeakerOn);
    } finally {
      setIsAiThinking(false);
      setIsAnalyzing(false);
    }
  };

  // Hàm tóm tắt history cho AI
  const getHistorySummary = () => {
    if (history.length === 0) return '';
    return history.map((stage, idx) =>
      `Câu hỏi ${idx + 1}: ${stage.question}\nTrả lời: ${stage.answer}`
    ).join('\n\n');
  };

  const getSkillsForPosition = (pos: string) => {
    const skillsMap: Record<string, string> = {
      'Frontend Developer': 'HTML, CSS, JavaScript, React, UI/UX',
      'Backend Developer': 'Node.js, Express, Python, Databases, API Design',
      'Full Stack Developer': 'Frontend, Backend, Databases, System Architecture',
      'UX/UI Designer': 'Design Principles, UX Research, Figma, Adobe XD',
      'Product Manager': 'Product Strategy, User Research, Agile, Roadmapping',
      'Data Analyst': 'SQL, Excel, Data Visualization, Statistics',
      'DevOps Engineer': 'CI/CD, AWS, Docker, Kubernetes, Monitoring',
      'Mobile Developer': 'React Native, Flutter, iOS, Android',
      'QA Engineer': 'Testing Methodologies, Test Automation, Quality Assurance'
    };
    return skillsMap[pos] || 'giao tiếp, giải quyết vấn đề, làm việc nhóm';
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Phase handling functions
  const handleIntroductionPhase = async (
    message: string,
    setConversation: React.Dispatch<React.SetStateAction<any[]>>,
    setInterviewState: React.Dispatch<React.SetStateAction<any>>,
    speakAiResponse: (text: string) => void,
    isSpeechEnabled: boolean,
    isSpeakerOn: boolean,
    position: string
  ) => {
    const topics = await extractTopics(message);
    if (!topics || topics.length === 0) {
      const skills = getSkillsForPosition(position);
      const clarificationMessage = createMessage(
        'ai',
        `Tôi thấy bạn chưa giới thiệu về bản thân và kinh nghiệm làm việc. Bạn có thể giới thiệu ngắn gọn về:\n1. Tên và vị trí hiện tại của bạn\n2. Kinh nghiệm làm việc trong lĩnh vực ${position}\n3. Các kỹ năng chính của bạn\n\nĐối với vị trí ${position}, chúng tôi thường tìm kiếm các kỹ năng như: ${skills}.`
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
        `Xin lỗi, tôi gặp khó khăn khi tạo câu hỏi chi tiết về chủ đề ${firstTopic}. Bạn có muốn thử giới thiệu lại hoặc tập trung vào các kỹ năng khác không?`
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
      `Cảm ơn bạn đã giới thiệu rất chi tiết về bản thân và kinh nghiệm làm việc! Bây giờ chúng ta sẽ bắt đầu với các câu hỏi chuyên môn.\n\n${questions[0]}`
    );
    addMessageToConversation(setConversation, thankMessage, speakAiResponse, isSpeechEnabled, isSpeakerOn);
  };

  const handleInterviewingPhase = async (
    message: string,
    interviewState: any,
    setInterviewState: React.Dispatch<React.SetStateAction<any>>,
    setConversation: React.Dispatch<React.SetStateAction<any[]>>,
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
        'Xin lỗi, có lỗi xảy ra khi xử lý câu hỏi hiện tại. Chúng ta hãy thử chuyển sang chủ đề khác nhé.',
        true
      );
      addMessageToConversation(setConversation, errorMessage, speakAiResponse, isSpeechEnabled, isSpeakerOn);
      await handleQuestionTransition(interviewState, setInterviewState, setConversation, setInterviewing, speakAiResponse, isSpeechEnabled, isSpeakerOn);
      return;
    }
    const evaluation = await evaluateAnswer(currentQuestion, message, getHistorySummary());
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
        'Xin lỗi, có lỗi xảy ra khi đánh giá câu trả lời của bạn. Chúng ta hãy thử chuyển sang câu hỏi tiếp theo nhé.',
        true
      );
      addMessageToConversation(setConversation, errorMessage, speakAiResponse, isSpeechEnabled, isSpeakerOn);
      await handleQuestionTransition(interviewState, setInterviewState, setConversation, setInterviewing, speakAiResponse, isSpeechEnabled, isSpeakerOn);
      return;
    }
    // --- Markdown formatting improvement ---
    let responseText = `**Đánh giá câu trả lời:**\n`;
    responseText += `- **Điểm:** \`${evaluation.score}/10\`\n`;
    responseText += `- **Nhận xét:** ${evaluation.feedback}\n`;
    if (evaluation.strengths && evaluation.strengths.length > 0) {
      responseText += `- **Điểm mạnh:**\n`;
      responseText += evaluation.strengths.map((s: string) => `  - ${s}`).join("\n") + "\n";
    }
    if (evaluation.missingPoints && evaluation.missingPoints.length > 0) {
      responseText += `- **Thiếu sót cần bổ sung:**\n`;
      responseText += evaluation.missingPoints.map((p: string) => `  - ${p}`).join("\n") + "\n";
    }
    if (evaluation.suggestedImprovements && evaluation.suggestedImprovements.length > 0) {
      responseText += `- **Gợi ý cải thiện:**\n`;
      responseText += evaluation.suggestedImprovements.map((i: string) => `  - ${i}`).join("\n") + "\n";
    }
    if (evaluation.followUpQuestions && evaluation.followUpQuestions.length > 0) {
      responseText += `\n**Câu hỏi tiếp theo:**\n- ${evaluation.followUpQuestions[0]}`;
    }
    const responseMessage = createMessage('ai', responseText);
    addMessageToConversation(setConversation, responseMessage, speakAiResponse, isSpeechEnabled, isSpeakerOn);
    if (evaluation.isComplete && (!evaluation.followUpQuestions || evaluation.followUpQuestions.length === 0)) {
      await handleQuestionTransition(interviewState, setInterviewState, setConversation, setInterviewing, speakAiResponse, isSpeechEnabled, isSpeakerOn);
    }
  };

  // Fix: increment currentQuestionIndex only AFTER sending the next question
  const handleQuestionTransition = async (
    interviewState: any,
    setInterviewState: React.Dispatch<React.SetStateAction<any>>,
    setConversation: React.Dispatch<React.SetStateAction<any[]>>,
    setInterviewing: React.Dispatch<React.SetStateAction<boolean>>,
    speakAiResponse: (text: string) => void,
    isSpeechEnabled: boolean,
    isSpeakerOn: boolean
  ) => {
    const nextQuestionIndex = interviewState.currentQuestionIndex + 1;
    if (nextQuestionIndex < interviewState.questions.length) {
      const nextQuestion = createMessage('ai', interviewState.questions[nextQuestionIndex]);
      addMessageToConversation(setConversation, nextQuestion, speakAiResponse, isSpeechEnabled, isSpeakerOn);
      setInterviewState((prev: any) => ({
        ...prev,
        currentQuestionIndex: nextQuestionIndex
      }));
      return;
    }
    await handleTopicTransition(interviewState, setInterviewState, setConversation, setInterviewing, speakAiResponse, isSpeechEnabled, isSpeakerOn);
  };

  const handleTopicTransition = async (
    interviewState: any,
    setInterviewState: React.Dispatch<React.SetStateAction<any>>,
    setConversation: React.Dispatch<React.SetStateAction<any[]>>,
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
          `Xin lỗi, tôi gặp khó khăn khi tạo câu hỏi chi tiết về chủ đề ${nextTopic}. Chúng ta có thể chuyển sang chủ đề khác hoặc kết thúc phỏng vấn.`
        );
        addMessageToConversation(setConversation, noQuestionsMessage, speakAiResponse, isSpeechEnabled, isSpeakerOn);
        const nextNextTopicIndex = nextTopicIndex + 1;
        if (nextNextTopicIndex < interviewState.topics.length) {
          setInterviewState((prev: any) => ({
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
      setInterviewState((prev: any) => ({
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
    setInterviewState: React.Dispatch<React.SetStateAction<any>>,
    setInterviewing: React.Dispatch<React.SetStateAction<boolean>>,
    setConversation: React.Dispatch<React.SetStateAction<any[]>>,
    speakAiResponse: (text: string) => void,
    isSpeechEnabled: boolean,
    isSpeakerOn: boolean
  ) => {
    setInterviewState((prev: any) => ({
      ...prev,
      phase: 'completed'
    }));
    const endingMessage = createMessage(
      'ai',
      'Cảm ơn bạn đã tham gia buổi phỏng vấn. Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.'
    );
    addMessageToConversation(setConversation, endingMessage, speakAiResponse, isSpeechEnabled, isSpeakerOn);
    setInterviewing(false);
  };

  // Hàm lấy câu trả lời user mới nhất
  const getLatestUserAnswer = () => {
    if (history.length === 0) return null;
    return history[history.length - 1].answer;
  };

  // Hàm kết thúc phỏng vấn sớm
  const handleEndInterview = () => {
    setShowResult(true);
  };

  // Hàm luyện tập lại
  const handleReset = () => {
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Progress value={100} className="w-1/2" />
      </div>
    );
  }

  const positionOptions = CATEGORY_ROLE_OPTIONS.find(c => c.category === category)?.roles || [];

  return (
    <div className="max-w-7xl mx-auto p-6">
        {!interviewing ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cột trái: Form chọn thông tin phỏng vấn */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Chọn lĩnh vực phỏng vấn</CardTitle>
                <CardDescription>
                  Chọn lĩnh vực bạn muốn luyện tập và cấp độ phù hợp với kinh nghiệm của bạn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Ngành nghề/Lĩnh vực</Label>
                    <Select value={category} onValueChange={(value) => {
                      setCategory(value);
                      const newRoles = CATEGORY_ROLE_OPTIONS.find(c => c.category === value)?.roles || [];
              setPosition(newRoles[0] || '');
                    }}>
                      <SelectTrigger id="category" className="w-full">
                        <SelectValue placeholder="Chọn lĩnh vực" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORY_ROLE_OPTIONS.map((option) => (
                          <SelectItem key={option.category} value={option.category}>{option.category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Vị trí ứng tuyển</Label>
                    <Select value={position} onValueChange={setPosition}>
                      <SelectTrigger id="position" className="w-full">
                        <SelectValue placeholder="Chọn vị trí" />
                      </SelectTrigger>
                      <SelectContent>
                        {positionOptions.map((role) => (
                          <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Cấp độ phỏng vấn */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h3 className="font-medium text-blue-800 mb-2 flex items-center">
                    <Briefcase className="w-5 h-5 mr-2" />
                    Chọn cấp độ phỏng vấn:
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {levelOptions.map((lv) => (
                      <div
                        key={lv}
                        className={`border rounded-lg p-3 cursor-pointer ${level === lv ? 'bg-amber-50 border-amber-300 shadow-sm' : 'hover:border-gray-300 hover:bg-gray-50'}`}
                        onClick={() => setLevel(lv)}
                      >
                        <div className="font-medium mb-1">{lv}</div>
                        <div className="text-xs text-gray-600">
                          {lv === 'Junior' ? '0-2 năm kinh nghiệm' : lv === 'Mid-level' ? '2-5 năm kinh nghiệm' : lv === 'Senior' ? '5+ năm kinh nghiệm' : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Ngôn ngữ phỏng vấn */}
                <div className="space-y-2">
                  <Label htmlFor="language">Ngôn ngữ phỏng vấn</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Chọn ngôn ngữ" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Thời gian phỏng vấn */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="duration">Thời gian phỏng vấn: {duration} phút</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    {[5, 10, 15, 20, 30].map((t) => (
                      <Button
                        key={t}
                        variant={t === duration ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDuration(t)}
                      >
                        {t} phút
                      </Button>
                    ))}
                  </div>
                </div>
                {/* Tương tác giọng nói */}
                <div className="flex items-center justify-between pt-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="voice">Tương tác giọng nói</Label>
                    <p className="text-sm text-muted-foreground">Bật nhận diện giọng nói và đọc văn bản</p>
                  </div>
                  <Switch id="voice" checked={isSpeechEnabled} onCheckedChange={setIsSpeechEnabled} />
                </div>
                {/* Thông tin phỏng vấn */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-medium mb-2">Thông tin phỏng vấn:</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start"><CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" /><span><strong>Câu hỏi phỏng vấn thực tế</strong> cho vị trí {position}</span></li>
                    <li className="flex items-start"><CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" /><span><strong>Giới hạn thời gian</strong> cho mỗi câu hỏi</span></li>
                    <li className="flex items-start"><CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" /><span><strong>Phân tích chi tiết</strong> từ AI về câu trả lời của bạn</span></li>
                    <li className="flex items-start"><CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" /><span><strong>Đề xuất cải thiện</strong> cụ thể cho từng câu trả lời</span></li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={startInterview} className="w-full text-lg font-semibold">Bắt đầu phỏng vấn</Button>
              </CardFooter>
            </Card>
          </div>
          {/* Cột phải: Các card phụ */}
          <div className="space-y-6">
            {/* Tiêu chí đánh giá */}
            <Card>
              <CardHeader>
                <CardTitle>Tiêu chí đánh giá</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <MessageSquare className="h-8 w-8 text-blue-500" />
                  <div>
                    <h4 className="font-medium">Giao tiếp rõ ràng</h4>
                    <p className="text-sm text-gray-600">Đánh giá khả năng diễn đạt ý tưởng</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <Brain className="h-8 w-8 text-purple-500" />
                  <div>
                    <h4 className="font-medium">Tư duy logic</h4>
                    <p className="text-sm text-gray-600">Đánh giá cách tiếp cận vấn đề</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-100">
                  <Award className="h-8 w-8 text-green-500" />
                  <div>
                    <h4 className="font-medium">Trình độ ngôn ngữ</h4>
                    <p className="text-sm text-gray-600">Đánh giá từ vựng và ngữ pháp</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Tại sao nên luyện tập phỏng vấn? */}
            <Card>
              <CardHeader>
                <CardTitle>Tại sao nên luyện tập phỏng vấn?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3"><div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">1</div><div><h4 className="font-medium">Xây dựng sự tự tin</h4><p className="text-sm text-gray-600">Luyện tập trước giúp bạn tự tin hơn khi tham gia phỏng vấn thực tế.</p></div></div>
                <div className="flex items-start space-x-3"><div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">2</div><div><h4 className="font-medium">Cải thiện kỹ năng trả lời</h4><p className="text-sm text-gray-600">Nhận phản hồi chi tiết giúp bạn cải thiện cách trả lời câu hỏi phỏng vấn.</p></div></div>
                <div className="flex items-start space-x-3"><div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">3</div><div><h4 className="font-medium">Chuẩn bị kỹ lưỡng</h4><p className="text-sm text-gray-600">Làm quen với các câu hỏi phổ biến trong lĩnh vực của bạn.</p></div></div>
              </CardContent>
            </Card>
            {/* Vị trí đã chọn */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Vị trí đã chọn</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between items-center"><span className="text-sm font-medium">Lĩnh vực:</span><Badge variant="outline">{category}</Badge></div>
                  <Separator className="my-1" />
                  <div className="flex justify-between items-center"><span className="text-sm font-medium">Vị trí:</span><Badge variant="outline">{position}</Badge></div>
                  <Separator className="my-1" />
                  <div className="flex justify-between items-center"><span className="text-sm font-medium">Cấp độ:</span><Badge variant="outline">{level}</Badge></div>
                  <Separator className="my-1" />
                  <div className="flex justify-between items-center"><span className="text-sm font-medium">Thời gian:</span><Badge variant="outline">{duration} phút</Badge></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        ) : showResult ? (
          <ResultsSummary
            results={{
              duration,
              position,
              level,
              scores: {
                communicationClarity: 70,
                logicalReasoning: 80,
                languageFluency: 75,
                overall: 75,
              },
              messages: conversation,
              timestamp: new Date().toISOString(),
            }}
            settings={{ position, level, duration, language }}
            onReset={handleReset}
          />
        ) : (
          <InterviewChat
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
            handleKeyPress={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            duration={duration}
            onEndInterview={handleEndInterview}
          />
        )}
    </div>
  );
}
