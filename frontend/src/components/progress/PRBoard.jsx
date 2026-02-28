import Card from '../ui/Card';
import Badge from '../ui/Badge';

export default function PRBoard({ exercises }) {
  if (!exercises?.length) return null;

  return (
    <Card padding="none">
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">Personal Records</h3>
      </div>
      <div className="divide-y divide-[var(--color-border)]">
        {exercises.map((ex) => (
          <div key={ex.name} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-[var(--color-text)]">{ex.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tabular-nums text-[var(--color-text)]">
                {ex.bestWeight} {ex.units}
              </span>
              {ex.isRecent && <Badge variant="success">PR</Badge>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
