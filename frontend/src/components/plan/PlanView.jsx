import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown, Dumbbell, Pencil, Trash2, Plus, ArrowUp,
  ArrowDown, Check, X, RefreshCw
} from 'lucide-react';
import ExercisePicker from '../log/ExercisePicker';

function EditableExercise({ exercise, index, total, onUpdate, onRemove, onMove }) {
  const [editing, setEditing] = useState(false);
  const [sets, setSets] = useState(String(exercise.sets));
  const [reps, setReps] = useState(String(exercise.reps));

  function handleSave() {
    const parsedSets = parseInt(sets, 10);
    const parsedReps = parseInt(reps, 10);
    if (parsedSets > 0 && parsedReps > 0) {
      onUpdate({ ...exercise, sets: parsedSets, reps: parsedReps });
      setEditing(false);
    }
  }

  function handleCancel() {
    setSets(String(exercise.sets));
    setReps(String(exercise.reps));
    setEditing(false);
  }

  const displayName = exercise.name ||
    exercise.exerciseId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  if (editing) {
    return (
      <div className="py-2.5 border-b border-[var(--color-border)] last:border-0">
        <div className="flex items-center gap-2 mb-2">
          <Dumbbell className="w-3 h-3 text-[var(--color-primary)] flex-shrink-0" />
          <span className="text-sm text-[var(--color-text)] flex-1 truncate">{displayName}</span>
        </div>
        <div className="flex items-center gap-2 pl-5">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-[var(--color-text-secondary)]">Sets</label>
            <input
              type="number"
              min="1"
              max="20"
              value={sets}
              onChange={e => setSets(e.target.value)}
              className="w-14 px-2 py-1 rounded-md bg-[var(--color-surface-alt)] text-sm text-center text-[var(--color-text)] border border-[var(--color-border)] outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>
          <span className="text-[var(--color-text-secondary)]">&times;</span>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-[var(--color-text-secondary)]">Reps</label>
            <input
              type="number"
              min="1"
              max="100"
              value={reps}
              onChange={e => setReps(e.target.value)}
              className="w-14 px-2 py-1 rounded-md bg-[var(--color-surface-alt)] text-sm text-center text-[var(--color-text)] border border-[var(--color-border)] outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div className="flex-1" />
          <button onClick={handleSave} className="p-1.5 rounded-md text-emerald-500 hover:bg-emerald-500/10">
            <Check className="w-4 h-4" />
          </button>
          <button onClick={handleCancel} className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 py-2.5 border-b border-[var(--color-border)] last:border-0 group">
      <div className="flex flex-col gap-0.5 mr-1">
        <button
          onClick={() => onMove(-1)}
          disabled={index === 0}
          className="p-0.5 rounded text-[var(--color-text-secondary)] hover:text-[var(--color-text)] disabled:opacity-20 disabled:cursor-default"
        >
          <ArrowUp className="w-3 h-3" />
        </button>
        <button
          onClick={() => onMove(1)}
          disabled={index === total - 1}
          className="p-0.5 rounded text-[var(--color-text-secondary)] hover:text-[var(--color-text)] disabled:opacity-20 disabled:cursor-default"
        >
          <ArrowDown className="w-3 h-3" />
        </button>
      </div>

      <div className="flex items-center justify-center w-6 h-6 rounded-md bg-[var(--color-surface-alt)]">
        <Dumbbell className="w-3 h-3 text-[var(--color-primary)]" />
      </div>
      <span className="text-sm text-[var(--color-text)] flex-1 truncate">{displayName}</span>
      <span className="text-xs text-[var(--color-text-secondary)] font-mono">
        {exercise.sets} &times; {exercise.reps}
      </span>
      <button
        onClick={() => setEditing(true)}
        className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/.1"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={onRemove}
        className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-red-400 hover:bg-red-400/10"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function ReadOnlyExercise({ exercise }) {
  const displayName = exercise.name ||
    exercise.exerciseId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[var(--color-border)] last:border-0">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-[var(--color-surface-alt)]">
          <Dumbbell className="w-3 h-3 text-[var(--color-primary)]" />
        </div>
        <span className="text-sm text-[var(--color-text)]">{displayName}</span>
      </div>
      <span className="text-xs text-[var(--color-text-secondary)] font-mono">
        {exercise.sets} &times; {exercise.reps}
      </span>
    </div>
  );
}

function DaySection({ day, dayIndex, defaultOpen = false, editable = false, onDayUpdate }) {
  const [open, setOpen] = useState(defaultOpen);
  const [showPicker, setShowPicker] = useState(false);

  function handleExerciseUpdate(exerciseIndex, updatedExercise) {
    const newExercises = [...day.exercises];
    newExercises[exerciseIndex] = updatedExercise;
    onDayUpdate?.(dayIndex, { ...day, exercises: newExercises });
  }

  function handleExerciseRemove(exerciseIndex) {
    const newExercises = day.exercises.filter((_, i) => i !== exerciseIndex);
    onDayUpdate?.(dayIndex, { ...day, exercises: newExercises });
  }

  function handleExerciseMove(exerciseIndex, direction) {
    const newIndex = exerciseIndex + direction;
    if (newIndex < 0 || newIndex >= day.exercises.length) return;
    const newExercises = [...day.exercises];
    [newExercises[exerciseIndex], newExercises[newIndex]] = [newExercises[newIndex], newExercises[exerciseIndex]];
    onDayUpdate?.(dayIndex, { ...day, exercises: newExercises });
  }

  function handleAddExercise(exercise) {
    const newExercise = {
      exerciseId: exercise.id,
      name: exercise.name,
      sets: 3,
      reps: 10,
    };
    onDayUpdate?.(dayIndex, { ...day, exercises: [...day.exercises, newExercise] });
    setShowPicker(false);
  }

  return (
    <>
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
            {day.exercises.map((exercise, i) =>
              editable ? (
                <EditableExercise
                  key={`${exercise.exerciseId}-${i}`}
                  exercise={exercise}
                  index={i}
                  total={day.exercises.length}
                  onUpdate={(updated) => handleExerciseUpdate(i, updated)}
                  onRemove={() => handleExerciseRemove(i)}
                  onMove={(dir) => handleExerciseMove(i, dir)}
                />
              ) : (
                <ReadOnlyExercise key={i} exercise={exercise} />
              )
            )}

            {editable && (
              <button
                onClick={() => setShowPicker(true)}
                className="flex items-center justify-center gap-1.5 w-full py-2.5 mt-1 rounded-lg border border-dashed border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Exercise
              </button>
            )}
          </div>
        )}
      </div>

      {showPicker && (
        <ExercisePicker
          onSelect={handleAddExercise}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}

export default function PlanView({ plan, editable = false, onPlanChange, onSave, saving = false }) {
  const navigate = useNavigate();

  function handleDayUpdate(dayIndex, updatedDay) {
    const newDays = [...plan.days];
    newDays[dayIndex] = updatedDay;
    onPlanChange?.({ ...plan, days: newDays });
  }

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
        <DaySection
          key={i}
          day={day}
          dayIndex={i}
          defaultOpen={i === 0}
          editable={editable}
          onDayUpdate={handleDayUpdate}
        />
      ))}

      {/* Edit mode actions */}
      {editable && (
        <div className="flex flex-col gap-2 mt-2">
          {onSave && (
            <button
              onClick={onSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Save Changes
            </button>
          )}
          <button
            onClick={() => navigate('/plan-setup')}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Change Plan
          </button>
        </div>
      )}
    </div>
  );
}
