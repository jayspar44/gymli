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
        className="fixed z-30 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[#d4872a] to-[#96501d] text-[#fdf8f0] shadow-lg shadow-[#d4872a]/25 transition-all duration-200 active:scale-90 hover:shadow-xl hover:shadow-[#d4872a]/30"
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
