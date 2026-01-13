import { router } from 'expo-router';
import { useState } from 'react';
import { Button, Card, Text, XStack, YStack } from '@/components/ui';
import { useProfile } from '@/lib/hooks/use-profile';
import { useProfileSections } from '@/lib/hooks/use-profile-sections';

interface ProfileCompletionCardProps {
  className?: string;
}

export function ProfileCompletionCard({
  className,
}: ProfileCompletionCardProps) {
  const [showAll, setShowAll] = useState(false);
  const { data: profile } = useProfile();
  const { incompleteSections, isLoading } = useProfileSections();

  if (isLoading || !profile) {
    return null;
  }

  const completionPercentage = profile.profileCompletionPercentage || 0;
  const sectionsToShow = showAll
    ? incompleteSections
    : incompleteSections.slice(0, 3);

  if (incompleteSections.length === 0) {
    return null;
  }

  return (
    <Card gap="$4" padding="$4" className={className}>
      {/* Profile Completion Header */}
      <YStack gap="$2">
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$5" fontWeight="bold">
            Your Profile: {completionPercentage}% Complete
          </Text>
          <Text fontSize="$2" color="gray">
            {100 - completionPercentage}% to go
          </Text>
        </XStack>

        <YStack
          height={8}
          backgroundColor="gray"
          borderRadius={4}
          overflow="hidden"
        >
          <YStack
            height={8}
            backgroundColor="$color"
            width={`${completionPercentage}%`}
            borderRadius={4}
          />
        </YStack>

        <Text fontSize="$3" color="gray">
          Complete your profile for better personalized guidance
        </Text>
      </YStack>

      {/* Incomplete Sections */}
      {incompleteSections.length > 0 && (
        <YStack gap="$3">
          <Text fontSize="$4" fontWeight="600">
            Complete These Sections
          </Text>

          {sectionsToShow.map((section) => (
            <Button
              key={section.key}
              variant="outlined"
              justifyContent="flex-start"
              onPress={() => router.push(section.route as any)}
            >
              <XStack flex={1} alignItems="center" gap="$3">
                <Text fontSize="$6">{section.icon}</Text>
                <YStack flex={1} gap="$1">
                  <Text fontSize="$4" fontWeight="500">
                    {section.title}
                  </Text>
                  <Text fontSize="$2" color="gray">
                    {section.subtitle}
                  </Text>
                </YStack>
                <Text fontSize="$6" color="gray">
                  ›
                </Text>
              </XStack>
            </Button>
          ))}

          {/* Show More/Less Toggle */}
          {incompleteSections.length > 3 && (
            <Button
              variant="outlined"
              size="$3"
              onPress={() => setShowAll(!showAll)}
            >
              <Text color="blue">
                {showAll
                  ? 'Show less'
                  : `Show ${incompleteSections.length - 3} more`}
              </Text>
            </Button>
          )}
        </YStack>
      )}
    </Card>
  );
}
