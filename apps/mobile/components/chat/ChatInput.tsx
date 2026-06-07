import { useState } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { Send } from 'lucide-react-native';

type Props = {
  onSend: (text: string) => void;
  disabled?: boolean;
};

export function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState('');

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  }

  return (
    <View className="flex-row items-end gap-2 px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-bg dark:bg-bg-dark">
      <TextInput
        value={text}
        onChangeText={setText}
        onSubmitEditing={handleSubmit}
        placeholder="Ask Gymli anything..."
        placeholderTextColor="#71717a"
        multiline
        editable={!disabled}
        className="flex-1 px-4 py-2.5 rounded-xl bg-surface-alt dark:bg-surface-dark text-sm text-zinc-900 dark:text-zinc-50"
        style={{ maxHeight: 120 }}
        returnKeyType="send"
        blurOnSubmit
      />
      <Pressable
        onPress={handleSubmit}
        disabled={!text.trim() || disabled}
        className="items-center justify-center w-10 h-10 rounded-xl bg-primary disabled:opacity-40 active:scale-95 flex-shrink-0"
        style={({ pressed }) => [{ opacity: (!text.trim() || disabled) ? 0.4 : pressed ? 0.8 : 1 }]}
      >
        <Send size={16} color="#fff" />
      </Pressable>
    </View>
  );
}

export default ChatInput;
