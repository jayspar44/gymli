import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, ArrowLeft } from 'lucide-react';
import { getTemplates, generatePlan as generatePlanApi } from '../api/services';
import TemplatePicker from '../components/plan/TemplatePicker';
import PlanView from '../components/plan/PlanView';

export default function PlanSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState('pick'); // 'pick' | 'generating' | 'review'
  const [templates, setTemplates] = useState([]);
  const [recommended, setRecommended] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
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
                className="text-lg tracking-wider font-bold text-[var(--color-text)]"
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
          <div className="w-8 h-8 mb-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--color-text)] font-medium">
            Generating your plan...
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
            className="flex items-center justify-center gap-2 w-full py-3.5 mt-6 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white font-semibold text-sm transition-all duration-200 hover:shadow-lg hover:shadow-[var(--color-primary)]/25 active:scale-[0.98]"
          >
            <Flame className="w-4 h-4" strokeWidth={1.5} />
            Activate Plan
          </button>
        </>
      )}
    </div>
  );
}
