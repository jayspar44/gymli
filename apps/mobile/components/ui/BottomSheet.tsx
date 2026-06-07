/**
 * BottomSheet — wraps @gorhom/bottom-sheet BottomSheetModal (native).
 *
 * On web, Metro resolves this to BottomSheet.web.tsx automatically.
 * tsc uses this file for type-checking both platforms (types are identical).
 *
 * Public API:
 *   Imperative ref:
 *     const ref = useRef<BottomSheetRef>(null);
 *     ref.current?.open();
 *     ref.current?.close();
 *   Controlled props:
 *     <BottomSheet open={open} onClose={onClose}>...</BottomSheet>
 *
 * NOTE: BottomSheetModalProvider must wrap the app root (see app/_layout.tsx).
 */
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useColorScheme } from 'nativewind';
import { cn } from '../../lib/cn';

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
   * Snap points (native). On web the last entry is used as maxHeight.
   * Defaults to ['50%', '85%'].
   */
  snapPoints?: (string | number)[];
};

const renderBackdrop = (props: BottomSheetBackdropProps) => (
  <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
);

export const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(function BottomSheet(
  { open, onClose, children, className, snapPoints = ['50%', '85%'] },
  ref
) {
  const { colorScheme } = useColorScheme();
  const modalRef = useRef<BottomSheetModal>(null);

  useImperativeHandle(ref, () => ({
    open: () => modalRef.current?.present(),
    close: () => modalRef.current?.dismiss(),
  }));

  // Sync with controlled `open` prop
  useEffect(() => {
    if (open) {
      modalRef.current?.present();
    } else {
      modalRef.current?.dismiss();
    }
  }, [open]);

  const handleDismiss = useCallback(() => {
    onClose?.();
  }, [onClose]);

  return (
    <BottomSheetModal
      ref={modalRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onDismiss={handleDismiss}
      handleIndicatorStyle={{ backgroundColor: '#a1a1aa', width: 40 }}
      backgroundStyle={{ backgroundColor: colorScheme === 'dark' ? '#1c1917' : '#ffffff' }}
    >
      <BottomSheetView className={cn('flex-1 px-4 pb-8', className)}>
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
});

export default BottomSheet;
