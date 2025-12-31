import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  Button,
  Card,
  H1,
  Input,
  Spinner,
  Text,
  XStack,
  YStack,
} from '@/components/ui';
import { useSignIn } from '@/lib/hooks/use-auth';

type SignInFormState = {
  email: string;
  password: string;
  validationError: string | null;
};

const initialFormState: SignInFormState = {
  email: '',
  password: '',
  validationError: null,
};

export default function SignInScreen() {
  const [form, setForm] = useState<SignInFormState>(initialFormState);

  const signIn = useSignIn();

  const updateForm = (updates: Partial<SignInFormState>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const handleSignIn = async () => {
    if (!form.email || !form.password) {
      updateForm({ validationError: 'Please fill in all fields' });
      return;
    }

    updateForm({ validationError: null });

    try {
      await signIn.mutateAsync({ email: form.email, password: form.password });
      router.replace('/(app)');
    } catch {
      // Error is handled by mutation state
    }
  };

  const error = form.validationError || (signIn.error?.message ?? null);

  return (
    <YStack
      flex={1}
      justifyContent="center"
      alignItems="center"
      padding="$4"
      backgroundColor="$background"
    >
      <Card elevate bordered padding="$4" width="100%" maxWidth={400}>
        <YStack gap="$4">
          <YStack alignItems="center" gap="$2">
            <H1>Welcome Back</H1>
            <Text>Sign in to your account</Text>
          </YStack>

          {error && (
            <Text color="$red10" textAlign="center">
              {error}
            </Text>
          )}

          <YStack gap="$3">
            <YStack gap="$2">
              <Text>Email</Text>
              <Input
                placeholder="Enter your email"
                value={form.email}
                onChange={(e) =>
                  updateForm({ email: (e.target as HTMLInputElement).value })
                }
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                disabled={signIn.isPending}
              />
            </YStack>

            <YStack gap="$2">
              <Text>Password</Text>
              <Input
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) =>
                  updateForm({ password: (e.target as HTMLInputElement).value })
                }
                secureTextEntry
                autoComplete="password"
                disabled={signIn.isPending}
              />
            </YStack>
          </YStack>

          <Button onPress={handleSignIn} disabled={signIn.isPending}>
            {signIn.isPending ? (
              <XStack gap="$2" alignItems="center">
                <Spinner size="small" />
                <Text>Signing in...</Text>
              </XStack>
            ) : (
              'Sign In'
            )}
          </Button>

          <XStack justifyContent="center" gap="$2">
            <Text>Don't have an account?</Text>
            <Link href="/(auth)/sign-up" asChild>
              <Text fontWeight="600">Sign Up</Text>
            </Link>
          </XStack>
        </YStack>
      </Card>
    </YStack>
  );
}
