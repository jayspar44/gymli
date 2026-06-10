/**
 * LogFeed — renders the conversational log entries (user + Gymli bubbles).
 * Ports frontend/src/components/workout/LogFeed.jsx.
 * Includes clarification option buttons when env.needsClarification is true.
 */
import { useRef, useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';

type ClarificationOption = {
  exerciseId: string;
  label: string;
};

type FeedEntry = {
  from: 'user' | 'gymli';
  text: string;
  clarification?: {
    options?: ClarificationOption[];
  } | null;
};

type Props = {
  entries: FeedEntry[];
  onClarify: (option: ClarificationOption) => void;
};

export function LogFeed({ entries, onClarify }: Props) {
  const scrollRef = useRef<ScrollView>(null);

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (entries.length > 0) {
      const id = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
      return () => clearTimeout(id);
    }
  }, [entries.length]);

  if (!entries.length) {
    return (
      <View className="px-4 py-3">
        <Text className="text-sm leading-relaxed text-zinc-500 text-center">
          {'Type a set or ask Gymli below — e.g. '}
          <Text className="text-zinc-900 dark:text-zinc-50">"bench 225 5,5,4"</Text>
          {', '}
          <Text className="text-zinc-900 dark:text-zinc-50">"add plank"</Text>
          {', or '}
          <Text className="text-zinc-900 dark:text-zinc-50">"what's next?"</Text>
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      // grow-0: size to content up to the parent's maxHeight cap. flex-1 here
      // collapses to 0 height on native (Yoga: flexBasis 0 in an auto-height parent).
      className="grow-0 px-1 py-2"
      showsVerticalScrollIndicator={false}
    >
      <View className="gap-2">
        {entries.map((entry, i) => (
          <View
            key={i}
            className={entry.from === 'user' ? 'items-end' : 'items-start'}
          >
            <View
              className={`max-w-[90%] rounded-xl px-3 py-2 ${
                entry.from === 'user'
                  ? 'bg-surface-alt dark:bg-surface-dark'
                  : 'bg-amber-50 dark:bg-amber-900/20'
              }`}
            >
              <Text className="text-base text-zinc-900 dark:text-zinc-50">{entry.text}</Text>
            </View>
            {entry.clarification?.options?.length ? (
              <View className="mt-1 flex-row flex-wrap gap-2">
                {entry.clarification.options.map((opt) => (
                  <Pressable
                    key={opt.exerciseId}
                    onPress={() => onClarify(opt)}
                    className="rounded-lg border border-primary px-4 min-h-10 items-center justify-center"
                  >
                    <Text className="text-sm text-primary">{opt.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export default LogFeed;
