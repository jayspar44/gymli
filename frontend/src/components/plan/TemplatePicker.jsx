import { Calendar, Star, ChevronRight } from 'lucide-react';

export default function TemplatePicker({ templates, recommended, onSelect }) {
  return (
    <div className="flex flex-col gap-3">
      {templates.map((template) => {
        const isRecommended = template.id === recommended;
        return (
          <button
            key={template.id}
            onClick={() => onSelect(template.id)}
            className={`relative w-full text-left p-4 rounded-xl border transition-all duration-200 active:scale-[0.98] ${
              isRecommended
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/.05 shadow-sm shadow-[var(--color-primary)]/.1'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/.5'
            }`}
          >
            {isRecommended && (
              <div className="absolute -top-2.5 left-3 px-2 py-0.5 rounded-full bg-[var(--color-primary)] text-[10px] font-semibold text-white tracking-wider uppercase flex items-center gap-1">
                <Star className="w-2.5 h-2.5" fill="currentColor" />
                Recommended
              </div>
            )}

            <div className="flex items-start justify-between">
              <div className="flex-1 pr-2">
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
                    {template.suitableFor.join(', ')}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--color-text-secondary)] mt-1 flex-shrink-0" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
