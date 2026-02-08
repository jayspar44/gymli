import { useState, useRef } from 'react';
import { Send } from 'lucide-react';

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleInput(e) {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  }

  return (
    <div className="flex items-end gap-2 px-4 py-3 border-t border-[var(--color-border)] bg-[var(--color-bg)]" style={{ paddingBottom: 'calc(var(--safe-area-bottom) + 0.75rem)' }}>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Ask Gimli anything..."
        rows={1}
        disabled={disabled}
        className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--color-surface-alt)] text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] resize-none outline-none focus:ring-1 focus:ring-[var(--color-primary)] disabled:opacity-50"
        style={{ maxHeight: '120px' }}
      />
      <button
        onClick={handleSubmit}
        disabled={!text.trim() || disabled}
        className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-[#d4872a] to-[#b86b1f] text-[#fdf8f0] disabled:opacity-40 transition-all active:scale-95 flex-shrink-0"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
}
