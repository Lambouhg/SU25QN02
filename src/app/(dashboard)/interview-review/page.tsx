'use client';

import { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
const InterviewReviewPage = dynamic(() => import('./InterviewReviewPage'), { ssr: false });
import { CircularProgress, Box } from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { InterviewEvaluation } from '@/services/Avatar-AI';

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  isError?: boolean;
  isThinking?: boolean;
}

// Đã import InterviewEvaluation từ services/Avatar-AI

function ReviewPageContent() {
  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(null);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const interviewId = searchParams.get('id');
        if (!interviewId) {
          setError('Không tìm thấy buổi phỏng vấn.');
          setLoading(false);
          return;
        }
        const res = await fetch(`/api/interviews/${interviewId}`);
        if (!res.ok) throw new Error('Không thể tải dữ liệu phỏng vấn.');
        const data = await res.json();
        console.log('API data:', data);
        setEvaluation(data.evaluation);
        setConversation(data.conversationHistory || []);
        console.log('Set conversation:', data.conversationHistory || []);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message || 'Lỗi không xác định khi tải dữ liệu.');
        } else {
          setError('Lỗi không xác định khi tải dữ liệu.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [searchParams]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', color: 'red' }}>{error}</Box>
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

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    }>
      <ReviewPageContent />
    </Suspense>
  );
}
