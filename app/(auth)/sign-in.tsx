import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
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

const signInSchema = z.object({
  email: z.email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignInScreen() {
  const signIn = useSignIn();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    try {
      await signIn.mutateAsync({ email: data.email, password: data.password });
      router.replace('/(app)');
    } catch {
      // Error is handled by mutation state
    }
  };

  const serverError = signIn.error?.message ?? null;

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

          {serverError && (
            <Text color="$red10" textAlign="center">
              {serverError}
            </Text>
          )}

          <YStack gap="$3">
            <YStack gap="$2">
              <Text>Email</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="Enter your email"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    disabled={signIn.isPending}
                  />
                )}
              />
              {errors.email && (
                <Text color="$red10" fontSize="$2">
                  {errors.email.message}
                </Text>
              )}
            </YStack>

            <YStack gap="$2">
              <Text>Password</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="Enter your password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry
                    autoComplete="password"
                    disabled={signIn.isPending}
                  />
                )}
              />
              {errors.password && (
                <Text color="$red10" fontSize="$2">
                  {errors.password.message}
                </Text>
              )}
            </YStack>
          </YStack>

          <Button onPress={handleSubmit(onSubmit)} disabled={signIn.isPending}>
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
