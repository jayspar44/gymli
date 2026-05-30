export default function LogFeed({ entries, onClarify }) {
  return (
    <div className="flex flex-col gap-2 overflow-y-auto px-1 py-2">
      {entries.map((e, i) => (
        <div key={i} className={e.from === 'user' ? 'self-end' : 'self-start'}>
          <div className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${
            e.from === 'user' ? 'bg-[var(--color-surface-alt)] text-[var(--color-text)]'
                              : 'bg-[var(--color-primary)]/10 text-[var(--color-text)]'}`}>
            {e.text}
          </div>
          {e.clarification?.options?.length ? (
            <div className="mt-1 flex flex-wrap gap-2">
              {e.clarification.options.map(opt => (
                <button key={opt.exerciseId} onClick={() => onClarify(opt)}
                  className="rounded-lg border border-[var(--color-primary)] px-3 py-1 text-xs text-[var(--color-primary)]">
                  {opt.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
