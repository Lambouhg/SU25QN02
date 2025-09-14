/**
 * Utility functions for API calls with user preferences support
 */

export interface QuestionFilters {
  page?: number;
  limit?: number;
  field?: string;
  topic?: string;
  level?: string;
  search?: string;
  useUserPreferences?: boolean;
}

/**
 * Fetch questions with optional user preference filtering
 * If useUserPreferences is true and no topic is specified,
 * API will use user's selected skills from interview preferences
 */
export async function fetchQuestionsWithPreferences(filters: QuestionFilters = {}) {
  const params = new URLSearchParams();
  
  if (filters.page) params.set('page', filters.page.toString());
  if (filters.limit) params.set('limit', filters.limit.toString());
  if (filters.field) params.set('field', filters.field);
  if (filters.topic) params.set('topic', filters.topic);
  if (filters.level) params.set('level', filters.level);
  if (filters.search) params.set('search', filters.search);
  if (filters.useUserPreferences) params.set('useUserPreferences', 'true');

  const response = await fetch(`/api/questions?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch questions');
  }
  
  return response.json();
}

/**
 * Fetch questions using user's selected skills instead of all category skills
 * This is useful for assessment, quiz, and interview modes
 */
export async function fetchQuestionsForUserSkills(options: {
  field?: string;
  level?: string;
  page?: number;
  limit?: number;
} = {}) {
  return fetchQuestionsWithPreferences({
    ...options,
    useUserPreferences: true,
  });
}