import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import ChatOverlay from './ChatOverlay';

export default function ChatFAB() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* FAB button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed z-30 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white shadow-lg shadow-[var(--color-primary)]/25 transition-all duration-200 active:scale-90 hover:shadow-xl hover:shadow-[var(--color-primary)]/30"
        style={{
          right: '1rem',
          bottom: 'calc(var(--safe-area-bottom) + 5rem)',
        }}
      >
        <MessageCircle className="w-5 h-5" />
      </button>

      {/* Chat overlay */}
      {open && <ChatOverlay onClose={() => setOpen(false)} />}
    </>
  );
}
