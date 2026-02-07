import { BarChart3 } from 'lucide-react';

export default function Progress() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      <div className="flex items-center justify-center w-14 h-14 mb-4 rounded-2xl bg-[var(--color-surface-alt)]">
        <BarChart3 className="w-7 h-7 text-[var(--color-primary)]" strokeWidth={1.5} />
      </div>
      <h2 className="text-lg font-semibold text-[var(--color-text)] mb-1">Progress</h2>
      <p className="text-sm text-[var(--color-text-secondary)]">Track your gains over time</p>
    </div>
  );
}
