export interface Section {
  key: string;
  title: string;
  benefit: string;
  icon: string;
  route: string;
}

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

export function getAllSections(): Section[] {
  return SECTIONS_CONFIG;
}
