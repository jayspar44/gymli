import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useUserProfile } from '../contexts/UserProfileContext';
import MobileContainer from '../components/layout/MobileContainer';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Chip from '../components/ui/Chip';

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

function StepIndicator({ current, total }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`w-2.5 h-2.5 rounded-full transition-colors duration-200 ${
            i + 1 <= current
              ? 'bg-[var(--color-primary)]'
              : 'bg-[var(--color-surface-alt)]'
          }`}
        />
      ))}
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { updateProfile } = useUserProfile();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] = useState({
    displayName: '',
    goals: '',
    experienceLevel: '',
    bodyweight: '',
    units: 'lbs',
  });
  const [selectedGoalPreset, setSelectedGoalPreset] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function goForward() {
    setDirection(1);
    setStep(prev => prev + 1);
  }

  function goBack() {
    setDirection(-1);
    setStep(prev => prev - 1);
  }

  function handleGoalPreset(preset) {
    if (selectedGoalPreset === preset.label) {
      setSelectedGoalPreset(null);
      setFormData(prev => ({ ...prev, goals: '' }));
    } else {
      setSelectedGoalPreset(preset.label);
      setFormData(prev => ({ ...prev, goals: preset.phrase }));
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
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      setSaving(false);
    }
  }

  function renderStep() {
    switch (step) {
      case 1:
        return (
          <div className="flex flex-col items-center text-center">
            <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">
              Let&apos;s get you set up.
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mb-8">
              First, what should we call you?
            </p>
            <div className="w-full max-w-sm">
              <Input
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="Your name"
                className="text-center"
              />
            </div>
            <div className="w-full max-w-sm mt-8">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={!formData.displayName.trim()}
                onClick={goForward}
              >
                Continue
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col items-center text-center">
            <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">
              What are you training for?
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              Pick a goal or describe your own.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {GOAL_PRESETS.map(preset => (
                <Chip
                  key={preset.label}
                  selected={selectedGoalPreset === preset.label}
                  onPress={() => handleGoalPreset(preset)}
                >
                  {preset.label}
                </Chip>
              ))}
            </div>
            <div className="w-full max-w-sm">
              <textarea
                value={formData.goals}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, goals: e.target.value }));
                  setSelectedGoalPreset(null);
                }}
                placeholder="Build muscle, lose fat, get stronger..."
                rows={3}
                className="w-full rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-secondary)] outline-none focus:border-[var(--color-primary)] transition-colors px-3 py-2.5 text-sm resize-none"
              />
            </div>
            <div className="w-full max-w-sm mt-8 flex flex-col gap-3">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={goForward}
              >
                Continue
              </Button>
              <Button variant="ghost" size="md" fullWidth onClick={goBack}>
                Back
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="flex flex-col items-center text-center">
            <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">
              Where are you starting from?
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              This helps us tailor your experience.
            </p>
            <div className="w-full max-w-sm flex flex-col gap-3 mb-6">
              {EXPERIENCE_LEVELS.map(level => (
                <Card
                  key={level.value}
                  interactive
                  onClick={() => setFormData(prev => ({ ...prev, experienceLevel: level.value }))}
                  className={`text-left ${
                    formData.experienceLevel === level.value
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/.05'
                      : ''
                  }`}
                >
                  <p className="text-sm font-semibold text-[var(--color-text)]">
                    {level.label}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    {level.desc}
                  </p>
                </Card>
              ))}
            </div>
            <div className="w-full max-w-sm flex gap-3 items-end">
              <div className="flex-1">
                <Input
                  label="Bodyweight (optional)"
                  type="number"
                  value={formData.bodyweight}
                  onChange={(e) => setFormData(prev => ({ ...prev, bodyweight: e.target.value }))}
                  placeholder="e.g. 180"
                  suffix={formData.units}
                />
              </div>
              <div className="flex rounded-xl overflow-hidden border border-[var(--color-border)] mb-[1px]">
                {['lbs', 'kg'].map(unit => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, units: unit }))}
                    className={`px-3 py-2.5 text-sm font-medium transition-colors ${
                      formData.units === unit
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                    }`}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>
            {error && (
              <div className="w-full max-w-sm mt-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-left">
                {error}
              </div>
            )}
            <div className="w-full max-w-sm mt-8 flex flex-col gap-3">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={!formData.experienceLevel}
                loading={saving}
                onClick={handleFinish}
              >
                Get Started
              </Button>
              <Button variant="ghost" size="md" fullWidth onClick={goBack} disabled={saving}>
                Back
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <MobileContainer>
      <div className="flex flex-col flex-1 px-6 pt-16 pb-8">
        <StepIndicator current={step} total={3} />
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 100 : -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -100 : 100 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col justify-center"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </MobileContainer>
  );
}
