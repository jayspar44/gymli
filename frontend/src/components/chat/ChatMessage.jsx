import ReactMarkdown from 'react-markdown';

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-[var(--color-primary)] text-white rounded-br-md'
            : 'bg-[var(--color-surface-alt)] text-[var(--color-text)] rounded-bl-md'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="chat-markdown">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
        {message.timestamp && (
          <p className={`text-[10px] mt-1 ${isUser ? 'text-white/60' : 'text-[var(--color-text-secondary)]'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
}
