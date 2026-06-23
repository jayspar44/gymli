import { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Animated,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUserProfile } from '../contexts/UserProfileContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Chip } from '../components/ui/Chip';
import { cn } from '../lib/cn';

const GOAL_PRESETS = [
  { label: 'Strength', phrase: 'Build raw strength and increase my major lifts' },
  { label: 'Muscle Growth', phrase: 'Build muscle mass and improve my physique' },
  { label: 'General Fitness', phrase: 'Improve overall fitness, health, and feel better' },
  { label: 'Weight Loss', phrase: 'Lose body fat while maintaining muscle' },
];

const EXPERIENCE_LEVELS = [
  {
    value: 'beginner',
    label: 'Beginner',
    desc: 'New to strength training or less than 6 months',
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    desc: '1-3 years of consistent training',
  },
  {
    value: 'advanced',
    label: 'Advanced',
    desc: '3+ years, comfortable with programming',
  },
];

const TOTAL_STEPS = 3;

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View className="flex-row items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          className={cn(
            'w-2.5 h-2.5 rounded-full',
            i + 1 <= current ? 'bg-primary' : 'bg-surface-alt dark:bg-surface-dark'
          )}
        />
      ))}
    </View>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const { updateProfile } = useUserProfile();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    displayName: '',
    goals: '',
    experienceLevel: '',
    bodyweight: '',
    units: 'lbs',
  });
  const [selectedGoalPreset, setSelectedGoalPreset] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function goForward() {
    setStep((prev) => prev + 1);
  }

  function goBack() {
    setStep((prev) => prev - 1);
  }

  function handleGoalPreset(preset: { label: string; phrase: string }) {
    if (selectedGoalPreset === preset.label) {
      setSelectedGoalPreset(null);
      setFormData((prev) => ({ ...prev, goals: '' }));
    } else {
      setSelectedGoalPreset(preset.label);
      setFormData((prev) => ({ ...prev, goals: preset.phrase }));
    }
  }

  async function handleFinish() {
    setSaving(true);
    setError(null);
    try {
      await updateProfile({
        displayName: formData.displayName.trim(),
        goals: formData.goals,
        experienceLevel: formData.experienceLevel,
        bodyweight: formData.bodyweight ? Number(formData.bodyweight) : null,
        units: formData.units,
        onboardingComplete: true,
      });
      router.replace('/' as never);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      setSaving(false);
    }
  }

  function renderStep() {
    switch (step) {
      case 1:
        return (
          <View className="flex-col items-center">
            <Text className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2 text-center">
              {"Let's get you set up."}
            </Text>
            <Text className="text-sm text-zinc-500 mb-8 text-center">
              First, what should we call you?
            </Text>
            <View className="w-full max-w-sm">
              <Input
                value={formData.displayName}
                onChangeText={(v) => setFormData((prev) => ({ ...prev, displayName: v }))}
                placeholder="Your name"
                className="text-center"
                autoFocus
                autoCapitalize="words"
              />
            </View>
            <View className="w-full max-w-sm mt-8">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={!formData.displayName.trim()}
                onPress={goForward}
              >
                Continue
              </Button>
            </View>
          </View>
        );

      case 2:
        return (
          <View className="flex-col items-center">
            <Text className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2 text-center">
              What are you training for?
            </Text>
            <Text className="text-sm text-zinc-500 mb-6 text-center">
              Pick a goal or describe your own.
            </Text>
            <View className="flex-row flex-wrap justify-center gap-2 mb-6">
              {GOAL_PRESETS.map((preset) => (
                <Chip
                  key={preset.label}
                  selected={selectedGoalPreset === preset.label}
                  onPress={() => handleGoalPreset(preset)}
                >
                  {preset.label}
                </Chip>
              ))}
            </View>
            <View className="w-full max-w-sm">
              <TextInput
                value={formData.goals}
                onChangeText={(v) => {
                  setFormData((prev) => ({ ...prev, goals: v }));
                  setSelectedGoalPreset(null);
                }}
                placeholder="Build muscle, lose fat, get stronger..."
                multiline
                numberOfLines={3}
                placeholderTextColor="#71717a"
                className="w-full rounded-xl bg-surface-alt dark:bg-surface-dark border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-50 px-4 py-3 text-base"
                style={styles.textArea}
              />
            </View>
            <View className="w-full max-w-sm mt-8 gap-3">
              <Button variant="primary" size="lg" fullWidth onPress={goForward}>
                Continue
              </Button>
              <Button variant="ghost" size="md" fullWidth onPress={goBack}>
                Back
              </Button>
            </View>
          </View>
        );

      case 3:
        return (
          <View className="flex-col items-center">
            <Text className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2 text-center">
              Where are you starting from?
            </Text>
            <Text className="text-sm text-zinc-500 mb-6 text-center">
              This helps us tailor your experience.
            </Text>
            <View className="w-full max-w-sm gap-3 mb-6">
              {EXPERIENCE_LEVELS.map((level) => (
                <Pressable
                  key={level.value}
                  onPress={() =>
                    setFormData((prev) => ({ ...prev, experienceLevel: level.value }))
                  }
                  className={cn(
                    'rounded-2xl border p-4 min-h-[72px] justify-center',
                    formData.experienceLevel === level.value
                      ? 'border-primary bg-primary/5'
                      : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-surface-dark'
                  )}
                >
                  <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                    {level.label}
                  </Text>
                  <Text className="text-sm text-zinc-500 mt-0.5">{level.desc}</Text>
                </Pressable>
              ))}
            </View>
            <View className="w-full max-w-sm flex-row gap-3 items-end mb-4">
              <View className="flex-1">
                <Input
                  label="Bodyweight (optional)"
                  keyboardType="numeric"
                  value={formData.bodyweight}
                  onChangeText={(v) => setFormData((prev) => ({ ...prev, bodyweight: v }))}
                  placeholder="e.g. 180"
                  suffix={formData.units}
                />
              </View>
              <View className="flex-row rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 mb-0.5">
                {(['lbs', 'kg'] as const).map((unit) => (
                  <Pressable
                    key={unit}
                    onPress={() => setFormData((prev) => ({ ...prev, units: unit }))}
                    className={cn(
                      'px-4 min-h-12 items-center justify-center',
                      formData.units === unit
                        ? 'bg-primary'
                        : 'bg-white dark:bg-surface-dark'
                    )}
                  >
                    <Text
                      className={cn(
                        'text-base font-medium',
                        formData.units === unit
                          ? 'text-white'
                          : 'text-zinc-500'
                      )}
                    >
                      {unit}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            {error ? (
              <View className="w-full max-w-sm px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
                <Text className="text-red-500 text-sm">{error}</Text>
              </View>
            ) : null}
            <View className="w-full max-w-sm gap-3">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={!formData.experienceLevel}
                loading={saving}
                onPress={handleFinish}
              >
                Get Started
              </Button>
              <Button variant="ghost" size="md" fullWidth onPress={goBack} disabled={saving}>
                Back
              </Button>
            </View>
          </View>
        );

      default:
        return null;
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg dark:bg-bg-dark" edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 pt-16 pb-8">
          <StepIndicator current={step} total={TOTAL_STEPS} />
          <View className="flex-1 justify-center">{renderStep()}</View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
