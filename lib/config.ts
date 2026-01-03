const AGENT_URL = process.env.EXPO_PUBLIC_AGENT_URL;

if (!AGENT_URL) {
  throw new Error('EXPO_PUBLIC_AGENT_URL environment variable is not set');
}

export const config = {
  agent: {
    url: AGENT_URL,
  },
} as const;
