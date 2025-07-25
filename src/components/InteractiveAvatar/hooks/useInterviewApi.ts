import { useCallback } from 'react';

export function useInterviewApi() {
  // Lấy danh sách vị trí
  const fetchPositions = useCallback(async () => {
    const response = await fetch('/api/positions');
    if (!response.ok) throw new Error('Failed to fetch positions');
    return response.json();
  }, []);

  // Lưu kết quả phỏng vấn
  const saveInterview = useCallback(async (requestData: Record<string, unknown>, token: string) => {
    const response = await fetch('/api/interviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestData)
    });
    if (!response.ok) throw new Error('Failed to save interview');
    return response.json();
  }, []);

  return { fetchPositions, saveInterview };
} 