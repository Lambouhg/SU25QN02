import { ChatMessage, callOpenAI } from './openaiService';
import { InterviewEvaluation } from './Avatar-AI';

// Detailed evaluation criteria by position and level
interface EvaluationCriteria {
  position: string;
  level: string;
  technicalWeight: number;
  skillRequirements: {
    technical: string[];
    soft: string[];
    experience: string[];
  };
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  benchmarks: {
    junior: { technical: number; experience: number; leadership: number };
    mid: { technical: number; experience: number; leadership: number };
    senior: { technical: number; experience: number; leadership: number };
  };
}

const EVALUATION_CRITERIA: Record<string, EvaluationCriteria> = {
  "Frontend": {
    position: "Frontend Developer",
    level: "all",
    technicalWeight: 0.7,
    skillRequirements: {
      technical: [
        "HTML/CSS proficiency",
        "JavaScript/TypeScript knowledge", 
        "Frontend frameworks (React, Vue, Angular)",
        "State management",
        "Build tools and bundlers",
        "Browser APIs and performance",
        "Responsive design",
        "Testing practices",
        "Accessibility standards",
        "UI/UX understanding"
      ],
      soft: [
        "Communication clarity",
        "Problem-solving approach",
        "Attention to detail",
        "User empathy",
        "Design collaboration",
        "Learning agility"
      ],
      experience: [
        "Real project examples",
        "Code organization",
        "Performance optimization",
        "Cross-browser compatibility",
        "Team collaboration"
      ]
    },
    salaryRange: { min: 12000000, max: 45000000, currency: "VND" },
    benchmarks: {
      junior: { technical: 6, experience: 4, leadership: 2 },
      mid: { technical: 7.5, experience: 7, leadership: 5 },
      senior: { technical: 8.5, experience: 8.5, leadership: 8 }
    }
  },
  "Backend": {
    position: "Backend Developer", 
    level: "all",
    technicalWeight: 0.8,
    skillRequirements: {
      technical: [
        "Server-side programming languages",
        "Database design and optimization",
        "API development (REST, GraphQL)",
        "System architecture understanding",
        "Security best practices",
        "Performance optimization",
        "Caching strategies",
        "Message queues",
        "Microservices architecture",
        "DevOps fundamentals"
      ],
      soft: [
        "Analytical thinking",
        "Problem decomposition",
        "Documentation skills",
        "System thinking",
        "Risk assessment",
        "Communication with stakeholders"
      ],
      experience: [
        "Scalable system design",
        "Database performance tuning",
        "API design patterns",
        "Security implementation",
        "Production troubleshooting"
      ]
    },
    salaryRange: { min: 15000000, max: 50000000, currency: "VND" },
    benchmarks: {
      junior: { technical: 6.5, experience: 4, leadership: 2 },
      mid: { technical: 8, experience: 7.5, leadership: 5 },
      senior: { technical: 9, experience: 9, leadership: 8.5 }
    }
  },
  "Full Stack": {
    position: "Full Stack Developer",
    level: "all", 
    technicalWeight: 0.75,
    skillRequirements: {
      technical: [
        "Frontend technologies proficiency",
        "Backend development skills",
        "Database management",
        "API integration",
        "System architecture",
        "DevOps understanding",
        "Testing across stack",
        "Security implementation",
        "Performance optimization",
        "Technology integration"
      ],
      soft: [
        "Versatility and adaptability",
        "Project management",
        "Cross-functional communication",
        "Problem-solving across domains",
        "Learning agility",
        "Technical leadership"
      ],
      experience: [
        "End-to-end development",
        "Technology stack decisions",
        "Integration challenges",
        "Performance across layers",
        "Team collaboration"
      ]
    },
    salaryRange: { min: 18000000, max: 55000000, currency: "VND" },
    benchmarks: {
      junior: { technical: 6, experience: 4.5, leadership: 3 },
      mid: { technical: 7.5, experience: 7.5, leadership: 6 },
      senior: { technical: 8.5, experience: 9, leadership: 8.5 }
    }
  }
};

function getLevelBenchmark(level: string): 'junior' | 'mid' | 'senior' {
  const normalizedLevel = level.toLowerCase();
  if (normalizedLevel.includes('junior') || normalizedLevel.includes('fresher')) return 'junior';
  if (normalizedLevel.includes('senior') || normalizedLevel.includes('lead')) return 'senior';
  return 'mid';
}

function getSalaryRange(position: string, level: string): { min: number; max: number; currency: string } {
  const criteria = EVALUATION_CRITERIA[position] || EVALUATION_CRITERIA["Full Stack"];
  const levelBenchmark = getLevelBenchmark(level);
  
  const baseRange = criteria.salaryRange;
  const multipliers = {
    junior: { min: 0.6, max: 0.8 },
    mid: { min: 0.8, max: 1.0 },
    senior: { min: 1.0, max: 1.3 }
  };
  
  const multiplier = multipliers[levelBenchmark];
  return {
    min: Math.round(baseRange.min * multiplier.min),
    max: Math.round(baseRange.max * multiplier.max),
    currency: baseRange.currency
  };
}

export async function generateInterviewEvaluation(
  conversation: ChatMessage[],
  field: string,
  level: string,
  language: 'vi-VN' | 'en-US'
): Promise<InterviewEvaluation> {
  try {
    // Use the provided level parameter instead of extracting from conversation
    const criteria = EVALUATION_CRITERIA[field] || EVALUATION_CRITERIA["Full Stack"];
    const levelBenchmark = getLevelBenchmark(level);
    const benchmarks = criteria.benchmarks[levelBenchmark];
    const salaryRange = getSalaryRange(field, level);

    const prompt = `You are a senior technical interviewer specializing in ${field} positions. 
You are evaluating a candidate for a ${level} ${field} developer role.

EVALUATION FRAMEWORK:
Position: ${criteria.position}
Level: ${level}
Technical Weight: ${criteria.technicalWeight * 100}%

TECHNICAL REQUIREMENTS FOR ${field.toUpperCase()}:
${criteria.skillRequirements.technical.map(skill => `- ${skill}`).join('\n')}

SOFT SKILLS REQUIREMENTS:
${criteria.skillRequirements.soft.map(skill => `- ${skill}`).join('\n')}

EXPERIENCE EXPECTATIONS:
${criteria.skillRequirements.experience.map(exp => `- ${exp}`).join('\n')}

BENCHMARK SCORES FOR ${level.toUpperCase()} LEVEL:
- Technical Competency: ${benchmarks.technical}/10 (minimum expected)
- Experience Level: ${benchmarks.experience}/10 (minimum expected)  
- Leadership/Collaboration: ${benchmarks.leadership}/10 (minimum expected)

EVALUATION INSTRUCTIONS:
1. Analyze the conversation thoroughly for technical depth, accuracy, and breadth
2. Assess communication clarity, problem-solving approach, and cultural fit
3. Compare against ${level} level expectations for ${field}
4. Consider real-world application and practical knowledge
5. Evaluate learning potential and growth mindset

SCORING GUIDELINES:
- 8-10: Exceeds expectations for ${level} level
- 6-7: Meets expectations for ${level} level  
- 4-5: Below expectations, may need development
- 1-3: Significantly below expectations

HIRING RECOMMENDATIONS:
- strong_hire: Exceptional candidate, significantly exceeds expectations
- hire: Good candidate, meets or exceeds most expectations
- consider: Mixed results, some concerns but potential upside
- reject: Does not meet minimum requirements for ${level} level

Please respond in ${language === 'vi-VN' ? 'Vietnamese' : 'English'} with detailed analysis.

REQUIRED JSON FORMAT:
{
  "technicalScore": number (1-10, weighted heavily for technical roles),
  "communicationScore": number (1-10),
  "problemSolvingScore": number (1-10),
  "cultureFitScore": number (1-10),
  "overallRating": number (1-10, calculated based on weighted scores),
  "technicalStrengths": string[] (specific technical strengths observed),
  "technicalWeaknesses": string[] (areas needing improvement),
  "recommendations": string[] (actionable development suggestions),
  "hiringRecommendation": "strong_hire" | "hire" | "consider" | "reject",
  "detailedFeedback": {
    "technical": string (detailed technical assessment),
    "softSkills": string (communication, collaboration, problem-solving),
    "experience": string (practical knowledge and real-world application),
    "potential": string (growth potential and learning ability)
  },
  "salary_range": {
    "min": ${salaryRange.min},
    "max": ${salaryRange.max}, 
    "currency": "${salaryRange.currency}"
  },
  "levelAssessment": {
    "currentLevel": string (assessed level based on performance),
    "readinessForNextLevel": boolean,
    "gapAnalysis": string[] (skills needed for advancement)
  }
}`;

    const messages: ChatMessage[] = [
      { role: 'system', content: prompt },
      { role: 'user', content: `Please evaluate this ${field} interview conversation:` },
      ...conversation
    ];

    const response = await callOpenAI(messages);
    
    if (!response.choices || !response.choices[0]?.message?.content) {
      throw new Error('Invalid response from AI');
    }

    let content = response.choices[0].message.content.trim();
    
    // Remove any markdown formatting if present
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Try to find JSON object if there's additional text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      content = jsonMatch[0];
    }
    
    // If content doesn't look like JSON, return comprehensive default evaluation
    if (!content.startsWith('{') || !content.endsWith('}')) {
      console.warn('AI returned non-JSON response, using enhanced default evaluation');
      return generateDefaultEvaluation(field, level, language, salaryRange);
    }

    const evaluation = JSON.parse(content);
    
    // Ensure all required fields are present and valid
    const validatedEvaluation: InterviewEvaluation = {
      technicalScore: validateScore(evaluation.technicalScore),
      communicationScore: validateScore(evaluation.communicationScore),
      problemSolvingScore: validateScore(evaluation.problemSolvingScore),
      cultureFitScore: validateScore(evaluation.cultureFitScore),
      overallRating: validateScore(evaluation.overallRating),
      technicalStrengths: Array.isArray(evaluation.technicalStrengths) ? evaluation.technicalStrengths : [],
      technicalWeaknesses: Array.isArray(evaluation.technicalWeaknesses) ? evaluation.technicalWeaknesses : [],
      recommendations: Array.isArray(evaluation.recommendations) ? evaluation.recommendations : [],
      hiringRecommendation: ['strong_hire', 'hire', 'consider', 'reject'].includes(evaluation.hiringRecommendation) 
        ? evaluation.hiringRecommendation 
        : 'consider',
      detailedFeedback: {
        technical: evaluation.detailedFeedback?.technical || (language === 'vi-VN' ? 'Cần đánh giá thêm' : 'Needs further assessment'),
        softSkills: evaluation.detailedFeedback?.softSkills || (language === 'vi-VN' ? 'Cần đánh giá thêm' : 'Needs further assessment'),
        experience: evaluation.detailedFeedback?.experience || (language === 'vi-VN' ? 'Cần đánh giá thêm' : 'Needs further assessment'),
        potential: evaluation.detailedFeedback?.potential || (language === 'vi-VN' ? 'Cần đánh giá thêm' : 'Needs further assessment')
      },
      salary_range: {
        min: evaluation.salary_range?.min || salaryRange.min,
        max: evaluation.salary_range?.max || salaryRange.max,
        currency: evaluation.salary_range?.currency || salaryRange.currency
      },
      levelAssessment: evaluation.levelAssessment ? {
        currentLevel: evaluation.levelAssessment.currentLevel || level,
        readinessForNextLevel: Boolean(evaluation.levelAssessment.readinessForNextLevel),
        gapAnalysis: Array.isArray(evaluation.levelAssessment.gapAnalysis) ? evaluation.levelAssessment.gapAnalysis : []
      } : undefined
    };
    
    return validatedEvaluation;
  } catch (error) {
    console.error('Error generating interview evaluation:', error);
    
    // Use the provided level parameter for error case
    const defaultSalaryRange = getSalaryRange(field, level);
    return generateDefaultEvaluation(field, level, language, defaultSalaryRange);
  }
}

function validateScore(score: unknown): number {
  const numScore = Number(score);
  if (isNaN(numScore) || numScore < 1 || numScore > 10) {
    return 5; // Default middle score
  }
  return Math.round(numScore);
}

function generateDefaultEvaluation(
  field: string, 
  level: string, 
  language: 'vi-VN' | 'en-US',
  salaryRange: { min: number; max: number; currency: string }
): InterviewEvaluation {
  const criteria = EVALUATION_CRITERIA[field] || EVALUATION_CRITERIA["Full Stack"];
  const levelBenchmark = getLevelBenchmark(level);
  const benchmarks = criteria.benchmarks[levelBenchmark];
  
  return {
    technicalScore: benchmarks.technical,
    communicationScore: 6,
    problemSolvingScore: 6,
    cultureFitScore: 6,
    overallRating: Math.round((benchmarks.technical * criteria.technicalWeight + 6 * (1 - criteria.technicalWeight))),
    technicalStrengths: [
      language === 'vi-VN' ? `Kiến thức cơ bản về ${field}` : `Basic knowledge of ${field}`,
      language === 'vi-VN' ? 'Tiềm năng phát triển' : 'Development potential'
    ],
    technicalWeaknesses: [
      language === 'vi-VN' ? 'Cần đánh giá kỹ thuật chi tiết hơn' : 'Needs more detailed technical assessment',
      language === 'vi-VN' ? 'Thiếu thông tin về kinh nghiệm thực tế' : 'Limited information on practical experience'
    ],
    recommendations: [
      language === 'vi-VN' ? `Tiến hành phỏng vấn kỹ thuật sâu hơn về ${field}` : `Conduct deeper technical interview on ${field}`,
      language === 'vi-VN' ? 'Đánh giá qua bài tập thực tế' : 'Evaluate through practical assignments',
      language === 'vi-VN' ? 'Kiểm tra portfolio và dự án cá nhân' : 'Review portfolio and personal projects'
    ],
    hiringRecommendation: 'consider' as const,
    detailedFeedback: {
      technical: language === 'vi-VN' 
        ? `Ứng viên cho thấy hiểu biết cơ bản về ${field}. Cần đánh giá sâu hơn về kinh nghiệm thực tế và khả năng áp dụng kiến thức vào dự án thực tế.`
        : `Candidate shows basic understanding of ${field}. Further assessment needed on practical experience and ability to apply knowledge to real projects.`,
      softSkills: language === 'vi-VN'
        ? 'Khả năng giao tiếp ở mức trung bình. Cần đánh giá thêm về kỹ năng làm việc nhóm và giải quyết vấn đề.'
        : 'Communication skills at average level. Additional assessment needed on teamwork and problem-solving skills.',
      experience: language === 'vi-VN'
        ? `Kinh nghiệm ${level} cần được xác minh qua các dự án cụ thể và thử thách kỹ thuật.`
        : `${level} experience needs verification through specific projects and technical challenges.`,
      potential: language === 'vi-VN'
        ? 'Cho thấy tiềm năng học hỏi và phát triển. Nên đầu tư thời gian đào tạo và hỗ trợ.'
        : 'Shows learning potential and development capability. Should invest in training and support.'
    },
    salary_range: salaryRange,
    levelAssessment: {
      currentLevel: levelBenchmark,
      readinessForNextLevel: false,
      gapAnalysis: [
        language === 'vi-VN' ? `Cần cải thiện kiến thức chuyên sâu về ${field}` : `Need to improve deep knowledge of ${field}`,
        language === 'vi-VN' ? 'Tăng cường kinh nghiệm thực tế' : 'Strengthen practical experience',
        language === 'vi-VN' ? 'Phát triển kỹ năng giao tiếp kỹ thuật' : 'Develop technical communication skills'
      ]
    }
  };
}
