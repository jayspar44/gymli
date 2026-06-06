import { useState, useEffect, useRef } from 'react';
import { Search, Dumbbell, ChevronRight } from 'lucide-react';
import { searchExercises } from '../../api/services';
import BottomSheet from '../ui/BottomSheet';
import Chip from '../ui/Chip';
import Skeleton from '../ui/Skeleton';

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
    // Small delay to allow the BottomSheet to animate open
    const t = setTimeout(() => inputRef.current?.focus(), 300);
    loadExercises();
    return () => clearTimeout(t);
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
    <BottomSheet open onClose={onClose} className="max-h-[90vh]">
      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises..."
          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-primary)] transition-colors"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 pb-3 overflow-x-auto scrollbar-none">
        {CATEGORIES.map(cat => (
          <Chip
            key={cat}
            selected={category === cat}
            onPress={() => setCategory(cat)}
          >
            {CATEGORY_LABELS[cat] || cat}
          </Chip>
        ))}
      </div>

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto -mx-4 px-4">
        {loading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} variant="text" className="h-12" />
            ))}
          </div>
        ) : exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Dumbbell className="w-8 h-8 text-[var(--color-text-secondary)] mb-2" strokeWidth={1.5} />
            <p className="text-sm text-[var(--color-text-secondary)]">No exercises found</p>
          </div>
        ) : (
          exercises.map(ex => (
            <button
              key={ex.id}
              onClick={() => onSelect(ex)}
              className="w-full flex items-center gap-3 px-1 py-3 border-b border-[var(--color-border)] text-left transition-colors active:bg-[var(--color-surface-alt)]"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text)] truncate">{ex.name}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {ex.category}{ex.muscleGroups?.primary?.length ? ` \u00b7 ${ex.muscleGroups.primary.join(', ')}` : ''}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--color-text-secondary)] flex-shrink-0" />
            </button>
          ))
        )}
      </div>
    </BottomSheet>
  );
}
