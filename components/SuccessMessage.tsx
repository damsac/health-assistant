import { useEffect, useState } from 'react';
import { Card, Text, XStack } from '@/components/ui';

interface SuccessMessageProps {
  message: string;
  visible: boolean;
  onDismiss?: () => void;
  duration?: number;
}

export function SuccessMessage({
  message,
  visible,
  onDismiss,
  duration = 3000,
}: SuccessMessageProps) {
  const [show, setShow] = useState(visible);

  useEffect(() => {
    setShow(visible);
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        setShow(false);
        onDismiss?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onDismiss]);

  if (!show) return null;

  return (
    <Card
      position="absolute"
      top="$4"
      left="$4"
      right="$4"
      backgroundColor="$green9"
      padding="$3"
      zIndex={1000}
      elevation={4}
    >
      <XStack alignItems="center" gap="$2">
        <Text fontSize="$5">✓</Text>
        <Text color="white" fontWeight="600">
          {message}
        </Text>
      </XStack>
    </Card>
  );
}
