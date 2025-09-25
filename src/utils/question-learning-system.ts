// Learning system to help AI generate better questions over time

export interface QuestionQualityMetrics {
  questionId: string;
  approvalStatus: 'approved' | 'rejected' | 'pending';
  similarityScore?: number;
  userFeedback?: string;
  usageCount?: number;
  successRate?: number; // How often this question helps assess candidates well
}

export interface LearningPattern {
  pattern: string;
  category: string;
  successRate: number;
  examples: string[];
}

// Extract successful patterns from approved questions
export const extractSuccessfulPatterns = (approvedQuestions: Array<{
  stem: string;
  category: string;
  level: string;
  type: string;
  fields: string[];
}>): LearningPattern[] => {
  const patterns: Map<string, LearningPattern> = new Map();
  
  approvedQuestions.forEach(question => {
    // Extract question patterns
    const stem = question.stem.toLowerCase();
    
    // Common successful question patterns
    const questionPatterns = [
      { pattern: 'how would you', match: /how would you/g },
      { pattern: 'what is the best', match: /what is the best/g },
      { pattern: 'explain the difference', match: /explain the difference/g },
      { pattern: 'when should you', match: /when should you/g },
      { pattern: 'what are the pros and cons', match: /what are the pros and cons/g },
      { pattern: 'how do you troubleshoot', match: /how do you troubleshoot/g },
      { pattern: 'implement a solution', match: /implement.*solution/g },
      { pattern: 'optimize performance', match: /optimize.*performance/g },
      { pattern: 'handle errors', match: /handle.*error/g },
      { pattern: 'design pattern', match: /design.*pattern/g }
    ];
    
    questionPatterns.forEach(({ pattern, match }) => {
      if (match.test(stem)) {
        const key = `${pattern}_${question.category}_${question.level}`;
        const existing = patterns.get(key);
        
        if (existing) {
          existing.successRate += 1;
          existing.examples.push(question.stem.substring(0, 100));
        } else {
          patterns.set(key, {
            pattern,
            category: question.category,
            successRate: 1,
            examples: [question.stem.substring(0, 100)]
          });
        }
      }
    });
  });
  
  // Convert to array and sort by success rate
  return Array.from(patterns.values())
    .sort((a, b) => b.successRate - a.successRate)
    .slice(0, 20); // Top 20 patterns
};

// Generate learning-based prompt enhancement
export const createLearningBasedPrompt = (
  category: string,
  level: string,
  learningPatterns: LearningPattern[]
): string => {
  const relevantPatterns = learningPatterns
    .filter(p => p.category === category || p.category === 'General')
    .slice(0, 5); // Top 5 relevant patterns
  
  if (relevantPatterns.length === 0) {
    return '';
  }
  
  let prompt = '\n\nSUCCESSFUL QUESTION PATTERNS (use as inspiration):';
  
  relevantPatterns.forEach(pattern => {
    prompt += `\n- "${pattern.pattern}" questions work well (used ${pattern.successRate} times successfully)`;
    if (pattern.examples.length > 0) {
      prompt += `\n  Example: "${pattern.examples[0]}..."`;
    }
  });
  
  prompt += '\n\nUse these successful patterns as inspiration while creating unique questions.';
  
  return prompt;
};

// Quality assessment for generated questions
export const assessQuestionQuality = (
  question: string,
  learningPatterns: LearningPattern[],
  category: string
): {
  qualityScore: number;
  suggestions: string[];
  matchedPatterns: string[];
} => {
  const questionLower = question.toLowerCase();
  let qualityScore = 5; // Base score out of 10
  const suggestions: string[] = [];
  const matchedPatterns: string[] = [];
  
  // Check against successful patterns
  const relevantPatterns = learningPatterns.filter(p => 
    p.category === category || p.category === 'General'
  );
  
  relevantPatterns.forEach(pattern => {
    if (questionLower.includes(pattern.pattern)) {
      qualityScore += Math.min(2, pattern.successRate * 0.1);
      matchedPatterns.push(pattern.pattern);
    }
  });
  
  // Quality checks
  if (question.length < 50) {
    qualityScore -= 1;
    suggestions.push('Question might be too short - consider adding more context');
  }
  
  if (question.length > 300) {
    qualityScore -= 1;
    suggestions.push('Question might be too long - consider making it more concise');
  }
  
  if (!questionLower.includes('?')) {
    qualityScore -= 0.5;
    suggestions.push('Consider ending with a clear question');
  }
  
  // Check for vague terms
  const vagueTerms = ['good', 'better', 'best', 'proper', 'appropriate'];
  const hasVagueTerms = vagueTerms.some(term => questionLower.includes(term));
  if (hasVagueTerms && !questionLower.includes('best practice')) {
    qualityScore -= 0.5;
    suggestions.push('Consider being more specific than using terms like "good" or "better"');
  }
  
  // Check for practical context
  const practicalTerms = ['project', 'team', 'production', 'client', 'user', 'system', 'application'];
  const hasPracticalContext = practicalTerms.some(term => questionLower.includes(term));
  if (hasPracticalContext) {
    qualityScore += 1;
  } else {
    suggestions.push('Consider adding practical context (project, team, production scenario)');
  }
  
  return {
    qualityScore: Math.min(10, Math.max(0, qualityScore)),
    suggestions,
    matchedPatterns
  };
};

// Adaptive difficulty adjustment based on learning
export const adjustDifficultyBasedOnLearning = (
  baseDifficulty: string,
  category: string,
  learningPatterns: LearningPattern[]
): {
  adjustedDifficulty: string;
  reasoning: string;
} => {
  const categoryPatterns = learningPatterns.filter(p => p.category === category);
  
  if (categoryPatterns.length === 0) {
    return {
      adjustedDifficulty: baseDifficulty,
      reasoning: 'No learning data available for this category'
    };
  }
  
  const avgSuccessRate = categoryPatterns.reduce((sum, p) => sum + p.successRate, 0) / categoryPatterns.length;
  
  // If we have lots of successful patterns, we can be more ambitious
  if (avgSuccessRate > 10 && baseDifficulty === 'easy') {
    return {
      adjustedDifficulty: 'medium',
      reasoning: 'High success rate in this category allows for slightly higher difficulty'
    };
  }
  
  // If success rate is low, be more conservative
  if (avgSuccessRate < 3 && baseDifficulty === 'hard') {
    return {
      adjustedDifficulty: 'medium',
      reasoning: 'Lower success rate suggests being more conservative with difficulty'
    };
  }
  
  return {
    adjustedDifficulty: baseDifficulty,
    reasoning: 'Difficulty maintained based on learning patterns'
  };
};

// Generate context-aware anti-duplication strategies
export const generateContextAwareStrategies = (
  category: string,
  level: string,
  recentQuestions: string[]
): string[] => {
  const baseStrategies = [
    "Focus on practical real-world scenarios",
    "Include troubleshooting and debugging situations", 
    "Cover different architectural approaches",
    "Ask about best practices and code quality",
    "Include team collaboration scenarios"
  ];
  
  // Analyze recent questions to avoid similar approaches
  const recentApproaches = new Set<string>();
  recentQuestions.forEach(question => {
    const questionLower = question.toLowerCase();
    if (questionLower.includes('debug') || questionLower.includes('troubleshoot')) {
      recentApproaches.add('debugging');
    }
    if (questionLower.includes('team') || questionLower.includes('collaborate')) {
      recentApproaches.add('collaboration');
    }
    if (questionLower.includes('architecture') || questionLower.includes('design')) {
      recentApproaches.add('architecture');
    }
    if (questionLower.includes('performance') || questionLower.includes('optimize')) {
      recentApproaches.add('performance');
    }
  });
  
  // Filter out recently used approaches and add category-specific ones
  let strategies = baseStrategies.filter(strategy => {
    const strategyLower = strategy.toLowerCase();
    return !Array.from(recentApproaches).some(approach => strategyLower.includes(approach));
  });
  
  // Add category-specific strategies
  const categoryStrategies: Record<string, string[]> = {
    'Frontend': [
      "Focus on user experience and accessibility",
      "Include responsive design challenges",
      "Cover component architecture and state management"
    ],
    'Backend': [
      "Focus on API design and data consistency",
      "Include scalability and security considerations", 
      "Cover database optimization and caching"
    ],
    'DevOps': [
      "Focus on deployment and monitoring strategies",
      "Include infrastructure as code scenarios",
      "Cover CI/CD pipeline optimization"
    ]
  };
  
  if (categoryStrategies[category]) {
    strategies = strategies.concat(categoryStrategies[category]);
  }
  
  return strategies.slice(0, 8); // Limit to prevent token overflow
};
