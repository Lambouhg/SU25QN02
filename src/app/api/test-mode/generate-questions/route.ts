import { NextResponse } from 'next/server';
import { callOpenAI } from '@/services/openaiService';

export async function POST(request: Request) {
  try {
    const { topic, level } = await request.json();
    
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' }, 
        { status: 400 }
      );
    }
    
    const difficultyMap: Record<string, string> = {
      'Junior': 'basic to intermediate',
      'Mid-level': 'intermediate to advanced',
      'Senior': 'advanced to expert',
      'Lead': 'expert level with leadership focus'
    };
    
    const difficultyLevel = difficultyMap[level] || 'intermediate';
    
    const systemPrompt = `
You are a senior technical interviewer creating high-quality interview questions about: ${topic}.

INTERVIEW CONTEXT:
- Position Level: ${level || "Mid-level"}
- Technical Area: ${topic}
- Question Difficulty: ${difficultyLevel}

INSTRUCTIONS:
1. Create 5-7 interview questions specifically about ${topic}
2. Questions should be at ${difficultyLevel} difficulty
3. Questions must test both theoretical knowledge and practical application
4. Include a mix of concept questions and scenario-based problems
5. Questions should reveal depth of understanding, not just surface knowledge
6. Questions should follow a logical progression in difficulty
7. Ensure questions are clear, concise, and focused on a single concept per question

${level === 'Senior' || level === 'Lead' ? 
  "Include at least 2 system design or architectural decision questions." : 
  level === 'Junior' ? 
    "Focus on fundamentals and practical usage scenarios." : 
    "Balance theory with practical application scenarios."}

RETURN ONLY JSON with an array of questions in the following format without any explanation or additional text:
{
  "questions": [
    "Question 1 text here?",
    "Question 2 text here?",
    ...
  ],
  "difficulty": "${difficultyLevel}",
  "targetSkills": ["skill1", "skill2", "skill3"]
}`;

    const response = await callOpenAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Please generate interview questions about ${topic} for a ${level || "Mid-level"} position.` }
    ]);
    
    if (!response.choices || !response.choices[0]?.message?.content) {
      return NextResponse.json(
        { error: 'Failed to generate questions' },
        { status: 500 }
      );
    }
    
    const content = response.choices[0].message.content;
    
    // Extract JSON from response
    let questionsData;
    try {
      const jsonMatch = content.match(/{[\s\S]*}/);
      if (jsonMatch) {
        questionsData = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON format is found, try to parse the entire content
        questionsData = JSON.parse(content);
      }
      
      return NextResponse.json(questionsData);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.error('Original content:', content);
      return NextResponse.json(
        { 
          error: 'Failed to parse AI response',
          questions: [] 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in generate-questions API:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
