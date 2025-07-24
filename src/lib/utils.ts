import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper: Set CORS headers for Next.js App Router API
export function withCORS(response: Response) {
  response.headers.set('Access-Control-Allow-Origin', 'http://localhost:8010'); // Đổi thành domain FE khi deploy
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

export function corsOptionsResponse() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'http://localhost:8010',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}
