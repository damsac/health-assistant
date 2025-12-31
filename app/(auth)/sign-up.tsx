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
import { useSignUp } from '@/lib/hooks/use-auth';

const signUpSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUpScreen() {
  const signUp = useSignUp();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    try {
      await signUp.mutateAsync({
        email: data.email,
        password: data.password,
        name: data.name,
      });
      router.replace('/(app)');
    } catch {
      // Error is handled by mutation state
    }
  };

  const serverError = signUp.error?.message ?? null;

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

          {serverError && (
            <Text color="$red10" textAlign="center">
              {serverError}
            </Text>
          )}

          <YStack gap="$3">
            <YStack gap="$2">
              <Text>Name</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="Enter your name"
                    value={value}
                    onChangeText={onChange}
                    onChange={(e) =>
                      onChange((e.target as HTMLInputElement).value)
                    }
                    onBlur={onBlur}
                    autoCapitalize="words"
                    autoComplete="name"
                    disabled={signUp.isPending}
                  />
                )}
              />
              {errors.name && (
                <Text color="$red10" fontSize="$2">
                  {errors.name.message}
                </Text>
              )}
            </YStack>

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
                    onChange={(e) =>
                      onChange((e.target as HTMLInputElement).value)
                    }
                    onBlur={onBlur}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    disabled={signUp.isPending}
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
                    onChange={(e) =>
                      onChange((e.target as HTMLInputElement).value)
                    }
                    onBlur={onBlur}
                    secureTextEntry
                    autoComplete="new-password"
                    disabled={signUp.isPending}
                  />
                )}
              />
              {errors.password && (
                <Text color="$red10" fontSize="$2">
                  {errors.password.message}
                </Text>
              )}
            </YStack>

            <YStack gap="$2">
              <Text>Confirm Password</Text>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="Confirm your password"
                    value={value}
                    onChangeText={onChange}
                    onChange={(e) =>
                      onChange((e.target as HTMLInputElement).value)
                    }
                    onBlur={onBlur}
                    secureTextEntry
                    autoComplete="new-password"
                    disabled={signUp.isPending}
                  />
                )}
              />
              {errors.confirmPassword && (
                <Text color="$red10" fontSize="$2">
                  {errors.confirmPassword.message}
                </Text>
              )}
            </YStack>
          </YStack>

          <Button onPress={handleSubmit(onSubmit)} disabled={signUp.isPending}>
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
