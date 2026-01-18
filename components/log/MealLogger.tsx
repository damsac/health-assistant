import { useState } from 'react';
import { Pressable } from 'react-native';
import { Button, Spinner, Text, XStack, YStack } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { useCreateDailyLog, useTodaySummary } from '@/lib/hooks/use-daily-log';

const QUICK_MEALS = [
  {
    label: 'Breakfast',
    icon: 'B',
    placeholder: 'What did you have for breakfast?',
  },
  { label: 'Lunch', icon: 'L', placeholder: 'What did you have for lunch?' },
  { label: 'Dinner', icon: 'D', placeholder: 'What did you have for dinner?' },
  { label: 'Snack', icon: 'S', placeholder: 'What did you snack on?' },
];

export function MealLogger() {
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  const [mealDetails, setMealDetails] = useState('');
  const [customMeal, setCustomMeal] = useState('');
  const { data: summary } = useTodaySummary();
  const createLog = useCreateDailyLog();

  const mealCount = summary?.mealCount ?? 0;

  const handleMealSelect = (meal: string) => {
    if (selectedMeal === meal) {
      // Clicking selected meal again - log immediately if no details
      if (!mealDetails.trim()) {
        handleQuickLog(meal);
      } else {
        handleQuickLog(meal, mealDetails.trim());
      }
    } else {
      // Select this meal
      setSelectedMeal(meal);
      setMealDetails('');
    }
  };

  const handleQuickLog = (meal: string, details?: string) => {
    createLog.mutate(
      {
        category: 'meal',
        summary: meal,
        details,
      },
      {
        onSuccess: () => {
          setSelectedMeal(null);
          setMealDetails('');
        },
      },
    );
  };

  const handleLogSelectedMeal = () => {
    if (!selectedMeal) return;
    handleQuickLog(selectedMeal, mealDetails.trim() || undefined);
  };

  const handleCustomLog = () => {
    if (!customMeal.trim()) return;
    createLog.mutate(
      {
        category: 'meal',
        summary: customMeal.trim(),
      },
      {
        onSuccess: () => setCustomMeal(''),
      },
    );
  };

  const selectedMealData = QUICK_MEALS.find((m) => m.label === selectedMeal);

  return (
    <YStack gap="$3">
      <XStack justifyContent="space-between" alignItems="center">
        <Text fontSize="$4" fontWeight="600">
          Log a Meal
        </Text>
        <Text fontSize="$2" color="$color10">
          {mealCount} logged today
        </Text>
      </XStack>

      {/* Quick meal buttons */}
      <XStack gap="$2" flexWrap="wrap">
        {QUICK_MEALS.map((meal) => {
          const isSelected = selectedMeal === meal.label;
          return (
            <Pressable
              key={meal.label}
              onPress={() => handleMealSelect(meal.label)}
              disabled={createLog.isPending}
              style={{ flex: 1, minWidth: 70 }}
            >
              <YStack
                backgroundColor={isSelected ? '$orange4' : '$orange2'}
                padding="$3"
                borderRadius="$3"
                alignItems="center"
                gap="$1"
                borderWidth={isSelected ? 2 : 1}
                borderColor={isSelected ? '$orange9' : '$orange6'}
                opacity={createLog.isPending ? 0.5 : 1}
              >
                <Text fontSize={18}>{meal.icon}</Text>
                <Text
                  fontSize="$2"
                  color="$orange11"
                  fontWeight={isSelected ? '600' : '400'}
                >
                  {meal.label}
                </Text>
              </YStack>
            </Pressable>
          );
        })}
      </XStack>

      {/* Optional details input when meal is selected */}
      {selectedMeal && (
        <YStack gap="$2" animation="quick" enterStyle={{ opacity: 0, y: -10 }}>
          <Input
            placeholder={selectedMealData?.placeholder}
            value={mealDetails}
            onChangeText={setMealDetails}
            editable={!createLog.isPending}
            borderRadius="$3"
            backgroundColor="$color2"
            borderWidth={1}
            borderColor="$borderColor"
          />
          <Button
            onPress={handleLogSelectedMeal}
            disabled={createLog.isPending}
            backgroundColor="$orange9"
          >
            {createLog.isPending ? (
              <Spinner size="small" color="white" />
            ) : (
              <Text color="white" fontWeight="600">
                Log {selectedMeal}
              </Text>
            )}
          </Button>
        </YStack>
      )}

      {/* Custom meal input - only show when no meal selected */}
      {!selectedMeal && (
        <YStack gap="$2">
          <Text fontSize="$3" color="$color10" textAlign="center">
            Or log a custom meal
          </Text>
          <XStack gap="$2">
            <Input
              flex={1}
              placeholder="Describe what you ate..."
              value={customMeal}
              onChangeText={setCustomMeal}
              editable={!createLog.isPending}
              borderRadius="$3"
              backgroundColor="$color2"
              borderWidth={1}
              borderColor="$borderColor"
            />
            <Button
              onPress={handleCustomLog}
              disabled={!customMeal.trim() || createLog.isPending}
              backgroundColor={customMeal.trim() ? '$orange9' : '$color5'}
              paddingHorizontal="$4"
            >
              {createLog.isPending ? (
                <Spinner size="small" color="white" />
              ) : (
                <Text color="white" fontWeight="600">
                  Log
                </Text>
              )}
            </Button>
          </XStack>
        </YStack>
      )}
    </YStack>
  );
}
