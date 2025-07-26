import { NextResponse } from 'next/server';
import { callOpenAI } from '@/services/openaiService';

export async function POST(request: Request) {
  try {
    const { question, userAnswer, topic, level } = await request.json();
    
    if (!question || !userAnswer || !topic) {
      return NextResponse.json(
        { error: 'Question, user answer, and topic are required' }, 
        { status: 400 }
      );
    }
    
    const systemPrompt = `
You are an expert technical interviewer evaluating a candidate's response to a technical question.

EVALUATION CONTEXT:
- Position Level: ${level || "Mid-level"}
- Technical Area: ${topic}
- Question: "${question}"

INSTRUCTIONS:
1. Evaluate the candidate's answer for technical accuracy and completeness
2. Consider depth of understanding, correct terminology, and practical insight
3. Provide specific feedback on strengths and areas for improvement
4. Score the answer on a scale from 1-10 with the following criteria:
   - 1-3: Significantly lacking in understanding or accuracy
   - 4-5: Basic understanding with notable gaps or misconceptions
   - 6-7: Solid understanding with minor gaps
   - 8-9: Excellent understanding with good depth and precision
   - 10: Exceptional answer demonstrating expert knowledge

RETURN ONLY JSON with the following format without any explanation or additional text:
{
  "score": <number between 1-10>,
  "feedback": "<concise feedback on the answer>",
  "strengths": ["strength 1", "strength 2", ...],
  "improvementAreas": ["area 1", "area 2", ...],
  "suggestedAnswer": "<brief, correct answer to the question>"
}`;

    const response = await callOpenAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Question: ${question}\n\nCandidate's Answer: ${userAnswer}` }
    ]);
    
    if (!response.choices || !response.choices[0]?.message?.content) {
      return NextResponse.json(
        { error: 'Failed to evaluate answer' },
        { status: 500 }
      );
    }
    
    const content = response.choices[0].message.content;
    
    // Extract JSON from response
    let evaluationData;
    try {
      const jsonMatch = content.match(/{[\s\S]*}/);
      if (jsonMatch) {
        evaluationData = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON format is found, try to parse the entire content
        evaluationData = JSON.parse(content);
      }
      
      return NextResponse.json(evaluationData);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.error('Original content:', content);
      return NextResponse.json(
        { 
          error: 'Failed to parse AI response',
          score: 0,
          feedback: 'Unable to process evaluation'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in score-response API:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
