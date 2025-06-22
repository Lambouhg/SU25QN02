'use client';

import { useEffect, useState } from 'react';
import InterviewReviewPage from './InterviewReviewPage';
import { InterviewEvaluation } from '@/services/Avatar-AI';
import { CircularProgress, Box } from '@mui/material';

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  isError?: boolean;
  isThinking?: boolean;
}

export default function ReviewPage() {
  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(null);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedEvaluation = localStorage.getItem('interviewEvaluation');
      const savedConversation = localStorage.getItem('interviewConversation');

      if (savedEvaluation && savedConversation) {
        setEvaluation(JSON.parse(savedEvaluation));
        setConversation(JSON.parse(savedConversation));
      }
    } catch (error) {
      console.error('Error loading interview data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!evaluation || !conversation.length) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        Không tìm thấy dữ liệu phỏng vấn. Vui lòng thực hiện phỏng vấn trước.
      </Box>
    );
  }

  return <InterviewReviewPage evaluation={evaluation} conversation={conversation} />;
}
