import { View, Text } from 'react-native';
import { Card, CardHeader, Badge } from '../ui';

type PRExercise = {
  name: string;
  bestScore: number | null;
  bestDate?: string;
  kind?: string;
  units?: string;
  isRecent?: boolean;
};

function scoreLabel(ex: PRExercise): string {
  const score = ex.bestScore;
  if (score == null) return '—';
  const kind = ex.kind || 'weighted';
  if (kind === 'timed') return `${score}s`;
  if (kind === 'distance') return String(score);
  // weighted / bodyweight / assisted
  return ex.units ? `${score} ${ex.units}` : String(score);
}

export function PRBoard({ exercises }: { exercises: PRExercise[] }) {
  if (!exercises?.length) return null;

  return (
    <Card padding="none">
      <CardHeader className="px-4 pt-3 pb-3">
        <Text className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Personal Records
        </Text>
      </CardHeader>
      <View>
        {exercises.map((ex, idx) => (
          <View
            key={ex.name}
            className={`flex-row items-center justify-between px-4 py-3 ${
              idx < exercises.length - 1 ? 'border-b border-zinc-200 dark:border-zinc-700' : ''
            }`}
          >
            <Text className="text-sm text-zinc-900 dark:text-zinc-50 flex-1 mr-2" numberOfLines={1}>
              {ex.name}
            </Text>
            <View className="flex-row items-center gap-2">
              <Text className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {scoreLabel(ex)}
              </Text>
              {ex.isRecent && <Badge variant="success">PR</Badge>}
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

export default PRBoard;
