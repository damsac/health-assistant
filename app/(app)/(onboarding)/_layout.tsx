import { Slot } from 'expo-router';
import { OnboardingProvider } from '@/lib/contexts/onboarding-context';

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <Slot />
    </OnboardingProvider>
  );
}
