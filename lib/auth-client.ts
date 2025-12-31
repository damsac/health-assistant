import { createAuthClient } from 'better-auth/react';

const getBaseUrl = () => {
  // For web
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // For server-side
  if (!process.env.BETTER_AUTH_URL) {
    throw new Error('BETTER_AUTH_URL environment variable is not set');
  }
  return process.env.BETTER_AUTH_URL;
};

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
});

// Infer types from the auth client - single source of truth
type AuthClientSession = typeof authClient.$Infer.Session;
export type Session = AuthClientSession['session'];
export type User = AuthClientSession['user'];
