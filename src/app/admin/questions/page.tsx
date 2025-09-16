'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminQuestionsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/question-bank/questions');
  }, [router]);
  return null;
}