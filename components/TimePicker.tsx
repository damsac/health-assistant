import { useState } from 'react';
import { Button, Input, Text, XStack, YStack } from '@/components/ui';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  label?: string;
  error?: string;
}

function convert24To12Hour(hour24: number): { hour12: number; period: 'AM' | 'PM' } {
  if (hour24 === 0) return { hour12: 12, period: 'AM' };
  if (hour24 < 12) return { hour12: hour24, period: 'AM' };
  if (hour24 === 12) return { hour12: 12, period: 'PM' };
  return { hour12: hour24 - 12, period: 'PM' };
}

function convert12To24Hour(hour12: number, period: 'AM' | 'PM'): number {
  if (period === 'AM') {
    return hour12 === 12 ? 0 : hour12;
  } else {
    return hour12 === 12 ? 12 : hour12 + 12;
  }
}

export function TimePicker({ value, onChange, label, error }: TimePickerProps) {
  const [hours24, minutes] = value.split(':').map(v => parseInt(v, 10) || 0);
  const { hour12: initialHour12, period: initialPeriod } = convert24To12Hour(hours24);
  
  const [hours, setHours] = useState(initialHour12.toString().padStart(2, '0'));
  const [mins, setMins] = useState(minutes.toString().padStart(2, '0'));
  const [period, setPeriod] = useState<'AM' | 'PM'>(initialPeriod);

  const updateTime = (newHours: string, newMins: string, newPeriod: 'AM' | 'PM') => {
    const hour12 = parseInt(newHours, 10) || 12;
    const hour24 = convert12To24Hour(hour12, newPeriod);
    const formattedHour24 = hour24.toString().padStart(2, '0');
    onChange(`${formattedHour24}:${newMins}`);
  };

  const handleHoursChange = (text: string) => {
    const num = parseInt(text, 10);
    if (text === '' || (num >= 1 && num <= 12)) {
      const formatted = text === '' ? '' : text.padStart(2, '0');
      setHours(formatted);
      if (formatted && mins) {
        updateTime(formatted, mins, period);
      }
    }
  };

  const handleMinutesChange = (text: string) => {
    const num = parseInt(text, 10);
    if (text === '' || (num >= 0 && num <= 59)) {
      const formatted = text === '' ? '' : text.padStart(2, '0');
      setMins(formatted);
      if (hours && formatted) {
        updateTime(hours, formatted, period);
      }
    }
  };

  const incrementHours = () => {
    let newHour = parseInt(hours || '12', 10) + 1;
    if (newHour > 12) newHour = 1;
    const formatted = newHour.toString().padStart(2, '0');
    setHours(formatted);
    updateTime(formatted, mins, period);
  };

  const decrementHours = () => {
    let newHour = parseInt(hours || '12', 10) - 1;
    if (newHour < 1) newHour = 12;
    const formatted = newHour.toString().padStart(2, '0');
    setHours(formatted);
    updateTime(formatted, mins, period);
  };

  const incrementMinutes = () => {
    const newMinutes = ((parseInt(mins || '0', 10) + 15) % 60)
      .toString()
      .padStart(2, '0');
    setMins(newMinutes);
    updateTime(hours, newMinutes, period);
  };

  const decrementMinutes = () => {
    const newMinutes = ((parseInt(mins || '0', 10) - 15 + 60) % 60)
      .toString()
      .padStart(2, '0');
    setMins(newMinutes);
    updateTime(hours, newMinutes, period);
  };

  const togglePeriod = () => {
    const newPeriod = period === 'AM' ? 'PM' : 'AM';
    setPeriod(newPeriod);
    updateTime(hours, mins, newPeriod);
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
              value={mins}
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

        <YStack gap="$2" alignItems="center" minWidth={70}>
          <Button size="$2" onPress={togglePeriod} width={70}>
            {period}
          </Button>
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
