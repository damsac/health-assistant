/**
 * Profile section configuration
 * Defines the available profile sections that users can complete
 */

/**
 * Represents a profile section that can be completed by the user
 */
export interface Section {
  /** Unique identifier for the section */
  key: string;
  /** Display title for the section */
  title: string;
  /** Description of the benefit of completing this section */
  benefit: string;
  /** Emoji icon representing the section */
  icon: string;
  /** Navigation route to the section's form */
  route: string;
}

/**
 * Configuration for all available profile sections
 * These sections can be completed to improve the user's profile and get better health insights
 */
export const SECTIONS_CONFIG: Section[] = [
  {
    key: 'sleep',
    title: 'Sleep Patterns',
    benefit: 'Better energy advice',
    icon: '🌙',
    route: '/(app)/(profile)/sleep',
  },
  {
    key: 'garmin',
    title: 'Connect Garmin',
    benefit: 'Real-time health insights',
    icon: '⌚',
    route: '/(app)/(profile)/garmin',
  },
  {
    key: 'eating',
    title: 'Eating Schedule',
    benefit: 'Optimize meal timing',
    icon: '🍽️',
    route: '/(app)/(profile)/eating',
  },
  {
    key: 'supplements',
    title: 'Supplements & Medications',
    benefit: 'Avoid interactions',
    icon: '💊',
    route: '/(app)/(profile)/supplements',
  },
  {
    key: 'lifestyle',
    title: 'Stress & Lifestyle',
    benefit: 'Holistic wellness view',
    icon: '🧘',
    route: '/(app)/(profile)/lifestyle',
  },
];

/**
 * Get all available profile sections
 * @returns Array of all profile section configurations
 */
export function getAllSections(): Section[] {
  return SECTIONS_CONFIG;
}
