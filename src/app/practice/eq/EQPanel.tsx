"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Container, Typography, Box, CircularProgress } from '@mui/material';
import PreInterviewSetup from '@/components/InterviewPractice/PreInterviewSetup';
import InterviewChat from '@/components/InterviewPractice/InterviewChat';
import InterviewGuidelines from '@/components/InterviewPractice/InterviewGuidelines';
import { extractTopics, generateQuestionsForTopic, evaluateAnswer } from '@/services/interviewService';
import { startSpeechRecognition, stopSpeechRecognition, textToSpeech } from '@/utils/speech/azureSpeechUtils';

const CATEGORY_ROLE_OPTIONS = [
  {
    category: "Quản lý & Lãnh đạo",
    roles: [
      "Team Leader",
      "Project Manager",
      "HR Manager"
    ]
  },
  {
    category: "Dịch vụ & Hỗ trợ",
    roles: [
      "Customer Service",
      "Sales Representative",
      "Counselor",
      "Healthcare Professional"
    ]
  },
  {
    category: "Giáo dục",
    roles: [
      "Teacher"
    ]
  }
];

const levelOptions = ['Entry Level', 'Mid-level', 'Senior', 'Executive'];
const LANGUAGES = [
  { key: 'vi', value: 'vi-VN', label: 'Tiếng Việt' },
  { key: 'en', value: 'en-US', label: 'English' }
];

let messageCounter = 0;

const createMessage = (sender: string, text: string, isError = false) => ({
  id: `msg_${++messageCounter}`,
  sender,
  text,
  timestamp: new Date().toISOString(),
  isError
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

// Define type for conversation message
interface ConversationMessage {
  id: string | number;
  sender: 'user' | 'ai';
  text: string;
  timestamp?: string;
  isError?: boolean;
}

export default function EQPanel() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [interviewing, setInterviewing] = useState(false);
  // Add state for selected category and dynamic position options
  const [category, setCategory] = useState(CATEGORY_ROLE_OPTIONS[0].category);
  const positionOptions = CATEGORY_ROLE_OPTIONS.find(c => c.category === category)?.roles || [];
  const [position, setPosition] = useState(positionOptions[0]);
  const [level, setLevel] = useState('Entry Level');
  const [language, setLanguage] = useState('vi-VN');
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

  useEffect(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [conversation]);

  // Speech handlers
  const startSpeechInteraction = () => {
    if (!isSpeechEnabled || typeof window === 'undefined') return;
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
    if (!isSpeakerOn || !isSpeechEnabled || typeof window === 'undefined') return;
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
    const initialMessage: ConversationMessage = {
      id: Date.now(),
      sender: 'ai',
      text: `Xin chào! Tôi là AI EQ Interviewer. Hôm nay chúng ta sẽ tiến hành đánh giá EQ cho vị trí ${position} (${level}). Trước tiên, bạn có thể chia sẻ về một tình huống khó khăn trong công việc mà bạn đã gặp phải và cách bạn đã xử lý nó không?`,
      timestamp: new Date().toISOString()
    };
    setConversation([initialMessage]);
    if (isSpeechEnabled && isSpeakerOn) {
      speakAiResponse(initialMessage.text);
    }
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
        'Xin lỗi, đã có lỗi xảy ra trong quá trình đánh giá. Vui lòng thử lại hoặc bắt đầu lại.',
        true
      );
      addMessageToConversation(setConversation, errorMessage, speakAiResponse, isSpeechEnabled, isSpeakerOn);
    } finally {
      setIsAiThinking(false);
      setIsAnalyzing(false);
    }
  };

  const getEQSkillsForPosition = (pos: string) => {
    const skillsMap: Record<string, string> = {
      'Team Leader': 'Lãnh đạo, Giao tiếp, Giải quyết xung đột, Động viên nhóm',
      'Project Manager': 'Quản lý stress, Giao tiếp, Đàm phán, Làm việc nhóm',
      'HR Manager': 'Thấu hiểu, Giao tiếp, Giải quyết xung đột, Đánh giá',
      'Customer Service': 'Thấu hiểu, Kiên nhẫn, Giao tiếp, Giải quyết vấn đề',
      'Sales Representative': 'Thuyết phục, Kiên trì, Giao tiếp, Xử lý từ chối',
      'Teacher': 'Kiên nhẫn, Thấu hiểu, Giao tiếp, Động viên',
      'Counselor': 'Thấu hiểu, Lắng nghe, Đồng cảm, Giữ bí mật',
      'Healthcare Professional': 'Đồng cảm, Kiên nhẫn, Giao tiếp, Xử lý stress'
    };
    return skillsMap[pos] || 'giao tiếp, thấu hiểu, giải quyết vấn đề, làm việc nhóm';
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
      const skills = getEQSkillsForPosition(position);
      const clarificationMessage = createMessage(
        'ai',
        `Tôi thấy bạn chưa chia sẻ đầy đủ về tình huống khó khăn. Bạn có thể chia sẻ chi tiết hơn về:\n1. Tình huống cụ thể bạn đã gặp phải\n2. Cảm xúc của bạn và những người liên quan\n3. Cách bạn đã xử lý tình huống\n4. Kết quả và bài học rút ra\n\nĐối với vị trí ${position}, chúng tôi thường tìm kiếm các kỹ năng EQ như: ${skills}.`
      );
      addMessageToConversation(setConversation, clarificationMessage, speakAiResponse, isSpeechEnabled, isSpeakerOn);
      return;
    }

    const eqKeywords = ['cảm xúc', 'thấu hiểu', 'đồng cảm', 'giao tiếp', 'xung đột', 'giải quyết', 'stress', 'động viên', 'lắng nghe', 'kiên nhẫn', 'thuyết phục', 'đàm phán', 'lãnh đạo', 'làm việc nhóm'];
    const prioritizedTopics = topics.sort((a: string, b: string) => {
      const aIsEQ = eqKeywords.some(keyword => a.toLowerCase().includes(keyword)) ? 1 : 0;
      const bIsEQ = eqKeywords.some(keyword => b.toLowerCase().includes(keyword)) ? 1 : 0;
      return bIsEQ - aIsEQ;
    });

    const firstTopic = prioritizedTopics[0];
    const questions = await generateQuestionsForTopic(firstTopic);
    if (!questions || questions.length === 0) {
      const noQuestionsMessage = createMessage(
        'ai',
        `Xin lỗi, tôi gặp khó khăn khi tạo câu hỏi chi tiết về chủ đề ${firstTopic}. Bạn có muốn thử chia sẻ lại hoặc tập trung vào các kỹ năng khác không?`
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
    const firstQuestion = createMessage('ai', questions[0]);
    addMessageToConversation(setConversation, firstQuestion, speakAiResponse, isSpeechEnabled, isSpeakerOn);
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
    const currentQuestion = interviewState.questions[interviewState.currentQuestionIndex];
    if (!currentQuestion) {
      const errorMessage = createMessage(
        'ai',
        'Xin lỗi, có lỗi xảy ra khi xử lý câu hỏi hiện tại. Chúng ta hãy thử chuyển sang chủ đề khác nhé.',
        true
      );
      addMessageToConversation(setConversation, errorMessage, speakAiResponse, isSpeechEnabled, isSpeakerOn);
      await handleTopicTransition(interviewState, setInterviewState, setConversation, setInterviewing, speakAiResponse, isSpeechEnabled, isSpeakerOn);
      return;
    }

    const evaluation = await evaluateAnswer(currentQuestion, message);
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

    let responseText = '';
    if (evaluation.score >= 8) {
      responseText = `Rất tốt! Câu trả lời của bạn đạt ${evaluation.score}/10 điểm. ${evaluation.feedback}`;
      if (evaluation.strengths.length > 0) {
        responseText += `\n\nĐiểm mạnh của bạn:\n${evaluation.strengths.map((s: string) => `- ${s}`).join('\n')}`;
      }
    } else if (evaluation.score >= 5) {
      responseText = `Câu trả lời của bạn đạt ${evaluation.score}/10 điểm. ${evaluation.feedback}`;
      if (evaluation.missingPoints.length > 0) {
        responseText += `\n\nBạn có thể bổ sung thêm về:\n${evaluation.missingPoints.map((p: string) => `- ${p}`).join('\n')}`;
      }
    } else {
      responseText = `Câu trả lời của bạn cần cải thiện (${evaluation.score}/10 điểm). ${evaluation.feedback}`;
      if (evaluation.suggestedImprovements.length > 0) {
        responseText += `\n\nĐề xuất cải thiện:\n${evaluation.suggestedImprovements.map((i: string) => `- ${i}`).join('\n')}`;
      }
    }

    if (evaluation.followUpQuestions.length > 0) {
      responseText += `\n\nCâu hỏi tiếp theo: ${evaluation.followUpQuestions[0]}`;
    }

    const responseMessage = createMessage('ai', responseText);
    addMessageToConversation(setConversation, responseMessage, speakAiResponse, isSpeechEnabled, isSpeakerOn);

    if (evaluation.isComplete && evaluation.followUpQuestions.length === 0) {
      await handleQuestionTransition(interviewState, setInterviewState, setConversation, setInterviewing, speakAiResponse, isSpeechEnabled, isSpeakerOn);
    }
  };

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
      setInterviewState((prev: any) => ({
        ...prev,
        currentQuestionIndex: nextQuestionIndex
      }));
      const nextQuestion = createMessage('ai', interviewState.questions[nextQuestionIndex]);
      addMessageToConversation(setConversation, nextQuestion, speakAiResponse, isSpeechEnabled, isSpeakerOn);
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
          `Xin lỗi, tôi gặp khó khăn khi tạo câu hỏi chi tiết về chủ đề ${nextTopic}. Chúng ta có thể chuyển sang chủ đề khác hoặc kết thúc đánh giá.`
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
      'Cảm ơn bạn đã tham gia buổi đánh giá EQ. Chúng tôi sẽ gửi kết quả chi tiết cho bạn trong thời gian sớm nhất.'
    );
    addMessageToConversation(setConversation, endingMessage, speakAiResponse, isSpeechEnabled, isSpeakerOn);
    setInterviewing(false);
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          EQ Mode (AI Interview)
        </Typography>
        {!interviewing ? (
          <PreInterviewSetup
            category={category}
            onCategoryChange={(e: any) => {
              setCategory(e.target.value);
              const newRoles = CATEGORY_ROLE_OPTIONS.find(c => c.category === e.target.value)?.roles || [];
              setPosition(newRoles[0] || '');
            }}
            categoryOptions={CATEGORY_ROLE_OPTIONS.map(c => c.category)}
            position={position}
            isSpeechEnabled={isSpeechEnabled}
            onPositionChange={(e: any) => setPosition(e.target.value)}
            onSpeechToggle={(e: React.ChangeEvent<HTMLInputElement>) => setIsSpeechEnabled(e.target.checked)}
            onStartInterview={startInterview}
            positionOptions={positionOptions}
            level={level}
            setLevel={setLevel}
            levelOptions={levelOptions}
            language={language}
            setLanguage={setLanguage}
            LANGUAGES={LANGUAGES}
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
            onSpeechToggle={(e: React.ChangeEvent<HTMLInputElement>) => setIsSpeechEnabled(e.target.checked)}
            onMessageChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setMessage(e.target.value)}
            onSendMessage={handleSendMessage}
            messageListRef={messageListRef}
            handleKeyPress={handleKeyPress}
          />
        )}
        <InterviewGuidelines />
      </Box>
    </Container>
  );
}
