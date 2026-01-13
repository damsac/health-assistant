const AGENT_URL = process.env.EXPO_PUBLIC_AGENT_URL;

if (!AGENT_URL) {
  throw new Error('EXPO_PUBLIC_AGENT_URL environment variable is not set');
}

// For web development, the API routes are served by Expo on the same origin
const API_BASE_URL =
  typeof window !== 'undefined'
    ? window.location.origin
    : 'http://localhost:8081';

export const config = {
  agent: {
    url: AGENT_URL,
  },
  api: {
    url: API_BASE_URL,
  },
} as const;
