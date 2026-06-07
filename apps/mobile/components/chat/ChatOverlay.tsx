import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { X, Trash2 } from 'lucide-react-native';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { BottomSheet, type BottomSheetRef } from '../ui/BottomSheet';
import { api } from '../../lib/api';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

const QUICK_PROMPTS = [
  "How's my progress?",
  'What should I focus on?',
  'Review my last workout',
];

export function ChatOverlay({ open, onClose }: Props) {
  const sheetRef = useRef<BottomSheetRef>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Load history when opened
  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  async function loadHistory() {
    setLoading(true);
    try {
      const data = await api.getChatHistory(50);
      setMessages((data as any).messages ?? []);
    } catch {
      // Start fresh on error
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(text: string) {
    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      const result = (await api.sendChat(text, { screen: 'chat' })) as any;
      const assistantMsg: Message = {
        id: `resp-${Date.now()}`,
        role: 'assistant',
        content: result.message,
        timestamp: result.timestamp,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Something went wrong. Try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  }

  const handleClear = useCallback(async () => {
    try {
      await api.clearChatHistory();
      setMessages([]);
    } catch {
      // ignore
    }
  }, []);

  return (
    <BottomSheet ref={sheetRef} open={open} onClose={onClose} snapPoints={['92%']}>
      {/* Header */}
      <View className="flex-row items-center justify-between h-14 border-b border-zinc-200 dark:border-zinc-800">
        <Pressable onPress={onClose} className="p-1">
          <X size={20} color="#71717a" />
        </Pressable>
        <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Coach</Text>
        <Pressable onPress={handleClear} className="p-1 opacity-50">
          <Trash2 size={16} color="#71717a" />
        </Pressable>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        className="flex-1 py-4"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <View className="flex-1 items-center justify-center py-12">
            <ActivityIndicator color="#d4872a" />
          </View>
        ) : messages.length === 0 ? (
          <View className="flex-1 items-center justify-center py-16">
            <Text className="text-sm text-zinc-900 dark:text-zinc-50 font-medium mb-1 text-center">
              Ask about your training, progress, or plan.
            </Text>
            {/* Quick prompts */}
            <View className="flex-row flex-wrap justify-center gap-2 mt-6 max-w-xs">
              {QUICK_PROMPTS.map((prompt, i) => (
                <Pressable
                  key={i}
                  onPress={() => handleSend(prompt)}
                  className="px-3 py-1.5 rounded-full bg-surface-alt dark:bg-surface-dark border border-zinc-200 dark:border-zinc-700"
                >
                  <Text className="text-xs text-zinc-500">{prompt}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
        )}

        {/* Typing indicator */}
        {sending ? (
          <View className="flex-row items-start gap-2 mb-3">
            <View className="px-3.5 py-3 rounded-2xl rounded-bl-sm bg-surface-alt dark:bg-surface-dark">
              <View className="flex-row gap-1">
                <View className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                <View className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                <View className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={sending} />
    </BottomSheet>
  );
}

export default ChatOverlay;
