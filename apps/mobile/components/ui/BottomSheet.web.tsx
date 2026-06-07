/**
 * BottomSheet — web implementation using React Native's built-in Modal.
 *
 * Metro automatically resolves this file instead of BottomSheet.tsx on web.
 * tsc uses BottomSheet.tsx for type-checking (types are identical).
 *
 * The public API matches the native version exactly so callers are unchanged.
 */
import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { Modal, View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { cn } from '../../lib/cn';
import type { BottomSheetRef, BottomSheetProps } from './BottomSheet';

export type { BottomSheetRef, BottomSheetProps };

export const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(function BottomSheet(
  { open: openProp, onClose, children, className, snapPoints = ['50%', '85%'] },
  ref
) {
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);

  // Derive maxHeight from the last (largest) snap point
  const lastSnap = snapPoints[snapPoints.length - 1] ?? '85%';
  const maxHeightPct =
    typeof lastSnap === 'number'
      ? lastSnap
      : parseInt(String(lastSnap), 10);

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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={doClose}
      statusBarTranslucent
    >
      {/* Dark backdrop — tap to close */}
      <Pressable style={styles.backdrop} onPress={doClose} />

      {/* Sheet panel */}
      <View
        style={[
          styles.panel,
          {
            backgroundColor: bg,
            maxHeight: `${maxHeightPct}%` as any,
            paddingBottom: insets.bottom || 16,
          },
        ]}
      >
        {/* Drag handle indicator */}
        <View style={styles.handle} />
        <View className={cn('flex-1 px-4', className)}>{children}</View>
      </View>
    </Modal>
  );
});

export default BottomSheet;

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#a1a1aa',
    marginTop: 8,
    marginBottom: 4,
  },
});
