import { anthropic } from '@ai-sdk/anthropic';
import type { Gender } from '@/lib/db/schema';

/**
 * Health Consultant Agent Configuration
 *
 * This module defines the AI agent's behavior, model selection, and system prompt.
 */

export type HealthMetrics = {
  steps?: number;
  calories?: number;
  distance?: number;
  restingHeartRate?: number;
  maxHeartRate?: number;
  minHeartRate?: number;
  sleepDuration?: number;
  deepSleep?: number;
  lightSleep?: number;
  remSleep?: number;
  activeMinutes?: number;
  vigorousMinutes?: number;
  stressAvg?: number;
  stressMax?: number;
  latestDate?: Date;
};

export type UserProfileContext = {
  userName?: string;
  heightCm?: number | null;
  weightGrams?: number | null;
  gender?: Gender | null;
  dietaryPreferences?: string[] | null;
  dateOfBirth?: Date | null;
  measurementSystem?: string | null;
  healthData?: HealthMetrics;
  // New profile fields
  sleepHoursAverage?: string | null;
  sleepQuality?: string | null;
  typicalWakeTime?: string | null;
  typicalBedTime?: string | null;
  mealsPerDay?: number | null;
  typicalMealTimes?: string[] | null;
  snackingHabits?: string | null;
  supplementsMedications?: string | null;
  healthConditions?: string[] | null;
  stressLevel?: string | null;
  exerciseFrequency?: string | null;
  exerciseTypes?: string[] | null;
  waterIntakeLiters?: string | null;
  garminConnected?: boolean | null;
};

const calculateAge = (dateOfBirth: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
  ) {
    age--;
  }
  return age;
};

const formatProfileContext = (context: UserProfileContext): string => {
  const parts: string[] = [];

  // Basic Info section
  const basicInfo: string[] = [];

  if (context.userName) {
    basicInfo.push(`Name: ${context.userName}`);
  }

  if (context.dateOfBirth) {
    basicInfo.push(`Age: ${calculateAge(context.dateOfBirth)} years old`);
  }

  if (context.gender) {
    const genderDisplay =
      context.gender === 'prefer_not_to_say'
        ? 'Prefer not to say'
        : context.gender.charAt(0).toUpperCase() + context.gender.slice(1);
    basicInfo.push(`Sex: ${genderDisplay}`);
  }

  if (context.heightCm) {
    if (context.measurementSystem === 'imperial') {
      const totalInches = context.heightCm / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inches = Math.round(totalInches % 12);
      basicInfo.push(`Height: ${feet}'${inches}"`);
    } else {
      basicInfo.push(`Height: ${context.heightCm} cm`);
    }
  }

  if (context.weightGrams) {
    if (context.measurementSystem === 'imperial') {
      const lbs = Math.round(context.weightGrams / 453.592);
      basicInfo.push(`Weight: ${lbs} lbs`);
    } else {
      const kg = (context.weightGrams / 1000).toFixed(1);
      basicInfo.push(`Weight: ${kg} kg`);
    }
  }

  if (context.dietaryPreferences && context.dietaryPreferences.length > 0) {
    basicInfo.push(
      `Dietary Restrictions: ${context.dietaryPreferences.join(', ')}`,
    );
  }

  if (context.healthConditions && context.healthConditions.length > 0) {
    basicInfo.push(`Health Conditions: ${context.healthConditions.join(', ')}`);
  }

  if (basicInfo.length > 0) {
    parts.push(`Basic Info:\n${basicInfo.map((p) => `- ${p}`).join('\n')}`);
  }

  // Sleep Patterns section
  const sleepInfo: string[] = [];
  if (context.sleepHoursAverage) {
    sleepInfo.push(`Average: ${context.sleepHoursAverage} hours`);
  }
  if (context.sleepQuality) {
    sleepInfo.push(`Quality: ${context.sleepQuality}`);
  }
  if (context.typicalWakeTime && context.typicalBedTime) {
    sleepInfo.push(
      `Schedule: ${context.typicalWakeTime} to ${context.typicalBedTime}`,
    );
  }
  if (sleepInfo.length > 0) {
    parts.push(`Sleep Patterns:\n${sleepInfo.map((p) => `- ${p}`).join('\n')}`);
  }

  // Eating Habits section
  const eatingInfo: string[] = [];
  if (context.mealsPerDay) {
    eatingInfo.push(`Meals per day: ${context.mealsPerDay}`);
  }
  if (context.typicalMealTimes && context.typicalMealTimes.length > 0) {
    eatingInfo.push(`Meal times: ${context.typicalMealTimes.join(', ')}`);
  }
  if (context.snackingHabits) {
    eatingInfo.push(`Snacking: ${context.snackingHabits}`);
  }
  if (context.waterIntakeLiters) {
    eatingInfo.push(`Water intake: ${context.waterIntakeLiters}L daily`);
  }
  if (eatingInfo.length > 0) {
    parts.push(`Eating Habits:\n${eatingInfo.map((p) => `- ${p}`).join('\n')}`);
  }

  // Health Context section
  const healthInfo: string[] = [];
  if (context.supplementsMedications) {
    healthInfo.push(
      `Supplements/Medications: ${context.supplementsMedications}`,
    );
  }
  if (context.stressLevel) {
    healthInfo.push(`Stress Level: ${context.stressLevel}`);
  }
  if (context.exerciseFrequency) {
    const exerciseTypes =
      context.exerciseTypes && context.exerciseTypes.length > 0
        ? `, ${context.exerciseTypes.join(', ')}`
        : '';
    healthInfo.push(`Exercise: ${context.exerciseFrequency}${exerciseTypes}`);
  }
  if (healthInfo.length > 0) {
    parts.push(
      `Health Context:\n${healthInfo.map((p) => `- ${p}`).join('\n')}`,
    );
  }

  // Garmin connection status
  if (context.garminConnected) {
    parts.push(`- Garmin data available (fetch recent metrics when relevant)`);
  }

  return parts.length > 0 ? `\n\nUSER PROFILE:\n${parts.join('\n\n')}` : '';
};

const formatHealthData = (healthData?: HealthMetrics): string => {
  if (!healthData) return '';

  const parts: string[] = [];

  if (healthData.latestDate) {
    parts.push(`Data from: ${healthData.latestDate.toLocaleDateString()}`);
  }

  if (healthData.steps !== undefined) {
    parts.push(`Steps: ${Math.round(healthData.steps).toLocaleString()}`);
  }

  if (healthData.calories !== undefined) {
    parts.push(
      `Calories burned: ${Math.round(healthData.calories).toLocaleString()} kcal`,
    );
  }

  if (healthData.distance !== undefined) {
    const km = (healthData.distance / 1000).toFixed(2);
    parts.push(`Distance: ${km} km`);
  }

  if (healthData.restingHeartRate !== undefined) {
    parts.push(
      `Resting heart rate: ${Math.round(healthData.restingHeartRate)} bpm`,
    );
  }

  if (
    healthData.maxHeartRate !== undefined &&
    healthData.minHeartRate !== undefined
  ) {
    parts.push(
      `Heart rate range: ${Math.round(healthData.minHeartRate)}-${Math.round(healthData.maxHeartRate)} bpm`,
    );
  }

  if (healthData.sleepDuration !== undefined) {
    const hours = Math.floor(healthData.sleepDuration / 60);
    const minutes = Math.round(healthData.sleepDuration % 60);
    parts.push(`Sleep: ${hours}h ${minutes}m`);

    if (healthData.deepSleep !== undefined) {
      const deepHours = Math.floor(healthData.deepSleep / 60);
      const deepMinutes = Math.round(healthData.deepSleep % 60);
      parts.push(`  - Deep sleep: ${deepHours}h ${deepMinutes}m`);
    }

    if (healthData.lightSleep !== undefined) {
      const lightHours = Math.floor(healthData.lightSleep / 60);
      const lightMinutes = Math.round(healthData.lightSleep % 60);
      parts.push(`  - Light sleep: ${lightHours}h ${lightMinutes}m`);
    }

    if (healthData.remSleep !== undefined) {
      const remHours = Math.floor(healthData.remSleep / 60);
      const remMinutes = Math.round(healthData.remSleep % 60);
      parts.push(`  - REM sleep: ${remHours}h ${remMinutes}m`);
    }
  }

  if (healthData.activeMinutes !== undefined) {
    parts.push(`Active minutes: ${Math.round(healthData.activeMinutes)}`);
  }

  if (healthData.vigorousMinutes !== undefined) {
    parts.push(
      `Vigorous activity: ${Math.round(healthData.vigorousMinutes)} minutes`,
    );
  }

  if (healthData.stressAvg !== undefined) {
    parts.push(`Average stress level: ${Math.round(healthData.stressAvg)}`);
  }

  return parts.length > 0
    ? `\n\nRecent Health Data (from Garmin):\n${parts.map((p) => `- ${p}`).join('\n')}`
    : '';
};

export const healthConsultantAgent = {
  model: anthropic('claude-3-haiku-20240307'),

  /**
   * Generate system prompt with user context
   */
  getSystemPrompt: (context: UserProfileContext) => {
    const profileSection = formatProfileContext(context);
    const healthDataSection = formatHealthData(context.healthData);

    return `You are a holistic nutrition consultant providing personalized, evidence-based guidance.${profileSection}${healthDataSection}

Your approach:
- View health through a holistic lens — what we eat, how we move, how we think, how we sleep, and how we manage stress are all deeply connected
- Meet people exactly where they are without judgment; sustainable change happens through small, achievable steps
- Focus on education and building self-awareness rather than prescribing rigid rules
- Help users understand the "why" behind recommendations so they can make informed choices
- Recognize that each person's journey is unique — there is no one-size-fits-all approach

Core principles:
- Empower through understanding: help users tune into their body's signals and patterns
- Celebrate progress over perfection; small consistent changes compound over time
- Consider the whole person: stress, sleep, relationships, and environment all impact nutritional needs
- Be curious and ask thoughtful questions to understand context before offering guidance
- Validate feelings and experiences — changing habits is genuinely difficult

Boundaries:
- Always recommend consulting healthcare professionals for medical concerns or symptoms
- Never diagnose conditions or prescribe treatments
- Provide evidence-informed guidance while acknowledging that nutrition science evolves
- Use the user's preferred measurement system when discussing measurements`.trim();
  },
} as const;
