import { useState, useEffect, useRef } from 'react';
import { Search, X, Dumbbell, ChevronDown } from 'lucide-react';
import { searchExercises } from '../../api/services';

const CATEGORIES = ['All', 'compound', 'isolation', 'cardio', 'olympic', 'power'];
const CATEGORY_LABELS = { All: 'All', compound: 'Compound', isolation: 'Isolation', cardio: 'Cardio', olympic: 'Olympic', power: 'Power' };

export default function ExercisePicker({ onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    loadExercises();
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadExercises();
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [query, category]);

  async function loadExercises() {
    setLoading(true);
    try {
      const params = {};
      if (query.trim()) params.q = query.trim();
      if (category !== 'All') params.category = category;
      const data = await searchExercises(params);
      setExercises(data.exercises || data || []);
    } catch {
      setExercises([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[var(--color-bg)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-[var(--color-border)] flex-shrink-0">
        <button onClick={onClose} className="text-[var(--color-text-secondary)]">
          <X className="w-5 h-5" />
        </button>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exercises..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--color-surface-alt)] text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] border-0 outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          />
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 px-4 py-2.5 overflow-x-auto flex-shrink-0 border-b border-[var(--color-border)]">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              category === cat
                ? 'bg-[var(--color-primary)] text-[#fdf8f0]'
                : 'bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]'
            }`}
          >
            {CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <Dumbbell className="w-8 h-8 text-[var(--color-text-secondary)] mb-2" strokeWidth={1.5} />
            <p className="text-sm text-[var(--color-text-secondary)]">No exercises found</p>
          </div>
        ) : (
          exercises.map(ex => (
            <button
              key={ex.id}
              onClick={() => onSelect(ex)}
              className="w-full flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)] text-left hover:bg-[var(--color-surface-alt)] active:bg-[var(--color-surface-alt)] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text)] truncate">{ex.name}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {ex.category}{ex.muscleGroups?.primary?.length ? ` · ${ex.muscleGroups.primary.join(', ')}` : ''}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-[var(--color-text-secondary)] -rotate-90 flex-shrink-0" />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
