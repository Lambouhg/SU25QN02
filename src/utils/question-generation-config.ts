// Configuration for AI question generation anti-duplication strategies

export interface AntiDuplicationConfig {
  // Context memory settings
  maxExistingQuestions: number;
  existingQuestionContextLength: number;
  
  // Diversification settings  
  enableRandomDiversification: boolean;
  diversificationStrategies: string[];
  
  // Variation techniques
  questionFormats: string[];
  contextVariations: string[];
  aspectVariations: string[];
  
  // Hash-based deduplication
  enableHashPrefiltering: boolean;
  hashLength: number;
  
  // Similarity thresholds
  defaultSimilarityThreshold: number;
  strictSimilarityThreshold: number;
}

export const DEFAULT_ANTI_DUPLICATION_CONFIG: AntiDuplicationConfig = {
  // Context memory
  maxExistingQuestions: 50,
  existingQuestionContextLength: 100,
  
  // Diversification
  enableRandomDiversification: true,
  diversificationStrategies: [
    "Focus on practical real-world scenarios and problem-solving situations",
    "Include questions about best practices, common pitfalls, and troubleshooting", 
    "Mix theoretical knowledge with hands-on implementation questions",
    "Cover different aspects: architecture, debugging, optimization, and security",
    "Ask about decision-making processes and trade-offs between different approaches",
    "Explore edge cases and exceptional situations developers encounter",
    "Focus on team collaboration and code review scenarios",
    "Include questions about performance optimization and scalability",
    "Cover testing strategies and quality assurance practices",
    "Ask about system design and architectural decisions"
  ],
  
  // Question format variations
  questionFormats: [
    "What would you do if",
    "How would you implement", 
    "What is the best approach for",
    "Why would you choose",
    "Explain the difference between",
    "When should you use",
    "What are the pros and cons of",
    "How do you troubleshoot",
    "What steps would you take to",
    "How would you optimize"
  ],
  
  // Context variations
  contextVariations: [
    "startup environment",
    "enterprise settings", 
    "legacy systems",
    "greenfield projects",
    "remote team",
    "agile development",
    "high-traffic applications",
    "microservices architecture",
    "cloud deployment",
    "mobile applications"
  ],
  
  // Aspect variations
  aspectVariations: [
    "implementation",
    "troubleshooting", 
    "optimization",
    "security",
    "testing",
    "deployment",
    "monitoring",
    "maintenance",
    "code review",
    "documentation"
  ],
  
  // Hash settings
  enableHashPrefiltering: true,
  hashLength: 50,
  
  // Similarity thresholds
  defaultSimilarityThreshold: 0.8,
  strictSimilarityThreshold: 0.9
};

// Generate a diversification strategy
export const getRandomDiversificationStrategy = (config: AntiDuplicationConfig = DEFAULT_ANTI_DUPLICATION_CONFIG): string => {
  if (!config.enableRandomDiversification) return "";
  
  const strategies = config.diversificationStrategies;
  return strategies[Math.floor(Math.random() * strategies.length)];
};

// Generate question format variation
export const getRandomQuestionFormat = (config: AntiDuplicationConfig = DEFAULT_ANTI_DUPLICATION_CONFIG): string => {
  const formats = config.questionFormats;
  return formats[Math.floor(Math.random() * formats.length)];
};

// Generate context variation
export const getRandomContextVariation = (config: AntiDuplicationConfig = DEFAULT_ANTI_DUPLICATION_CONFIG): string => {
  const contexts = config.contextVariations;
  return contexts[Math.floor(Math.random() * contexts.length)];
};

// Generate aspect variation  
export const getRandomAspectVariation = (config: AntiDuplicationConfig = DEFAULT_ANTI_DUPLICATION_CONFIG): string => {
  const aspects = config.aspectVariations;
  return aspects[Math.floor(Math.random() * aspects.length)];
};

// Create comprehensive anti-duplication prompt
export const createAntiDuplicationPrompt = (
  existingQuestions: string[] = [],
  config: AntiDuplicationConfig = DEFAULT_ANTI_DUPLICATION_CONFIG
): string => {
  let prompt = "";
  
  // Add existing questions context
  if (existingQuestions.length > 0) {
    const limitedQuestions = existingQuestions
      .slice(0, config.maxExistingQuestions)
      .map(q => q.substring(0, config.existingQuestionContextLength));
    
    prompt += `\n\nEXISTING QUESTIONS TO AVOID DUPLICATING:\n- ${limitedQuestions.join('\n- ')}\n\nEnsure your new questions are significantly different from the above existing questions in both content and phrasing.`;
  }
  
  // Add diversification strategy
  const diversificationStrategy = getRandomDiversificationStrategy(config);
  if (diversificationStrategy) {
    prompt += `\n\nDIVERSIFICATION STRATEGY: ${diversificationStrategy}`;
  }
  
  // Add variation techniques
  const questionFormat = getRandomQuestionFormat(config);
  const contextVariation = getRandomContextVariation(config);
  const aspectVariation = getRandomAspectVariation(config);
  
  prompt += `\n\nVARIATION GUIDELINES:
- Use question format variations like: "${questionFormat}..."
- Consider context: ${contextVariation}
- Focus on aspect: ${aspectVariation}
- Ensure each question tests different knowledge areas and scenarios`;
  
  return prompt;
};

// Quick hash for pre-screening duplicates
export const generateQuestionHash = (question: string, config: AntiDuplicationConfig = DEFAULT_ANTI_DUPLICATION_CONFIG): string => {
  const normalized = question.toLowerCase().replace(/[^\w]/g, '').replace(/\s+/g, '');
  return normalized.substring(0, config.hashLength) + '_' + normalized.length;
};

// Enhanced similarity calculation
export const calculateSimilarity = (text1: string, text2: string): number => {
  const normalize = (text: string) => text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
  const words1 = normalize(text1);
  const words2 = normalize(text2);
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set(Array.from(set1).filter(x => set2.has(x)));
  const union = new Set(Array.from(set1).concat(Array.from(set2)));
  
  return intersection.size / union.size;
};

// Check if question is likely duplicate using hash and similarity
export const isDuplicateQuestion = (
  newQuestion: string,
  existingQuestions: string[],
  config: AntiDuplicationConfig = DEFAULT_ANTI_DUPLICATION_CONFIG
): boolean => {
  if (!config.enableHashPrefiltering) {
    // Fall back to similarity only
    return existingQuestions.some(existing => 
      calculateSimilarity(newQuestion, existing) > config.defaultSimilarityThreshold
    );
  }
  
  const newHash = generateQuestionHash(newQuestion, config);
  
  // First pass: quick hash comparison
  const potentialDuplicates = existingQuestions.filter(existing => {
    const existingHash = generateQuestionHash(existing, config);
    return newHash === existingHash;
  });
  
  // Second pass: detailed similarity for potential matches
  if (potentialDuplicates.length > 0) {
    return potentialDuplicates.some(existing => 
      calculateSimilarity(newQuestion, existing) > config.strictSimilarityThreshold
    );
  }
  
  // Third pass: check similarity with all questions if no hash matches
  return existingQuestions.some(existing => 
    calculateSimilarity(newQuestion, existing) > config.defaultSimilarityThreshold
  );
};
