import { createAuthClient } from 'better-auth/react';

const getBaseUrl = () => {
  // For web
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // For server-side
  return process.env.BETTER_AUTH_URL || 'http://localhost:8081';
};

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;

// Export types for auth state
export type Session = {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
};

export type User = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
};
