import { defaultConfig } from '@tamagui/config/v4';
import { createTamagui } from 'tamagui';

export const config = createTamagui({
  ...defaultConfig,
  settings: {
    ...defaultConfig.settings,
    // Allow both longhands (justifyContent) and shorthands (justify)
    onlyAllowShorthands: false,
  },
});

export default config;
