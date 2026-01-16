/**
 * Formatters for displaying data in chat components
 */

// ============================================================================
// Profile Update Formatters
// ============================================================================

export type ProfileUpdateInput = {
  weightLbs?: number;
  weightKg?: number;
  heightFeet?: number;
  heightInches?: number;
  heightCm?: number;
  gender?: string;
  dietaryPreferences?: string[];
  dateOfBirth?: string;
  measurementSystem?: 'metric' | 'imperial';
};

export type DisplayChange = {
  label: string;
  value: string;
};

/**
 * Format weight for display based on measurement system
 */
export function formatWeight(
  input: ProfileUpdateInput,
  system: 'metric' | 'imperial' = 'metric',
): string | null {
  if (input.weightKg !== undefined) {
    if (system === 'imperial') {
      const lbs = Math.round(input.weightKg * 2.20462);
      return `${lbs} lbs`;
    }
    return `${input.weightKg} kg`;
  }
  if (input.weightLbs !== undefined) {
    if (system === 'metric') {
      const kg = Math.round(input.weightLbs * 0.453592);
      return `${kg} kg`;
    }
    return `${input.weightLbs} lbs`;
  }
  return null;
}

/**
 * Format height for display based on measurement system
 */
export function formatHeight(
  input: ProfileUpdateInput,
  system: 'metric' | 'imperial' = 'metric',
): string | null {
  if (input.heightCm !== undefined) {
    if (system === 'imperial') {
      const totalInches = input.heightCm / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inches = Math.round(totalInches % 12);
      return `${feet}'${inches}"`;
    }
    return `${input.heightCm} cm`;
  }
  if (input.heightFeet !== undefined) {
    const inches = input.heightInches ?? 0;
    if (system === 'metric') {
      const cm = Math.round(input.heightFeet * 30.48 + inches * 2.54);
      return `${cm} cm`;
    }
    return `${input.heightFeet}'${inches}"`;
  }
  return null;
}

/**
 * Format gender for display
 */
export function formatGender(gender: string): string {
  if (gender === 'prefer_not_to_say') return 'Prefer not to say';
  return gender.charAt(0).toUpperCase() + gender.slice(1);
}

/**
 * Format date string for display
 */
export function formatDateString(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Build display changes from profile update input
 */
export function buildProfileChanges(args: unknown): DisplayChange[] {
  if (!args || typeof args !== 'object') return [];

  const input = args as ProfileUpdateInput;
  const changes: DisplayChange[] = [];
  const system = input.measurementSystem ?? 'metric';

  const weight = formatWeight(input, system);
  if (weight) {
    changes.push({ label: 'Weight', value: weight });
  }

  const height = formatHeight(input, system);
  if (height) {
    changes.push({ label: 'Height', value: height });
  }

  if (input.gender) {
    changes.push({ label: 'Gender', value: formatGender(input.gender) });
  }

  if (input.dietaryPreferences?.length) {
    changes.push({
      label: 'Dietary Preferences',
      value: input.dietaryPreferences.join(', '),
    });
  }

  if (input.dateOfBirth) {
    changes.push({
      label: 'Date of Birth',
      value: formatDateString(input.dateOfBirth),
    });
  }

  if (input.measurementSystem) {
    changes.push({
      label: 'Measurement System',
      value:
        input.measurementSystem.charAt(0).toUpperCase() +
        input.measurementSystem.slice(1),
    });
  }

  return changes;
}

// ============================================================================
// Goals Formatters
// ============================================================================

export type GoalActionInput = {
  action: 'create' | 'update' | 'delete' | 'list';
  goalId?: string;
  title?: string;
  description?: string;
  status?: 'active' | 'completed' | 'abandoned';
};

export type GoalDisplayInfo = {
  action: string;
  actionLabel: string;
  details: Array<{ label: string; value: string }>;
};

/**
 * Format goal action for display
 */
export function formatGoalAction(args: unknown): GoalDisplayInfo {
  if (!args || typeof args !== 'object') {
    return {
      action: 'unknown',
      actionLabel: 'Unknown Action',
      details: [],
    };
  }

  const input = args as GoalActionInput;
  const details: Array<{ label: string; value: string }> = [];

  let actionLabel = '';
  switch (input.action) {
    case 'create':
      actionLabel = 'Create New Goal';
      if (input.title) {
        details.push({ label: 'Title', value: input.title });
      }
      if (input.description) {
        details.push({ label: 'Description', value: input.description });
      }
      if (input.status) {
        details.push({
          label: 'Status',
          value: input.status.charAt(0).toUpperCase() + input.status.slice(1),
        });
      }
      break;

    case 'update':
      actionLabel = 'Update Goal';
      if (input.title) {
        details.push({ label: 'New Title', value: input.title });
      }
      if (input.description) {
        details.push({ label: 'New Description', value: input.description });
      }
      if (input.status) {
        details.push({
          label: 'New Status',
          value: input.status.charAt(0).toUpperCase() + input.status.slice(1),
        });
      }
      break;

    case 'delete':
      actionLabel = 'Delete Goal';
      details.push({
        label: 'Action',
        value: 'This goal will be permanently deleted',
      });
      break;

    default:
      actionLabel = 'Unknown Action';
  }

  return {
    action: input.action,
    actionLabel,
    details,
  };
}

// ============================================================================
// Tool Display Formatters
// ============================================================================

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  proposeProfileUpdate: 'Update Profile',
  manageGoals: 'Manage Goals',
};

/**
 * Get human-readable name for a tool
 */
export function getToolDisplayName(toolName?: string): string {
  if (!toolName) return 'Tool';
  return (
    TOOL_DISPLAY_NAMES[toolName] ?? toolName.replace(/([A-Z])/g, ' $1').trim()
  );
}

/**
 * Format tool arguments for display
 */
export function formatToolArgs(args: unknown): string {
  if (!args || typeof args !== 'object') return '';
  const obj = args as Record<string, unknown>;
  const entries = Object.entries(obj).filter(
    ([_, v]) => v !== undefined && v !== null,
  );
  if (entries.length === 0) return '';
  return entries
    .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
    .join('\n');
}

// ============================================================================
// Date Formatters
// ============================================================================

/**
 * Format a date relative to now (for conversation list)
 */
export function formatRelativeDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return d.toLocaleDateString([], { weekday: 'long' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
