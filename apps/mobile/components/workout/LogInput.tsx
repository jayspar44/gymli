/**
 * LogInput — conversational text input bar.
 * Ports frontend/src/components/workout/LogInput.jsx.
 * TextInput (multiline, auto-grow capped at ~5 lines) + Send button.
 */
import { useRef, useState } from 'react';
import { View, TextInput, Pressable, type NativeSyntheticEvent, type TextInputContentSizeChangeEventData } from 'react-native';
import { Send } from 'lucide-react-native';

type Props = {
  onSend: (text: string) => void;
  disabled?: boolean;
};

const LINE_HEIGHT = 24;
const MAX_HEIGHT = 120;

export function LogInput({ onSend, disabled }: Props) {
  const [text, setText] = useState('');
  const [inputHeight, setInputHeight] = useState(LINE_HEIGHT * 2);

  function submit() {
    const t = text.trim();
    if (!t || disabled) return;
    onSend(t);
    setText('');
    setInputHeight(LINE_HEIGHT * 2);
  }

  function handleContentSizeChange(
    e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>
  ) {
    const h = Math.min(e.nativeEvent.contentSize.height, MAX_HEIGHT);
    setInputHeight(Math.max(h, LINE_HEIGHT * 2));
  }

  return (
    <View className="flex-row items-end gap-2 border-t border-zinc-200 dark:border-zinc-800 bg-bg dark:bg-bg-dark px-4 py-3">
      <TextInput
        value={text}
        onChangeText={setText}
        onContentSizeChange={handleContentSizeChange}
        multiline
        editable={!disabled}
        placeholder="Log a set or ask Gymli…"
        placeholderTextColor="#71717a"
        returnKeyType="send"
        onSubmitEditing={submit}
        blurOnSubmit={false}
        style={{ height: Math.max(inputHeight, 48) }}
        className="flex-1 resize-none rounded-xl bg-surface-alt dark:bg-surface-dark px-4 py-2.5 text-base text-zinc-900 dark:text-zinc-50 opacity-100 disabled:opacity-50"
      />
      <Pressable
        onPress={submit}
        disabled={!text.trim() || disabled}
        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary disabled:opacity-40"
      >
        <Send size={20} color="#fff" />
      </Pressable>
    </View>
  );
}

export default LogInput;
