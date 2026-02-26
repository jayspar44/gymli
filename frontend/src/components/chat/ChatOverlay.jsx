import { useState, useEffect, useRef } from 'react';
import { X, Trash2 } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { sendChat, getChatHistory, clearChatHistory } from '../../api/services';

export default function ChatOverlay({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function loadHistory() {
    try {
      const data = await getChatHistory(50);
      setMessages(data.messages || []);
    } catch {
      // Start fresh
    } finally {
      setLoading(false);
    }
  }

  function scrollToBottom() {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }

  async function handleSend(text) {
    const userMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setSending(true);

    try {
      const result = await sendChat(text, { screen: 'chat' });
      const assistantMsg = {
        id: `resp-${Date.now()}`,
        role: 'assistant',
        content: result.message,
        timestamp: result.timestamp,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      const errorMsg = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'The forge fires flicker... Something went wrong. Try again, warrior.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  }

  async function handleClear() {
    try {
      await clearChatHistory();
      setMessages([]);
    } catch {
      // ignore
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[var(--color-bg)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-[var(--color-border)] flex-shrink-0">
        <button onClick={onClose} className="text-[var(--color-text-secondary)]">
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#d4872a] to-[#96501d] flex items-center justify-center">
            <span className="text-[8px] font-bold text-[#fdf8f0]">G</span>
          </div>
          <h3
            className="text-sm tracking-wider font-bold text-[var(--color-text)]"
          >
            Gymli
          </h3>
        </div>
        <button
          onClick={handleClear}
          className="text-[var(--color-text-secondary)] hover:text-[var(--color-danger)]"
        >
          <Trash2 className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#d4872a] to-[#96501d] flex items-center justify-center mb-4">
              <span className="text-xl font-bold text-[#fdf8f0]">G</span>
            </div>
            <p className="text-sm text-[var(--color-text)] font-medium mb-1">Chat with Gymli</p>
            <p className="text-xs text-[var(--color-text-secondary)] max-w-xs">
              Ask about exercises, form tips, plan adjustments, or just chat about your training journey.
            </p>
            {/* Quick prompts */}
            <div className="flex flex-wrap justify-center gap-2 mt-6 max-w-xs">
              {[
                'What should I focus on today?',
                'Tips for bench press form',
                'Am I overtraining?',
              ].map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="px-3 py-1.5 rounded-full text-xs bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <ChatMessage key={msg.id} message={msg} />
          ))
        )}

        {/* Typing indicator */}
        {sending && (
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#d4872a] to-[#96501d] flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-[#fdf8f0]">G</span>
            </div>
            <div className="px-3.5 py-3 rounded-2xl rounded-bl-md bg-[var(--color-surface-alt)]">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-secondary)] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-secondary)] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-secondary)] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={sending} />
    </div>
  );
}
