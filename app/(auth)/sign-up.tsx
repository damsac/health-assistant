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
import { useSignUp } from '@/lib/hooks/use-auth';

type SignUpFormState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  validationError: string | null;
};

const initialFormState: SignUpFormState = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  validationError: null,
};

export default function SignUpScreen() {
  const [form, setForm] = useState<SignUpFormState>(initialFormState);

  const signUp = useSignUp();

  const updateForm = (updates: Partial<SignUpFormState>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const handleSignUp = async () => {
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      updateForm({ validationError: 'Please fill in all fields' });
      return;
    }

    if (form.password !== form.confirmPassword) {
      updateForm({ validationError: 'Passwords do not match' });
      return;
    }

    if (form.password.length < 8) {
      updateForm({ validationError: 'Password must be at least 8 characters' });
      return;
    }

    updateForm({ validationError: null });

    try {
      await signUp.mutateAsync({
        email: form.email,
        password: form.password,
        name: form.name,
      });
      router.replace('/(app)');
    } catch {
      // Error is handled by mutation state
    }
  };

  const error = form.validationError || (signUp.error?.message ?? null);

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
            <H1>Create Account</H1>
            <Text>Sign up for a new account</Text>
          </YStack>

          {error && (
            <Text color="$red10" textAlign="center">
              {error}
            </Text>
          )}

          <YStack gap="$3">
            <YStack gap="$2">
              <Text>Name</Text>
              <Input
                placeholder="Enter your name"
                value={form.name}
                onChange={(e) =>
                  updateForm({ name: (e.target as HTMLInputElement).value })
                }
                autoCapitalize="words"
                autoComplete="name"
                disabled={signUp.isPending}
              />
            </YStack>

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
                disabled={signUp.isPending}
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
                autoComplete="new-password"
                disabled={signUp.isPending}
              />
            </YStack>

            <YStack gap="$2">
              <Text>Confirm Password</Text>
              <Input
                placeholder="Confirm your password"
                value={form.confirmPassword}
                onChange={(e) =>
                  updateForm({
                    confirmPassword: (e.target as HTMLInputElement).value,
                  })
                }
                secureTextEntry
                autoComplete="new-password"
                disabled={signUp.isPending}
              />
            </YStack>
          </YStack>

          <Button onPress={handleSignUp} disabled={signUp.isPending}>
            {signUp.isPending ? (
              <XStack gap="$2" alignItems="center">
                <Spinner size="small" />
                <Text>Creating account...</Text>
              </XStack>
            ) : (
              'Sign Up'
            )}
          </Button>

          <XStack justifyContent="center" gap="$2">
            <Text>Already have an account?</Text>
            <Link href="/(auth)/sign-in" asChild>
              <Text fontWeight="600">Sign In</Text>
            </Link>
          </XStack>
        </YStack>
      </Card>
    </YStack>
  );
}
