import { NextResponse } from 'next/server';
import { callOpenAI } from '@/services/openaiService';

export async function POST(request: Request) {
  try {
    const { interviewData, level, candidateName } = await request.json();
    
    if (!interviewData || !Array.isArray(interviewData) || interviewData.length === 0) {
      return NextResponse.json(
        { error: 'Valid interview data is required' }, 
        { status: 400 }
      );
    }

    const name = candidateName || 'the candidate';
    const positionLevel = level || 'Mid-level';
    
    // Structure the interview data for analysis
    const formattedInterviewData = interviewData.map(item => {
      return `
Topic: ${item.topic}
Question: ${item.question}
Candidate's Answer: ${item.answer}
Score: ${item.score}/10
Feedback: ${item.feedback || 'No feedback provided'}
      `;
    }).join('\n\n');
    
    const systemPrompt = `
You are a senior technical hiring manager providing a final assessment of a candidate's technical interview.

ASSESSMENT CONTEXT:
- Position Level: ${positionLevel}
- Candidate Name: ${name}
- Number of Questions: ${interviewData.length}

INTERVIEW DATA:
${formattedInterviewData}

INSTRUCTIONS:
1. Analyze the overall performance across all questions
2. Identify patterns in strengths and weaknesses
3. Evaluate technical competency relative to the ${positionLevel} position
4. Provide a fair and balanced assessment
5. Make a clear hiring recommendation

RETURN ONLY JSON with the following format without any explanation or additional text:
{
  "overallScore": <number between 1-10>,
  "summary": "<concise 2-3 sentence assessment summary>",
  "technicalStrengths": ["strength 1", "strength 2", "strength 3"],
  "developmentAreas": ["area 1", "area 2", "area 3"],
  "hiringRecommendation": "<Strong Yes | Yes | Maybe | No>",
  "recommendationRationale": "<1-2 sentences explaining the recommendation>",
  "feedbackForCandidate": "<constructive feedback paragraph for the candidate>"
}`;

    const response = await callOpenAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Please provide a final assessment for ${name}'s technical interview for a ${positionLevel} position.` }
    ]); // Using default temperature for consistent assessments
    
    if (!response.choices || !response.choices[0]?.message?.content) {
      return NextResponse.json(
        { error: 'Failed to generate assessment' },
        { status: 500 }
      );
    }
    
    const content = response.choices[0].message.content;
    
    // Extract JSON from response
    let assessmentData;
    try {
      const jsonMatch = content.match(/{[\s\S]*}/);
      if (jsonMatch) {
        assessmentData = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON format is found, try to parse the entire content
        assessmentData = JSON.parse(content);
      }
      
      return NextResponse.json(assessmentData);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.error('Original content:', content);
      return NextResponse.json(
        { 
          error: 'Failed to parse AI response',
          overallScore: 0,
          summary: 'Unable to generate assessment'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in final-assessment API:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
