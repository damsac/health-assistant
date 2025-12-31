// Re-export Tamagui components directly - no custom styling

export {
  Button,
  Card,
  H1,
  H2,
  Spinner,
  Text,
  XStack,
  YStack,
} from 'tamagui';

// TODO: we added this because the input component in Tamagui
// requires onChangeText and onChange props, but we want to just one one. I think Tamgui should handle this
export { Input, type InputProps } from './Input';
