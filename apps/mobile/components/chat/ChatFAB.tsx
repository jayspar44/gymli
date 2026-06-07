import { useState } from 'react';
import { Pressable } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { ChatOverlay } from './ChatOverlay';

export function ChatFAB() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating action button */}
      <Pressable
        onPress={() => setOpen(true)}
        className="absolute z-30 items-center justify-center w-12 h-12 rounded-full bg-primary shadow-lg active:scale-90"
        style={{
          right: 16,
          bottom: 88, // above tab bar (~56px) with extra clearance
        }}
      >
        <MessageCircle size={20} color="#fff" />
      </Pressable>

      {/* Chat overlay (BottomSheetModal) */}
      <ChatOverlay open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export default ChatFAB;
