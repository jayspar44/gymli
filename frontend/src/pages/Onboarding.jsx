import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Star } from 'lucide-react';
import { useUserProfile } from '../contexts/UserProfileContext';
import { getTemplates, generatePlan as generatePlanApi } from '../api/services';
import MobileContainer from '../components/layout/MobileContainer';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Chip from '../components/ui/Chip';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

function recommendTemplate(daysCount) {
  if (daysCount <= 3) return 'full_body';
  if (daysCount === 4) return 'upper_lower';
  if (daysCount === 5) return 'bro_split';
  return 'ppl';
}

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
    availableDays: [],
    templateId: null,
  });
  const [selectedGoalPreset, setSelectedGoalPreset] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Fetch templates when reaching step 4
  useEffect(() => {
    if (step === 4 && templates.length === 0) {
      setTemplatesLoading(true);
      getTemplates()
        .then(data => {
          setTemplates(data.templates || []);
        })
        .catch(() => setError('Failed to load plan templates'))
        .finally(() => setTemplatesLoading(false));
    }
  }, [step, templates.length]);

  // Auto-recommend template when days or experience change on step 4
  useEffect(() => {
    if (step === 4 && formData.availableDays.length > 0 && templates.length > 0) {
      const recommendedId = recommendTemplate(formData.availableDays.length);
      const match = templates.find(t => t.id === recommendedId);
      if (match && !formData.templateId) {
        setFormData(prev => ({ ...prev, templateId: recommendedId }));
      }
    }
  }, [step, formData.availableDays.length, formData.templateId, templates]);

  function goForward() {
    setDirection(1);
    setStep(prev => prev + 1);
  }

  function goBack() {
    setDirection(-1);
    setStep(prev => prev - 1);
  }

  function toggleDay(day) {
    setFormData(prev => {
      const newDays = prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day];
      // Reset template selection when days change so auto-recommend can re-fire
      const newRecommended = recommendTemplate(newDays.length);
      const match = templates.find(t => t.id === newRecommended);
      return {
        ...prev,
        availableDays: newDays,
        templateId: match ? newRecommended : prev.templateId,
      };
    });
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

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      // Save profile
      await updateProfile({
        displayName: formData.displayName.trim(),
        goals: formData.goals,
        experienceLevel: formData.experienceLevel,
        bodyweight: formData.bodyweight ? Number(formData.bodyweight) : null,
        units: formData.units,
        availableDays: formData.availableDays,
        onboardingComplete: true,
      });
      // Generate plan
      await generatePlanApi(formData.templateId);
      // Navigate to Today
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      setGenerating(false);
    }
  }

  const recommendedTemplateId = formData.availableDays.length > 0
    ? recommendTemplate(formData.availableDays.length)
    : null;

  function renderStep() {
    switch (step) {
      case 1:
        return (
          <div className="flex flex-col items-center text-center">
            <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">
              Let&apos;s build your program.
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
              This helps us tailor your plan.
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
            <div className="w-full max-w-sm mt-8 flex flex-col gap-3">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={!formData.experienceLevel}
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

      case 4:
        return (
          <div className="flex flex-col items-center text-center">
            {generating ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-10 h-10 mb-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                <p className="text-base font-medium text-[var(--color-text)]">
                  Generating your plan...
                </p>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                  This may take a few seconds.
                </p>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">
                  When can you train?
                </h1>
                <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                  Select the days you can make it to the gym.
                </p>
                <div className="w-full max-w-sm flex gap-2 mb-6">
                  {DAYS.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                        formData.availableDays.includes(day)
                          ? 'bg-[var(--color-primary)] text-white shadow-sm'
                          : 'bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>

                {/* Template selection */}
                {formData.availableDays.length > 0 && (
                  <div className="w-full max-w-sm text-left">
                    {formData.experienceLevel === 'beginner' ? (
                      <BeginnerRecommendation
                        templates={templates}
                        recommendedId={recommendedTemplateId}
                        loading={templatesLoading}
                      />
                    ) : (
                      <TemplateSelection
                        templates={templates}
                        selectedId={formData.templateId}
                        recommendedId={recommendedTemplateId}
                        onSelect={(id) => setFormData(prev => ({ ...prev, templateId: id }))}
                        loading={templatesLoading}
                      />
                    )}
                  </div>
                )}

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
                    disabled={formData.availableDays.length === 0 || !formData.templateId}
                    loading={generating}
                    onClick={handleGenerate}
                  >
                    Generate Plan
                  </Button>
                  <Button variant="ghost" size="md" fullWidth onClick={goBack}>
                    Back
                  </Button>
                </div>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <MobileContainer>
      <div className="flex flex-col flex-1 px-6 pt-16 pb-8">
        <StepIndicator current={step} total={4} />
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

function BeginnerRecommendation({ templates, recommendedId, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const template = templates.find(t => t.id === recommendedId);
  if (!template) return null;

  return (
    <div className="px-4 py-3 rounded-xl bg-[var(--color-primary)]/8 border border-[var(--color-primary)]/15">
      <p className="text-sm text-[var(--color-text)] leading-relaxed">
        We recommend <strong>{template.name}</strong> training {template.daysPerWeek} days per
        week — perfect for building a foundation.
      </p>
    </div>
  );
}

function TemplateSelection({ templates, selectedId, recommendedId, onSelect, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (templates.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {templates.map(template => {
        const isRecommended = template.id === recommendedId;
        const isSelected = template.id === selectedId;
        return (
          <button
            key={template.id}
            onClick={() => onSelect(template.id)}
            className={`relative w-full text-left p-4 rounded-xl border transition-all duration-200 active:scale-[0.98] ${
              isSelected
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-sm shadow-[var(--color-primary)]/10'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/50'
            }`}
          >
            {isRecommended && (
              <div className="absolute -top-2.5 left-3 px-2 py-0.5 rounded-full bg-[var(--color-primary)] text-[10px] font-semibold text-white tracking-wider uppercase flex items-center gap-1">
                <Star className="w-2.5 h-2.5" fill="currentColor" />
                Recommended
              </div>
            )}
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-1">
              {template.name}
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] mb-2 leading-relaxed">
              {template.description}
            </p>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
                <Calendar className="w-3 h-3" />
                {template.daysPerWeek} days/week
              </span>
              <span className="text-xs text-[var(--color-text-secondary)] capitalize">
                {template.suitableFor?.join(', ')}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
