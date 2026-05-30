import { useRef, useState } from 'react';
import { Send } from 'lucide-react';

export default function LogInput({ onSend, disabled }) {
  const ref = useRef(null);
  const [text, setText] = useState('');

  function submit() {
    const t = text.trim();
    if (!t || disabled) return;
    onSend(t);
    setText('');
    if (ref.current) ref.current.style.height = 'auto';
  }
  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  }
  function onInput(e) {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  }

  return (
    <div className="flex items-end gap-2 border-t border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3"
         style={{ paddingBottom: 'calc(var(--safe-area-bottom) + 0.75rem)' }}>
      <textarea ref={ref} value={text} onChange={onInput} onKeyDown={onKeyDown} rows={1} disabled={disabled}
        placeholder="Log a set or ask Gymli…"
        className="flex-1 resize-none rounded-xl bg-[var(--color-surface-alt)] px-4 py-2.5 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-secondary)] focus:ring-1 focus:ring-[var(--color-primary)] disabled:opacity-50"
        style={{ maxHeight: '120px' }} />
      <button onClick={submit} disabled={!text.trim() || disabled}
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white transition-all active:scale-95 disabled:opacity-40">
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}
