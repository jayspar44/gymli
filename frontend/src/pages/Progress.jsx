import GymliInsights from '../components/progress/GymliInsights';
import StreakCalendar from '../components/progress/StreakCalendar';
import ExerciseChart from '../components/progress/ExerciseChart';
import VolumeChart from '../components/progress/VolumeChart';

export default function Progress() {
  return (
    <div className="px-4 py-6 space-y-4">
      <h2 className="text-lg font-semibold text-[var(--color-text)]">Progress</h2>

      <GymliInsights />
      <StreakCalendar />
      <ExerciseChart />
      <VolumeChart />
    </div>
  );
}
