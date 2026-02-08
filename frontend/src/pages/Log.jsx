import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useUserProfile } from '../contexts/UserProfileContext';
import ManualLogForm from '../components/log/ManualLogForm';
import WorkoutHistoryList from '../components/log/WorkoutHistoryList';

export default function Log() {
  const { profile } = useUserProfile();
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  function handleSaved() {
    setShowForm(false);
    setRefreshKey(k => k + 1);
  }

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Workout Log</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#d4872a] to-[#b86b1f] text-[#fdf8f0] font-semibold text-xs transition-all active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
          Log Workout
        </button>
      </div>

      {/* History */}
      <WorkoutHistoryList refreshKey={refreshKey} />

      {/* Manual log form overlay */}
      {showForm && (
        <ManualLogForm
          units={profile?.units || 'lbs'}
          onSaved={handleSaved}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
