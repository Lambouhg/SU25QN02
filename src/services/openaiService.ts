// src/services/openaiService.ts

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const AZURE_OPENAI_KEY= process.env.NEXT_PUBLIC_AZURE_OPENAI_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_DEPLOYMENT = process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT || "gpt-4.0";
const AZURE_OPENAI_API_VERSION = "2024-04-01-preview";

export async function callOpenAI(messages: ChatMessage[]) {
  if (!AZURE_OPENAI_KEY || !AZURE_OPENAI_ENDPOINT) {
    throw new Error("Azure OpenAI key or endpoint is missing");
  }
  const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': AZURE_OPENAI_KEY,
    },
    body: JSON.stringify({
      messages,
      max_tokens: 1024,
      temperature: 0.7,
      stream: false
    })
  });
  if (!response.ok) {
    throw new Error('Failed to call Azure OpenAI');
  }
  return response.json();
}
