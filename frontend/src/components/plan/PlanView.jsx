import { useState } from 'react';
import { ChevronDown, Dumbbell } from 'lucide-react';

function DaySection({ day, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3 text-left bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)] transition-colors"
      >
        <div>
          <h4 className="text-sm font-semibold text-[var(--color-text)]">{day.name}</h4>
          <p className="text-xs text-[var(--color-text-secondary)]">{day.focus}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-secondary)]">
            {day.exercises.length} exercises
          </span>
          <ChevronDown
            className={`w-4 h-4 text-[var(--color-text-secondary)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {open && (
        <div className="px-4 py-2 border-t border-[var(--color-border)] bg-[var(--color-bg)]">
          {day.exercises.map((exercise, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2.5 border-b border-[var(--color-border)] last:border-0"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-6 h-6 rounded-md bg-[var(--color-surface-alt)]">
                  <Dumbbell className="w-3 h-3 text-[var(--color-primary)]" />
                </div>
                <span className="text-sm text-[var(--color-text)]">
                  {exercise.exerciseId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </span>
              </div>
              <span className="text-xs text-[var(--color-text-secondary)] font-mono">
                {exercise.sets} × {exercise.reps}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PlanView({ plan }) {
  if (!plan) return null;

  return (
    <div className="flex flex-col gap-3">
      {/* Weekly schedule */}
      {plan.weeklySchedule && (
        <div className="mb-2">
          <h3 className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
            Weekly Schedule
          </h3>
          <div className="flex gap-1.5">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
              const assignment = plan.weeklySchedule[day];
              const isRest = !assignment || assignment.toLowerCase() === 'rest';
              return (
                <div
                  key={day}
                  className={`flex-1 py-2 rounded-lg text-center ${
                    isRest
                      ? 'bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                      : 'bg-[var(--color-primary)]/.1 text-[var(--color-primary)] border border-[var(--color-primary)]/.2'
                  }`}
                >
                  <div className="text-[10px] font-medium">{day}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day sections */}
      {plan.days.map((day, i) => (
        <DaySection key={i} day={day} defaultOpen={i === 0} />
      ))}
    </div>
  );
}
