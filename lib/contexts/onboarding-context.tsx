/**
 * Onboarding Context
 * In-memory state management for the onboarding flow.
 * No persistence - state resets on page refresh (intentional).
 */

import { createContext, type ReactNode, useContext, useState } from 'react';
import type { Gender } from '@/lib/db/schema';

type OnboardingData = {
  age: string;
  gender: Gender | '';
  heightFeet: string;
  heightInches: string;
  weight: string;
  primaryGoals: string[];
  dietaryPreferences: string[];
  allergies: string;
  healthChallenge: string;
};

type OnboardingContextValue = {
  data: OnboardingData;
  updateField: <K extends keyof OnboardingData>(
    field: K,
    value: OnboardingData[K],
  ) => void;
  toggleGoal: (goal: string) => void;
  toggleDietary: (option: string) => void;
  reset: () => void;
};

const defaultData: OnboardingData = {
  age: '',
  gender: '',
  heightFeet: '',
  heightInches: '',
  weight: '',
  primaryGoals: [],
  dietaryPreferences: [],
  allergies: '',
  healthChallenge: '',
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>(defaultData);

  const updateField = <K extends keyof OnboardingData>(
    field: K,
    value: OnboardingData[K],
  ) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleGoal = (goal: string) => {
    setData((prev) => {
      const current = prev.primaryGoals;
      if (current.includes(goal)) {
        return { ...prev, primaryGoals: current.filter((g) => g !== goal) };
      }
      if (current.length < 2) {
        return { ...prev, primaryGoals: [...current, goal] };
      }
      return prev;
    });
  };

  const toggleDietary = (option: string) => {
    setData((prev) => {
      const current = prev.dietaryPreferences;
      if (current.includes(option)) {
        return {
          ...prev,
          dietaryPreferences: current.filter((d) => d !== option),
        };
      }
      return { ...prev, dietaryPreferences: [...current, option] };
    });
  };

  const reset = () => {
    setData(defaultData);
  };

  return (
    <OnboardingContext.Provider
      value={{ data, updateField, toggleGoal, toggleDietary, reset }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
