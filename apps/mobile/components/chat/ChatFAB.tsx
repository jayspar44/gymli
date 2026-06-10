import { useState } from 'react';
import { Pressable } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatOverlay } from './ChatOverlay';

export function ChatFAB() {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <>
      {/* Floating action button */}
      <Pressable
        onPress={() => setOpen(true)}
        className="absolute z-30 items-center justify-center bg-primary shadow-lg active:scale-90"
        style={{
          right: 16,
          bottom: insets.bottom + 72, // above tab bar with safe-area inset
          width: 56,
          height: 56,
          borderRadius: 28, // explicit so it stays a circle (NativeWind w/h not reliable here)
        }}
      >
        <MessageCircle size={24} color="#fff" />
      </Pressable>

      {/* Chat overlay (BottomSheetModal) */}
      <ChatOverlay open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export default ChatFAB;
