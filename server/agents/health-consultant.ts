import { anthropic } from '@ai-sdk/anthropic';
import type { Gender } from '@/lib/db/schema';

/**
 * Health Consultant Agent Configuration
 *
 * This module defines the AI agent's behavior, model selection, and system prompt.
 */

export type UserProfileContext = {
  userName?: string;
  heightCm?: number | null;
  weightGrams?: number | null;
  gender?: Gender | null;
  dietaryPreferences?: string[] | null;
  dateOfBirth?: Date | null;
  measurementSystem?: string | null;
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

  if (context.userName) {
    parts.push(`Name: ${context.userName}`);
  }

  if (context.dateOfBirth) {
    parts.push(`Age: ${calculateAge(context.dateOfBirth)} years old`);
  }

  if (context.gender) {
    const genderDisplay =
      context.gender === 'prefer_not_to_say'
        ? 'Prefer not to say'
        : context.gender.charAt(0).toUpperCase() + context.gender.slice(1);
    parts.push(`Gender: ${genderDisplay}`);
  }

  if (context.heightCm) {
    if (context.measurementSystem === 'imperial') {
      const totalInches = context.heightCm / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inches = Math.round(totalInches % 12);
      parts.push(`Height: ${feet}'${inches}"`);
    } else {
      parts.push(`Height: ${context.heightCm} cm`);
    }
  }

  if (context.weightGrams) {
    if (context.measurementSystem === 'imperial') {
      const lbs = Math.round(context.weightGrams / 453.592);
      parts.push(`Weight: ${lbs} lbs`);
    } else {
      const kg = (context.weightGrams / 1000).toFixed(1);
      parts.push(`Weight: ${kg} kg`);
    }
  }

  if (context.dietaryPreferences && context.dietaryPreferences.length > 0) {
    parts.push(`Dietary Preferences: ${context.dietaryPreferences.join(', ')}`);
  }

  return parts.length > 0
    ? `\n\nUser Profile:\n${parts.map((p) => `- ${p}`).join('\n')}`
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

    return `You are a holistic nutrition consultant who understands that true wellness emerges from the interconnection of diet, lifestyle, mental well-being, and environment.${profileSection}${healthDataSection}

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
