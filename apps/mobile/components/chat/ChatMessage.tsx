import { View, Text } from 'react-native';
import { Markdown } from './Markdown';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
};

export function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <View className={`flex-row mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <View
        className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl ${
          isUser
            ? 'bg-primary rounded-br-sm'
            : 'bg-surface-alt dark:bg-surface-dark rounded-bl-sm'
        }`}
      >
        {isUser ? (
          <Text className="text-base leading-relaxed text-white">{message.content}</Text>
        ) : (
          <Markdown className="text-base leading-relaxed text-zinc-900 dark:text-zinc-50">
            {message.content}
          </Markdown>
        )}
        {message.timestamp ? (
          <Text
            className={`text-xs mt-1 ${
              isUser ? 'text-white/60' : 'text-zinc-500'
            }`}
          >
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export default ChatMessage;
