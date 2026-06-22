/**
 * Profile screen — port of frontend/src/pages/Profile.jsx.
 *
 * Grouped settings sections with debounced auto-save (800 ms), theme toggle,
 * day-picker, and sign-out. All backed by useUserProfile().updateProfile.
 *
 * RoutineEditor is not shown here — it lives in Log (routine management).
 * ProfileMenu is a reusable component; not mounted in the tab itself.
 */
import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, LogOut } from 'lucide-react-native';
import { useUserProfile, type UserProfile } from '../../contexts/UserProfileContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Button } from '../../components/ui/Button';
import { TestIds } from '../../lib/test-ids';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-3">
      <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-1">
        {title}
      </Text>
      <Card padding="md">
        <View className="gap-4">{children}</View>
      </Card>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Form state type (subset of UserProfile that this screen edits)
// ---------------------------------------------------------------------------
type FormData = {
  displayName: string;
  experienceLevel: string;
  goals: string;
  availableDays: string[];
  bodyweight: string;
  units: string;
};

// ---------------------------------------------------------------------------
// Profile screen
// ---------------------------------------------------------------------------
export default function ProfileScreen() {
  const { profile, loading, updateProfile } = useUserProfile();
  const { signOut } = useAuth();
  const { preference, setTheme } = useTheme();
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [formData, setFormData] = useState<FormData>({
    displayName: '',
    experienceLevel: 'beginner',
    goals: '',
    availableDays: [],
    bodyweight: '',
    units: 'lbs',
  });

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      const p = profile as UserProfile & {
        displayName?: string;
        experienceLevel?: string;
        goals?: string;
        availableDays?: string[];
        bodyweight?: string | number;
      };
      setFormData({
        displayName: p.displayName ?? '',
        experienceLevel: p.experienceLevel ?? 'beginner',
        goals: p.goals ?? '',
        availableDays: p.availableDays ?? [],
        bodyweight: p.bodyweight != null ? String(p.bodyweight) : '',
        units: (p.units as string) ?? 'lbs',
      });
    }
  }, [profile]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  function handleChange(field: keyof FormData, value: string | string[]) {
    const updated: FormData = { ...formData, [field]: value };
    setFormData(updated);
    setSaveError('');

    // Debounced auto-save
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateProfile({
          ...updated,
          bodyweight: updated.bodyweight ? Number(updated.bodyweight) : null,
        } as Partial<UserProfile>);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setSaveError('Failed to save changes');
        console.error('Auto-save failed:', err);
      }
    }, 800);
  }

  function toggleDay(day: string) {
    const newDays = formData.availableDays.includes(day)
      ? formData.availableDays.filter((d) => d !== day)
      : [...formData.availableDays, day];
    handleChange('availableDays', newDays);
  }

  // Loading state
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-bg dark:bg-bg-dark" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#d4872a" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg dark:bg-bg-dark" edges={['top']}>
      <ScrollView
        contentContainerClassName="px-4 py-6 pb-24 gap-6"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Settings</Text>
          <View className="flex-row items-center gap-2">
            {saved ? (
              <View testID={TestIds.PROFILE_SAVED_INDICATOR} className="flex-row items-center gap-1">
                <Check size={14} color="#22c55e" strokeWidth={2.5} />
                <Text className="text-xs text-green-500">Saved</Text>
              </View>
            ) : null}
            {saveError ? (
              <Text className="text-xs text-red-500">{saveError}</Text>
            ) : null}
          </View>
        </View>

        {/* Personal */}
        <Section title="Personal">
          <Input
            testID={TestIds.PROFILE_DISPLAY_NAME_INPUT}
            label="Display Name"
            value={formData.displayName}
            onChangeText={(v) => handleChange('displayName', v)}
            placeholder="What should Gymli call you?"
          />
          <Input
            label="Bodyweight"
            value={formData.bodyweight}
            onChangeText={(v) => handleChange('bodyweight', v)}
            placeholder="Optional"
            suffix={formData.units}
            keyboardType="decimal-pad"
          />
          <View className="gap-1.5">
            <Text className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Units</Text>
            <SegmentedControl
              options={[
                { value: 'lbs', label: 'lbs' },
                { value: 'kg', label: 'kg' },
              ]}
              value={formData.units}
              onChange={(val) => handleChange('units', val)}
            />
          </View>
        </Section>

        {/* Training */}
        <Section title="Training">
          <View className="gap-1.5">
            <Text className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Experience Level
            </Text>
            <SegmentedControl
              options={[
                { value: 'beginner', label: 'Beginner' },
                { value: 'intermediate', label: 'Intermediate' },
                { value: 'advanced', label: 'Advanced' },
              ]}
              value={formData.experienceLevel}
              onChange={(val) => handleChange('experienceLevel', val)}
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Goals</Text>
            <TextInput
              value={formData.goals}
              onChangeText={(v) => handleChange('goals', v)}
              placeholder="Build muscle, lose fat, get stronger..."
              placeholderTextColor="#71717a"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="rounded-xl bg-surface-alt dark:bg-surface-dark border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-50 px-4 py-3 text-base min-h-[80px]"
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Training Days
            </Text>
            <View className="flex-row gap-1.5">
              {DAYS.map((day) => (
                <Pressable
                  key={day}
                  onPress={() => toggleDay(day)}
                  className={[
                    'flex-1 min-h-11 rounded-lg items-center justify-center',
                    formData.availableDays.includes(day)
                      ? 'bg-primary'
                      : 'bg-surface-alt dark:bg-surface-dark',
                  ].join(' ')}
                >
                  <Text
                    className={[
                      'text-sm font-medium',
                      formData.availableDays.includes(day)
                        ? 'text-white'
                        : 'text-zinc-500',
                    ].join(' ')}
                  >
                    {day}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Section>

        {/* Preferences */}
        <Section title="Preferences">
          <View className="gap-1.5">
            <Text className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Theme</Text>
            <SegmentedControl
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'system', label: 'System' },
              ]}
              value={preference}
              onChange={(val) => setTheme(val as 'light' | 'dark' | 'system')}
            />
          </View>
        </Section>

        {/* Account */}
        <Section title="Account">
          <Button variant="destructive" fullWidth onPress={() => signOut()}>
            <LogOut size={16} color="#fff" strokeWidth={1.5} />
            Sign Out
          </Button>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
