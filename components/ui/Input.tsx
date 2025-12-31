import { type GetProps, Input as TamaguiInput } from 'tamagui';

type TamaguiInputProps = GetProps<typeof TamaguiInput>;

export type InputProps = Omit<
  TamaguiInputProps,
  'onChangeText' | 'onChange'
> & {
  onChangeText?: (text: string) => void;
};

/**
 * Cross-platform Input component that wraps Tamagui's Input.
 * Handles both web (onChange) and native (onChangeText) events automatically.
 */
export const Input = ({ onChangeText, ...props }: InputProps) => {
  return (
    <TamaguiInput
      {...props}
      onChangeText={onChangeText as TamaguiInputProps['onChangeText']}
      onChange={(e: unknown) => {
        // Handle web platform where onChange provides DOM event
        const target = (e as { target?: { value?: string } }).target;
        if (target?.value !== undefined) {
          onChangeText?.(target.value);
        }
      }}
    />
  );
};
