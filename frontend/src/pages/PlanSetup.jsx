import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, ArrowLeft, Sparkles } from 'lucide-react';
import { getTemplates, generatePlan as generatePlanApi } from '../api/services';
import TemplatePicker from '../components/plan/TemplatePicker';
import PlanView from '../components/plan/PlanView';

const FORGE_QUOTES = [
  'Heating the forge...',
  'Hammering your plan into shape...',
  'Tempering the iron...',
  'Sharpening the blade...',
  'Forging your battle plan...',
];

export default function PlanSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState('pick'); // 'pick' | 'generating' | 'review'
  const [templates, setTemplates] = useState([]);
  const [recommended, setRecommended] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    getTemplates()
      .then(data => {
        setTemplates(data.templates);
        setRecommended(data.recommended);
      })
      .catch(() => setError('Failed to load templates'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (step !== 'generating') return;
    const interval = setInterval(() => {
      setQuoteIndex(i => (i + 1) % FORGE_QUOTES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [step]);

  async function handleSelectTemplate(templateId) {
    setStep('generating');
    setError(null);
    try {
      const result = await generatePlanApi(templateId);
      setPlan(result);
      setStep('review');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate plan');
      setStep('pick');
    }
  }

  function handleActivate() {
    navigate('/');
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
      {step === 'pick' && (
        <>
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-[var(--color-primary)]" strokeWidth={1.5} />
              <h2
                className="text-lg tracking-wider font-semibold text-[var(--color-text)]"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Choose Your Battle Plan
              </h2>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Pick a template and Gymli will forge it to fit your goals.
            </p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/.1 border border-red-500/.2 text-red-400 text-sm">
              {error}
            </div>
          )}

          <TemplatePicker
            templates={templates}
            recommended={recommended}
            onSelect={handleSelectTemplate}
          />
        </>
      )}

      {step === 'generating' && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative mb-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#d4872a] to-[#96501d]">
              <Sparkles className="w-8 h-8 text-[#fdf8f0] animate-pulse" strokeWidth={1.5} />
            </div>
            <div
              className="absolute -inset-3 rounded-3xl animate-pulse"
              style={{ background: 'radial-gradient(circle, rgba(212,135,42,0.15) 0%, transparent 70%)' }}
            />
          </div>
          <p className="text-sm text-[var(--color-text)] font-medium mb-1">
            {FORGE_QUOTES[quoteIndex]}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Gymli is customizing your plan
          </p>
        </div>
      )}

      {step === 'review' && plan && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => { setStep('pick'); setPlan(null); }}
              className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>

          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-1">
            {plan.templateName}
          </h2>

          {/* Gymli message */}
          {plan.gymliMessage && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-[var(--color-primary)]/.08 border border-[var(--color-primary)]/.15">
              <p className="text-sm text-[var(--color-text)] italic leading-relaxed">
                &ldquo;{plan.gymliMessage}&rdquo;
              </p>
              <p className="text-xs text-[var(--color-primary)] mt-1 font-medium">— Gymli</p>
            </div>
          )}

          <PlanView plan={plan} />

          <button
            onClick={handleActivate}
            className="flex items-center justify-center gap-2 w-full py-3.5 mt-6 rounded-xl bg-gradient-to-r from-[#d4872a] to-[#b86b1f] text-[#fdf8f0] font-semibold text-sm transition-all duration-200 hover:shadow-lg hover:shadow-[#d4872a25] active:scale-[0.98]"
          >
            <Flame className="w-4 h-4" strokeWidth={1.5} />
            Activate Plan
          </button>
        </>
      )}
    </div>
  );
}
