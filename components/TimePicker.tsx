import { useState } from 'react';
import { Button, Input, Text, XStack, YStack } from '@/components/ui';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  label?: string;
  error?: string;
}

export function TimePicker({ value, onChange, label, error }: TimePickerProps) {
  const [hours, setHours] = useState(() => {
    const [h] = value.split(':');
    return h || '07';
  });
  const [minutes, setMinutes] = useState(() => {
    const [, m] = value.split(':');
    return m || '00';
  });

  const handleHoursChange = (text: string) => {
    const num = parseInt(text, 10);
    if (text === '' || (num >= 0 && num <= 23)) {
      const formatted = text === '' ? '' : text.padStart(2, '0');
      setHours(formatted);
      if (formatted && minutes) {
        onChange(`${formatted}:${minutes}`);
      }
    }
  };

  const handleMinutesChange = (text: string) => {
    const num = parseInt(text, 10);
    if (text === '' || (num >= 0 && num <= 59)) {
      const formatted = text === '' ? '' : text.padStart(2, '0');
      setMinutes(formatted);
      if (hours && formatted) {
        onChange(`${hours}:${formatted}`);
      }
    }
  };

  const incrementHours = () => {
    const newHours = ((parseInt(hours || '0', 10) + 1) % 24)
      .toString()
      .padStart(2, '0');
    setHours(newHours);
    onChange(`${newHours}:${minutes}`);
  };

  const decrementHours = () => {
    const newHours = ((parseInt(hours || '0', 10) - 1 + 24) % 24)
      .toString()
      .padStart(2, '0');
    setHours(newHours);
    onChange(`${newHours}:${minutes}`);
  };

  const incrementMinutes = () => {
    const newMinutes = ((parseInt(minutes || '0', 10) + 15) % 60)
      .toString()
      .padStart(2, '0');
    setMinutes(newMinutes);
    onChange(`${hours}:${newMinutes}`);
  };

  const decrementMinutes = () => {
    const newMinutes = ((parseInt(minutes || '0', 10) - 15 + 60) % 60)
      .toString()
      .padStart(2, '0');
    setMinutes(newMinutes);
    onChange(`${hours}:${newMinutes}`);
  };

  return (
    <YStack gap="$2">
      {label && (
        <Text fontSize="$4" fontWeight="600">
          {label}
        </Text>
      )}
      <XStack gap="$3" alignItems="center" flexWrap="wrap">
        <YStack gap="$2" alignItems="center" minWidth={80}>
          <Button size="$2" onPress={incrementHours} width={70}>
            ▲
          </Button>
          <YStack width={70} alignItems="center">
            <Input
              value={hours}
              onChangeText={handleHoursChange}
              keyboardType="number-pad"
              maxLength={2}
              textAlign="center"
              width={70}
              paddingHorizontal="$2"
            />
          </YStack>
          <Button size="$2" onPress={decrementHours} width={70}>
            ▼
          </Button>
        </YStack>

        <Text fontSize="$8" fontWeight="bold" paddingHorizontal="$2">
          :
        </Text>

        <YStack gap="$2" alignItems="center" minWidth={80}>
          <Button size="$2" onPress={incrementMinutes} width={70}>
            ▲
          </Button>
          <YStack width={70} alignItems="center">
            <Input
              value={minutes}
              onChangeText={handleMinutesChange}
              keyboardType="number-pad"
              maxLength={2}
              textAlign="center"
              width={70}
              paddingHorizontal="$2"
            />
          </YStack>
          <Button size="$2" onPress={decrementMinutes} width={70}>
            ▼
          </Button>
        </YStack>

        <YStack gap="$1" marginLeft="$2">
          <Text fontSize="$2" color="gray">
            24-hour
          </Text>
          <Text fontSize="$2" color="gray">
            format
          </Text>
        </YStack>
      </XStack>
      {error && (
        <Text color="red" fontSize="$2">
          {error}
        </Text>
      )}
    </YStack>
  );
}
