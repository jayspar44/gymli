import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Flame, ChevronDown } from 'lucide-react';
import { useUserProfile } from '../contexts/UserProfileContext';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner', desc: 'Less than 1 year' },
  { value: 'intermediate', label: 'Intermediate', desc: '1-3 years' },
  { value: 'advanced', label: 'Advanced', desc: '3+ years' },
];

export default function Profile() {
  const { profile, loading, updateProfile, needsOnboarding } = useUserProfile();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    displayName: '',
    experienceLevel: 'beginner',
    goals: '',
    availableDays: [],
    bodyweight: '',
    units: 'lbs',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        displayName: profile.displayName || '',
        experienceLevel: profile.experienceLevel || 'beginner',
        goals: profile.goals || '',
        availableDays: profile.availableDays || [],
        bodyweight: profile.bodyweight || '',
        units: profile.units || 'lbs',
      });
    }
  }, [profile]);

  function toggleDay(day) {
    setForm(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        ...form,
        bodyweight: form.bodyweight ? Number(form.bodyweight) : null,
        onboardingComplete: true,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      if (needsOnboarding) {
        navigate('/');
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 pb-8">
      {/* Header */}
      {needsOnboarding ? (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-[var(--color-primary)]" strokeWidth={1.5} />
            <h2
              className="text-lg tracking-wider font-semibold text-[var(--color-text)]"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Welcome, warrior!
            </h2>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Tell Gimli about yourself so he can forge the perfect training plan.
          </p>
        </div>
      ) : (
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-6">Profile</h2>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Display Name */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
            Display Name
          </label>
          <input
            type="text"
            value={form.displayName}
            onChange={(e) => setForm(prev => ({ ...prev, displayName: e.target.value }))}
            placeholder="What should Gimli call you?"
            className="w-full py-3 px-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-secondary)] text-sm outline-none transition-colors focus:border-[var(--color-primary)]"
          />
        </div>

        {/* Experience Level */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
            Experience Level
          </label>
          <div className="relative">
            <select
              value={form.experienceLevel}
              onChange={(e) => setForm(prev => ({ ...prev, experienceLevel: e.target.value }))}
              className="w-full py-3 px-3.5 pr-10 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] text-sm outline-none appearance-none transition-colors focus:border-[var(--color-primary)]"
            >
              {EXPERIENCE_LEVELS.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label} — {level.desc}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)] pointer-events-none" />
          </div>
        </div>

        {/* Goals */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
            Goals
          </label>
          <textarea
            value={form.goals}
            onChange={(e) => setForm(prev => ({ ...prev, goals: e.target.value }))}
            placeholder="Build muscle, lose fat, get stronger..."
            rows={3}
            className="w-full py-3 px-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-secondary)] text-sm outline-none resize-none transition-colors focus:border-[var(--color-primary)]"
          />
        </div>

        {/* Available Days */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            Available Training Days
          </label>
          <div className="flex gap-2">
            {DAYS.map(day => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  form.availableDays.includes(day)
                    ? 'bg-[var(--color-primary)] text-white shadow-sm'
                    : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Bodyweight + Units */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              Bodyweight
            </label>
            <input
              type="number"
              value={form.bodyweight}
              onChange={(e) => setForm(prev => ({ ...prev, bodyweight: e.target.value }))}
              placeholder="Optional"
              className="w-full py-3 px-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-secondary)] text-sm outline-none transition-colors focus:border-[var(--color-primary)]"
            />
          </div>
          <div className="w-28">
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              Units
            </label>
            <div className="flex rounded-xl overflow-hidden border border-[var(--color-border)]">
              {['lbs', 'kg'].map(unit => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, units: unit }))}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    form.units === unit
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-[#d4872a] to-[#b86b1f] text-[#fdf8f0] font-semibold text-sm transition-all duration-200 hover:shadow-lg hover:shadow-[#d4872a25] active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : saved ? (
            'Saved!'
          ) : (
            <>
              <Save className="w-4 h-4" strokeWidth={1.5} />
              {needsOnboarding ? "Let's Go!" : 'Save Profile'}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
