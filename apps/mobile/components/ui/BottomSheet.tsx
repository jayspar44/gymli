/**
 * BottomSheet — cross-platform bottom sheet built on React Native's Modal.
 *
 * Works on both native (Android / iOS) and web.  No @gorhom/bottom-sheet.
 *
 * Public API
 * ----------
 *   Imperative ref:
 *     const ref = useRef<BottomSheetRef>(null);
 *     ref.current?.open();
 *     ref.current?.close();
 *
 *   Controlled props:
 *     <BottomSheet open={open} onClose={onClose}>...</BottomSheet>
 *
 *   Optional:
 *     snapPoints?: string[]   — largest % value is used as the panel's maxHeight
 *                               (defaults to ['85%'])
 *     children, className
 */
import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { Modal, View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';

export type BottomSheetRef = {
  open: () => void;
  close: () => void;
};

export type BottomSheetProps = {
  /** Controlled open state */
  open?: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
  className?: string;
  /**
   * Snap points.  The largest percentage entry is used as the panel maxHeight.
   * Defaults to ['85%'].
   */
  snapPoints?: (string | number)[];
};

export const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(function BottomSheet(
  { open: openProp, onClose, children, snapPoints = ['85%'] },
  ref
) {
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);

  // Derive maxHeight from the largest snap point
  const lastSnap = snapPoints[snapPoints.length - 1] ?? '85%';
  const maxHeightPct = typeof lastSnap === 'number' ? lastSnap : parseInt(String(lastSnap), 10);

  const doOpen = useCallback(() => setVisible(true), []);
  const doClose = useCallback(() => {
    setVisible(false);
    onClose?.();
  }, [onClose]);

  useImperativeHandle(ref, () => ({ open: doOpen, close: doClose }));

  // Sync with controlled `open` prop
  useEffect(() => {
    if (openProp === true) {
      setVisible(true);
    } else if (openProp === false) {
      setVisible(false);
    }
  }, [openProp]);

  const bg = colorScheme === 'dark' ? '#1c1917' : '#ffffff';
  // Bottom padding: gesture-nav inset + a little breathing room
  const bottomPad = (insets.bottom || 0) + 16;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={doClose}
      statusBarTranslucent
    >
      {/* Full-screen backdrop — tap anywhere outside the panel to close */}
      <Pressable style={styles.backdrop} onPress={doClose}>
        {/* Bottom-anchored panel — stopPropagation so taps inside don't close */}
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[
            styles.panel,
            {
              backgroundColor: bg,
              maxHeight: `${maxHeightPct}%` as unknown as number,
              paddingBottom: bottomPad,
            },
          ]}
        >
          {/* Grab-handle indicator */}
          <View style={styles.handle} />

          {/* Sheet content */}
          <View style={styles.content}>{children}</View>
        </Pressable>
      </Pressable>
    </Modal>
  );
});

export default BottomSheet;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  panel: {
    width: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    paddingTop: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#a1a1aa',
    marginTop: 4,
    marginBottom: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
});
