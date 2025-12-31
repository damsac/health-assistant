import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authClient, type Session, type User } from '../auth-client';
import { queryKeys } from '../query-client';

// Types
type AuthSession = {
  user: User;
  session: Session;
};

// Query function to fetch the current session
async function fetchSession(): Promise<AuthSession | null> {
  const { data, error } = await authClient.getSession();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.user || !data?.session) {
    return null;
  }

  return {
    user: data.user,
    session: data.session,
  };
}

// Hook to get current session with caching
export function useSession() {
  return useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: fetchSession,
    staleTime: 1000 * 60 * 5, // Consider fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

// Convenience hook that provides user, loading, and auth state
export function useAuth() {
  const queryClient = useQueryClient();
  const sessionQuery = useSession();
  const signInMutation = useSignIn();
  const signUpMutation = useSignUp();
  const signOutMutation = useSignOut();

  return {
    user: sessionQuery.data?.user ?? null,
    session: sessionQuery.data?.session ?? null,
    isLoading: sessionQuery.isLoading,
    isAuthenticated: !!sessionQuery.data?.user,
    error: sessionQuery.error,

    // Mutations
    signIn: signInMutation.mutateAsync,
    signUp: signUpMutation.mutateAsync,
    signOut: signOutMutation.mutateAsync,

    // Mutation states
    isSigningIn: signInMutation.isPending,
    isSigningUp: signUpMutation.isPending,
    isSigningOut: signOutMutation.isPending,

    signInError: signInMutation.error,
    signUpError: signUpMutation.error,
    signOutError: signOutMutation.error,

    // Utilities
    refreshSession: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.session }),
  };
}

// Sign in mutation
type SignInParams = { email: string; password: string };

export function useSignIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, password }: SignInParams) => {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.user) {
        throw new Error('Sign in failed');
      }

      return { user: data.user };
    },
    onSuccess: () => {
      // Invalidate to fetch the full session from server
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.session });
    },
  });
}

// Sign up mutation
type SignUpParams = { email: string; password: string; name: string };

export function useSignUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, password, name }: SignUpParams) => {
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.user) {
        throw new Error('Sign up failed');
      }

      return { user: data.user };
    },
    onSuccess: () => {
      // Invalidate to fetch the full session from server
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.session });
    },
  });
}

// Sign out mutation
export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await authClient.signOut();
    },
    onSuccess: () => {
      // Clear session from cache
      queryClient.setQueryData(queryKeys.auth.session, null);
      // Invalidate to trigger refetch on next access
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.session });
    },
  });
}
