import { NextResponse } from 'next/server';
import { callOpenAI } from '@/services/openaiService';

export async function POST(request: Request) {
  try {
    const { introduction, position } = await request.json();
    
    if (!introduction) {
      return NextResponse.json(
        { error: 'Introduction is required' }, 
        { status: 400 }
      );
    }
    
    const systemPrompt = `
You are an expert technical interviewer with deep knowledge across many technical domains.
Your task is to analyze a job candidate's self-introduction and extract relevant technical topics for an interview.

OBJECTIVE: 
Extract relevant technical topics and skills from the candidate's introduction that would be appropriate to discuss 
in a technical interview for a ${position || "technical"} position.

INSTRUCTIONS:
1. Analyze the candidate's self-introduction for technical skills, experiences, and domains
2. Extract specific technical topics that would be good to discuss in an interview
3. Consider both explicitly mentioned technologies and implied knowledge areas
4. Focus on professional skills rather than soft skills
5. Prioritize topics relevant to the ${position || "technical"} position

RETURN ONLY JSON in the following format without any explanation or additional text:
{
  "skills": [
    { "name": "skill name", "level": "beginner|intermediate|advanced|expert", "years": number },
    ...
  ],
  "domains": ["domain1", "domain2", ...],
  "topicsForInterview": ["topic1", "topic2", "topic3", "topic4", "topic5"]
}`;

    const response = await callOpenAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: introduction }
    ]);
    
    if (!response.choices || !response.choices[0]?.message?.content) {
      return NextResponse.json(
        { error: 'Failed to extract topics' },
        { status: 500 }
      );
    }
    
    const content = response.choices[0].message.content;
    
    // Extract JSON from response
    let topicsData;
    try {
      const jsonMatch = content.match(/{[\s\S]*}/);
      if (jsonMatch) {
        topicsData = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON format is found, try to parse the entire content
        topicsData = JSON.parse(content);
      }
      
      return NextResponse.json(topicsData);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.error('Original content:', content);
      return NextResponse.json(
        { 
          error: 'Failed to parse AI response',
          topics: [] 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in extract-topics API:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
