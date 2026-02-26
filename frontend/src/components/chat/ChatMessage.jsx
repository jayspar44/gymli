import ReactMarkdown from 'react-markdown';

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-[#d4872a] to-[#96501d] flex items-center justify-center mr-2 mt-0.5">
          <span className="text-[10px] font-bold text-[#fdf8f0]">G</span>
        </div>
      )}
      <div
        className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-[var(--color-primary)] text-[#fdf8f0] rounded-br-md'
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
          <p className={`text-[10px] mt-1 ${isUser ? 'text-[#fdf8f0]/60' : 'text-[var(--color-text-secondary)]'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
}
