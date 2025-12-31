import { defaultConfig } from '@tamagui/config/v4';
import { createTamagui, createTokens } from 'tamagui';

// Extend tokens when needed (space, size, radius, zIndex)
const tokens = createTokens({
  ...defaultConfig.tokens,
  // Add custom tokens here, e.g.:
  // space: { ...defaultConfig.tokens.space, custom: 100 },
});

// Extend themes when needed (colors are defined here in v4)
const themes = {
  ...defaultConfig.themes,
  light: {
    ...defaultConfig.themes.light,
    // Add light theme color overrides here, e.g.:
    background: '#fff',
  },
  dark: {
    ...defaultConfig.themes.dark,
    // Add dark theme color overrides here
  },
};

export const config = createTamagui({
  ...defaultConfig,
  tokens,
  themes,
  settings: {
    ...defaultConfig.settings,
    onlyAllowShorthands: false,
  },
});

// Type augmentation for autocomplete
export type AppConfig = typeof config;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
