import { useState, useEffect, useRef } from 'react';
import { Check, LogOut } from 'lucide-react';
import { useUserProfile } from '../contexts/UserProfileContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import SegmentedControl from '../components/ui/SegmentedControl';
import Button from '../components/ui/Button';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function Section({ title, children }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] px-1">
        {title}
      </h2>
      <Card padding="md">
        <div className="space-y-4">
          {children}
        </div>
      </Card>
    </div>
  );
}

export default function Profile() {
  const { profile, loading, updateProfile } = useUserProfile();
  const { signOut } = useAuth();
  const { preference, setTheme } = useTheme();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const saveTimeoutRef = useRef(null);

  const [formData, setFormData] = useState({
    displayName: '',
    experienceLevel: 'beginner',
    goals: '',
    availableDays: [],
    bodyweight: '',
    units: 'lbs',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        experienceLevel: profile.experienceLevel || 'beginner',
        goals: profile.goals || '',
        availableDays: profile.availableDays || [],
        bodyweight: profile.bodyweight || '',
        units: profile.units || 'lbs',
      });
    }
  }, [profile]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const handleChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    setError('');

    // Debounced auto-save
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateProfile({
          ...updated,
          bodyweight: updated.bodyweight ? Number(updated.bodyweight) : null,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError('Failed to save changes');
        console.error('Auto-save failed:', err);
      }
    }, 800);
  };

  function toggleDay(day) {
    const newDays = formData.availableDays.includes(day)
      ? formData.availableDays.filter(d => d !== day)
      : [...formData.availableDays, day];
    handleChange('availableDays', newDays);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 pb-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--color-text)]">Settings</h1>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-[var(--color-success)] animate-in fade-in">
            <Check className="w-3.5 h-3.5" strokeWidth={2} />
            Saved
          </span>
        )}
        {error && (
          <span className="text-xs text-[var(--color-danger)]">{error}</span>
        )}
      </div>

      {/* Personal Section */}
      <Section title="Personal">
        <Input
          label="Display Name"
          value={formData.displayName}
          onChange={(e) => handleChange('displayName', e.target.value)}
          placeholder="What should Gymli call you?"
        />
        <Input
          label="Bodyweight"
          type="number"
          value={formData.bodyweight}
          onChange={(e) => handleChange('bodyweight', e.target.value)}
          placeholder="Optional"
          suffix={formData.units}
        />
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[var(--color-text)]">
            Units
          </label>
          <SegmentedControl
            options={[
              { value: 'lbs', label: 'lbs' },
              { value: 'kg', label: 'kg' },
            ]}
            value={formData.units}
            onChange={(val) => handleChange('units', val)}
            className="w-full"
          />
        </div>
      </Section>

      {/* Training Section */}
      <Section title="Training">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[var(--color-text)]">
            Experience Level
          </label>
          <SegmentedControl
            options={[
              { value: 'beginner', label: 'Beginner' },
              { value: 'intermediate', label: 'Intermediate' },
              { value: 'advanced', label: 'Advanced' },
            ]}
            value={formData.experienceLevel}
            onChange={(val) => handleChange('experienceLevel', val)}
            className="w-full"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[var(--color-text)]">
            Goals
          </label>
          <textarea
            value={formData.goals}
            onChange={(e) => handleChange('goals', e.target.value)}
            placeholder="Build muscle, lose fat, get stronger..."
            rows={3}
            className="w-full rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-secondary)] outline-none focus:border-[var(--color-primary)] transition-colors px-3 py-2.5 text-sm resize-none"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[var(--color-text)]">
            Training Days
          </label>
          <div className="flex gap-2">
            {DAYS.map(day => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  formData.availableDays.includes(day)
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Preferences Section */}
      <Section title="Preferences">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[var(--color-text)]">
            Theme
          </label>
          <SegmentedControl
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ]}
            value={preference}
            onChange={(val) => setTheme(val)}
            className="w-full"
          />
        </div>
      </Section>

      {/* Account Section */}
      <Section title="Account">
        <Button
          variant="destructive"
          fullWidth
          onClick={() => signOut()}
        >
          <LogOut className="w-4 h-4" strokeWidth={1.5} />
          Sign Out
        </Button>
      </Section>
    </div>
  );
}
