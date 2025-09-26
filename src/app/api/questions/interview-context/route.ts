import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Question context for adaptive interview flow
interface QuestionContext {
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  skill: string;
  prerequisiteTopics?: string[];
  followUpTopics?: string[];
  conditionalQuestions?: {
    onGoodAnswer: string[];
    onPoorAnswer: string[];
    onExcellentAnswer: string[];
  };
}

interface QuestionWithContext {
  id: string;
  question: string;
  context?: QuestionContext;
  difficulty?: 'easy' | 'medium' | 'hard';
  topic?: string;
  skills?: string[];
}

// Type for database question
interface DbQuestion {
  id: string;
  stem: string;
  fields: string[];
  skills: string[];
  topics: string[];
  category?: string | null;
  difficulty?: 'easy' | 'medium' | 'hard' | null;
}

// Predefined question contexts for different topics
const QUESTION_CONTEXTS: Record<string, QuestionContext> = {
  'basic_html': {
    difficulty: 'easy',
    topic: 'HTML Fundamentals',
    skill: 'frontend',
    followUpTopics: ['css_basics', 'semantic_html']
  },
  'semantic_html': {
    difficulty: 'medium',
    topic: 'Semantic HTML',
    skill: 'frontend',
    prerequisiteTopics: ['basic_html'],
    followUpTopics: ['accessibility', 'seo']
  },
  'css_basics': {
    difficulty: 'easy',
    topic: 'CSS Fundamentals',
    skill: 'frontend',
    prerequisiteTopics: ['basic_html'],
    followUpTopics: ['css_layout', 'responsive_design']
  },
  'css_layout': {
    difficulty: 'medium',
    topic: 'CSS Layout',
    skill: 'frontend',
    prerequisiteTopics: ['css_basics'],
    followUpTopics: ['css_grid', 'flexbox']
  },
  'responsive_design': {
    difficulty: 'medium',
    topic: 'Responsive Design',
    skill: 'frontend',
    prerequisiteTopics: ['css_basics'],
    followUpTopics: ['mobile_first', 'media_queries']
  },
  'javascript_basics': {
    difficulty: 'easy',
    topic: 'JavaScript Fundamentals',
    skill: 'frontend',
    followUpTopics: ['dom_manipulation', 'event_handling']
  },
  'dom_manipulation': {
    difficulty: 'medium',
    topic: 'DOM Manipulation',
    skill: 'frontend',
    prerequisiteTopics: ['javascript_basics'],
    followUpTopics: ['event_handling', 'ajax']
  },
  'event_handling': {
    difficulty: 'medium',
    topic: 'Event Handling',
    skill: 'frontend',
    prerequisiteTopics: ['javascript_basics', 'dom_manipulation'],
    followUpTopics: ['async_programming', 'ajax']
  },
  'async_programming': {
    difficulty: 'hard',
    topic: 'Asynchronous Programming',
    skill: 'frontend',
    prerequisiteTopics: ['javascript_basics', 'event_handling'],
    followUpTopics: ['promises', 'async_await']
  },
  'react_basics': {
    difficulty: 'medium',
    topic: 'React Fundamentals',
    skill: 'frontend',
    prerequisiteTopics: ['javascript_basics'],
    followUpTopics: ['react_hooks', 'component_lifecycle']
  },
  'react_hooks': {
    difficulty: 'hard',
    topic: 'React Hooks',
    skill: 'frontend',
    prerequisiteTopics: ['react_basics'],
    followUpTopics: ['custom_hooks', 'state_management']
  },
  'nodejs_basics': {
    difficulty: 'easy',
    topic: 'Node.js Fundamentals',
    skill: 'backend',
    followUpTopics: ['express_basics', 'npm_modules']
  },
  'express_basics': {
    difficulty: 'medium',
    topic: 'Express.js Basics',
    skill: 'backend',
    prerequisiteTopics: ['nodejs_basics'],
    followUpTopics: ['routing', 'middleware']
  },
  'database_basics': {
    difficulty: 'easy',
    topic: 'Database Fundamentals',
    skill: 'backend',
    followUpTopics: ['sql_queries', 'database_design']
  },
  'sql_queries': {
    difficulty: 'medium',
    topic: 'SQL Queries',
    skill: 'backend',
    prerequisiteTopics: ['database_basics'],
    followUpTopics: ['joins', 'indexing']
  },
  'api_design': {
    difficulty: 'hard',
    topic: 'API Design',
    skill: 'backend',
    prerequisiteTopics: ['express_basics'],
    followUpTopics: ['rest_principles', 'authentication']
  }
};

// Map question content to context keys
function getQuestionContext(question: string): QuestionContext | undefined {
  const lowerQuestion = question.toLowerCase();
  
  // HTML context mapping
  if (lowerQuestion.includes('html') && (lowerQuestion.includes('basic') || lowerQuestion.includes('tag'))) {
    return QUESTION_CONTEXTS['basic_html'];
  }
  if (lowerQuestion.includes('semantic') && lowerQuestion.includes('html')) {
    return QUESTION_CONTEXTS['semantic_html'];
  }
  
  // CSS context mapping
  if (lowerQuestion.includes('css') && (lowerQuestion.includes('basic') || lowerQuestion.includes('style'))) {
    return QUESTION_CONTEXTS['css_basics'];
  }
  if (lowerQuestion.includes('flexbox') || lowerQuestion.includes('grid') || lowerQuestion.includes('layout')) {
    return QUESTION_CONTEXTS['css_layout'];
  }
  if (lowerQuestion.includes('responsive') || lowerQuestion.includes('media query')) {
    return QUESTION_CONTEXTS['responsive_design'];
  }
  
  // JavaScript context mapping
  if (lowerQuestion.includes('javascript') && (lowerQuestion.includes('basic') || lowerQuestion.includes('variable'))) {
    return QUESTION_CONTEXTS['javascript_basics'];
  }
  if (lowerQuestion.includes('dom') || lowerQuestion.includes('element')) {
    return QUESTION_CONTEXTS['dom_manipulation'];
  }
  if (lowerQuestion.includes('event') && !lowerQuestion.includes('async')) {
    return QUESTION_CONTEXTS['event_handling'];
  }
  if (lowerQuestion.includes('async') || lowerQuestion.includes('promise') || lowerQuestion.includes('callback')) {
    return QUESTION_CONTEXTS['async_programming'];
  }
  
  // React context mapping
  if (lowerQuestion.includes('react') && (lowerQuestion.includes('basic') || lowerQuestion.includes('component'))) {
    return QUESTION_CONTEXTS['react_basics'];
  }
  if (lowerQuestion.includes('hook') || lowerQuestion.includes('usestate') || lowerQuestion.includes('useeffect')) {
    return QUESTION_CONTEXTS['react_hooks'];
  }
  
  // Backend context mapping
  if (lowerQuestion.includes('node') && (lowerQuestion.includes('basic') || lowerQuestion.includes('module'))) {
    return QUESTION_CONTEXTS['nodejs_basics'];
  }
  if (lowerQuestion.includes('express') || lowerQuestion.includes('middleware')) {
    return QUESTION_CONTEXTS['express_basics'];
  }
  if (lowerQuestion.includes('database') && (lowerQuestion.includes('basic') || lowerQuestion.includes('table'))) {
    return QUESTION_CONTEXTS['database_basics'];
  }
  if (lowerQuestion.includes('sql') || lowerQuestion.includes('query') || lowerQuestion.includes('select')) {
    return QUESTION_CONTEXTS['sql_queries'];
  }
  if (lowerQuestion.includes('api') || lowerQuestion.includes('rest') || lowerQuestion.includes('endpoint')) {
    return QUESTION_CONTEXTS['api_design'];
  }
  
  return undefined;
}

export async function POST(request: NextRequest) {
  try {
    const { 
      field, 
      level, 
      questionCount = 10, 
      selectedSkills = [], 
      includeDifficulty = false 
    } = await request.json();

    console.log('📋 Fetching interview context questions:', {
      field,
      level,
      questionCount,
      selectedSkills,
      includeDifficulty
    });

    // 🔍 DEBUG: Check what field is being received
    console.log('🔍 DEBUG - Field analysis:', {
      rawField: field,
      fieldType: typeof field,
      fieldLowerCase: field?.toLowerCase(),
      isDevOps: field?.toLowerCase() === 'devops'
    });

    // 🔧 SMART FIELD DETECTION: If searching for DevOps skills but field is wrong, auto-correct
    let actualField = field;
    if (selectedSkills && selectedSkills.length > 0) {
      const devopsSkills = ['aws', 'azure', 'docker', 'kubernetes', 'ci/cd', 'jenkins', 'terraform', 'monitoring', 'cloud', 'devops'];
      const hasDevOpsSkills = selectedSkills.some((skill: string) => 
        devopsSkills.some(devopsSkill => 
          skill.toLowerCase().includes(devopsSkill) || devopsSkill.includes(skill.toLowerCase())
        )
      );
      
      if (hasDevOpsSkills && field.toLowerCase() !== 'devops') {
        console.log('🔧 AUTO-CORRECTING: Detected DevOps skills but wrong field. Changing to DevOps.');
        actualField = 'devops';
      }
    }

    // Map common field names to database field names and categories
    const fieldMapping: Record<string, string[]> = {
      'software development': ['Software Development', 'Frontend Development', 'Backend Development', 'Programming'],
      'software': ['Software Development', 'Frontend Development', 'Backend Development', 'Programming'], // Add mapping for just "Software"
      'frontend development': ['Frontend Development'],
      'frontend': ['Frontend Development'],
      'backend development': ['Backend Development', 'Backend'],
      'backend': ['Backend Development', 'Backend'],
      'database': ['Database', 'Database Management'],
      'devops': ['DevOps', 'Cloud'],
      'mobile': ['Mobile Development'],
      'web development': ['Frontend Development', 'Backend Development']
    };

    // Also map to categories for better matching
    const categoryMapping: Record<string, string[]> = {
      'software development': ['Software Development'],
      'software': ['Software Development'],
      'frontend development': ['Frontend Development', 'Frontend'],
      'frontend': ['Frontend Development', 'Frontend'],
      'backend development': ['Backend Development', 'Backend'],
      'backend': ['Backend Development', 'Backend'],
      'database': ['Database'],
      'devops': ['DevOps'],
      'mobile': ['Mobile Development', 'Mobile'],
      'web development': ['Software Development', 'Frontend Development', 'Backend Development']
    };

    // Get mapped fields and categories
    const mappedFields = fieldMapping[actualField.toLowerCase()] || [actualField];
    const mappedCategories = categoryMapping[actualField.toLowerCase()] || [actualField];
    
    console.log(`🔄 Mapping field "${actualField}" to:`, {
      fields: mappedFields,
      categories: mappedCategories
    });

    // 🔍 DEBUG: If no mapping found, warn about it
    if (!fieldMapping[actualField.toLowerCase()]) {
      console.warn(`⚠️ No field mapping found for "${actualField}" - using raw value`);
    }
    if (!categoryMapping[actualField.toLowerCase()]) {
      console.warn(`⚠️ No category mapping found for "${actualField}" - using raw value`);
    }

    // Add debug logging for field matching
    console.log('📊 Field matching debug:', {
      originalField: field,
      actualField: actualField,
      lowerCaseField: actualField.toLowerCase(),
      mappedFields,
      mappedCategories,
      hasFieldMapping: !!fieldMapping[actualField.toLowerCase()],
      hasCategoryMapping: !!categoryMapping[actualField.toLowerCase()]
    });

    // Build where clause for database query with both fields and category filtering
    let whereClause;

    if (selectedSkills && selectedSkills.length > 0) {
      // Use AND + OR condition to search in topics, skills, fields, and category
      whereClause = {
        AND: [
          {
            OR: [
              // Match by fields
              {
                fields: {
                  hasSome: mappedFields
                }
              },
              // Match by category
              {
                category: {
                  in: mappedCategories
                }
              }
            ]
          },
          {
            isArchived: false
          },
          {
            OR: [
              // Exact match in topics
              {
                topics: {
                  hasSome: selectedSkills
                }
              },
              // Exact match in skills
              {
                skills: {
                  hasSome: selectedSkills
                }
              },
              // Case-insensitive search in question text
              ...selectedSkills.map((skill: string) => ({
                stem: {
                  contains: skill,
                  mode: 'insensitive' as const
                }
              }))
            ]
          }
        ]
      };
      console.log('🎯 Searching for skills in topics/skills/content:', selectedSkills);
    } else {
      whereClause = {
        OR: [
          // Match by fields
          {
            fields: {
              hasSome: mappedFields
            }
          },
          // Match by category
          {
            category: {
              in: mappedCategories
            }
          }
        ],
        isArchived: false
      };
    }

    // Fetch questions from database
    console.log('🔍 Database query where clause:', JSON.stringify(whereClause, null, 2));
    
    const dbQuestions = await prisma.questionItem.findMany({
      where: whereClause,
      select: {
        id: true,
        stem: true,
        fields: true,
        skills: true,
        topics: true,
        category: true,
        difficulty: true
      },
      take: questionCount * 2, // Get more questions to ensure variety
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('📋 Found questions:', dbQuestions.length);
    console.log('📋 Total questions in fields:', mappedFields);
    console.log('📋 Total questions in categories:', mappedCategories);
    
    // 🔍 DEBUG: Compare with admin panel filtering
    console.log('🔍 ADMIN PANEL vs API COMPARISON:');
    console.log('  - Admin Panel Filter: level=junior + skills=[Azure, AWS, ...]');
    console.log('  - API Filter: fields/categories + skills + level not directly used');
    console.log('  - API uses field mapping while Admin Panel uses direct field match');
    console.log('  - This explains the difference: 48 vs 18 questions');
    
    // Debug: show actual fields and categories in database for these questions
    const actualFieldsSet = new Set(dbQuestions.flatMap(q => q.fields));
    const actualFields = Array.from(actualFieldsSet);
    const actualCategoriesSet = new Set(dbQuestions.map(q => q.category).filter(Boolean));
    const actualCategories = Array.from(actualCategoriesSet);
    
    console.log('📋 Actual fields in found questions:', actualFields);
    console.log('📋 Actual categories in found questions:', actualCategories);
    
    // 🔍 DEBUG: Show difficulty distribution
    const difficultyCount = dbQuestions.reduce((acc, q) => {
      const diff = q.difficulty || 'unknown';
      acc[diff] = (acc[diff] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log('📊 Questions by difficulty level:', difficultyCount);
    
    console.log('📋 Sample questions found:', dbQuestions.slice(0, 5).map(q => ({
      id: q.id,
      question: q.stem.substring(0, 100) + '...',
      topics: q.topics,
      skills: q.skills,
      fields: q.fields,
      category: q.category,
      difficulty: q.difficulty
    })));
    
    if (selectedSkills && selectedSkills.length > 0) {
      console.log('🎯 Filtering by selected skills:', selectedSkills);
      
      // Debug: count questions by category and skills
      const categoryBreakdown = dbQuestions.reduce((acc: Record<string, number>, q) => {
        const category = q.category || 'No Category';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});
      
      console.log('📊 Questions by category:', categoryBreakdown);
      
      // Debug: show which questions match which skills
      let reactQuestionsCount = 0;
      dbQuestions.forEach(q => {
        const matchingInTopics = q.topics?.filter(topic => 
          selectedSkills.some((skill: string) => 
            topic.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(topic.toLowerCase())
          )
        );
        const matchingInSkills = q.skills?.filter(skill => 
          selectedSkills.some((selectedSkill: string) => 
            skill.toLowerCase().includes(selectedSkill.toLowerCase()) ||
            selectedSkill.toLowerCase().includes(skill.toLowerCase())
          )
        );
        
        const hasReactMatch = matchingInTopics?.some(t => t.toLowerCase().includes('react')) ||
                             matchingInSkills?.some(s => s.toLowerCase().includes('react'));
        
        if (hasReactMatch) {
          reactQuestionsCount++;
        }
        
        if (matchingInTopics?.length || matchingInSkills?.length) {
          console.log(`🎯 Question matches:`, {
            questionId: q.id,
            question: q.stem.substring(0, 60) + '...',
            category: q.category,
            matchingInTopics,
            matchingInSkills,
            allTopics: q.topics,
            allSkills: q.skills,
            hasReactMatch
          });
        }
      });
      
      console.log('⚛️ Total React-related questions found:', reactQuestionsCount);
    }

    // Map questions to context structure with difficulty support
    const questionsWithContext: QuestionWithContext[] = dbQuestions.map((q: DbQuestion) => {
      const baseQuestion = {
        id: q.id.toString(),
        question: q.stem,
        context: getQuestionContext(q.stem)
      };

      // Add difficulty information if requested
      if (includeDifficulty && 'difficulty' in q && q.difficulty) {
        return {
          ...baseQuestion,
          difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
          topic: q.category || 'General',
          skills: q.topics || [] // Use topics as skills for Avatar-AI compatibility
        };
      }

      return baseQuestion;
    });

    // Shuffle and limit questions to requested count
    const shuffledQuestions = questionsWithContext
      .sort(() => Math.random() - 0.5)
      .slice(0, questionCount);

    // Generate difficulty breakdown for logging
    const difficultyBreakdown = shuffledQuestions.reduce((acc: Record<string, number>, q) => {
      const difficulty = q.difficulty || 'unknown';
      acc[difficulty] = (acc[difficulty] || 0) + 1;
      return acc;
    }, {});

    console.log('📊 Question difficulty breakdown:', difficultyBreakdown);
    console.log('🎯 Topics-focused questions:', shuffledQuestions.filter(q => 
      q.skills?.some(topic => selectedSkills.some((selected: string) => 
        topic.toLowerCase().includes(selected.toLowerCase()) ||
        selected.toLowerCase().includes(topic.toLowerCase())
      ))
    ).length);

    // If no questions found in database, return empty array
    if (shuffledQuestions.length === 0) {
      console.log('⚠️ No questions found for context');
      return NextResponse.json({
        questions: [],
        message: 'No questions found for the specified criteria'
      });
    }

    return NextResponse.json({
      questions: shuffledQuestions,
      total: shuffledQuestions.length,
      field,
      level,
      selectedSkills,
      difficultyBreakdown,
      topicsMatchingQuestions: shuffledQuestions.filter(q => 
        q.skills?.some(topic => selectedSkills.some((selected: string) => 
          topic.toLowerCase().includes(selected.toLowerCase()) ||
          selected.toLowerCase().includes(topic.toLowerCase())
        ))
      ).length
    });

  } catch (error) {
    console.error('Error fetching interview context questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interview context questions' },
      { status: 500 }
    );
  }
}