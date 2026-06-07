/**
 * BottomSheet — wraps @gorhom/bottom-sheet BottomSheetModal.
 *
 * Usage (imperative ref API matching the web vaul source):
 *   const ref = useRef<BottomSheetRef>(null);
 *   ref.current?.open();
 *   ref.current?.close();
 *
 * OR the open/onClose prop API (matches source):
 *   <BottomSheet open={open} onClose={onClose}>...</BottomSheet>
 *
 * NOTE: BottomSheetModalProvider must wrap the app root (see app/_layout.tsx).
 */
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { View } from 'react-native';
import GorhomBottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { cn } from '../../lib/cn';

export type BottomSheetRef = {
  open: () => void;
  close: () => void;
};

type Props = {
  /** Controlled open state (matches web source prop API) */
  open?: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
  className?: string;
  /** Snap points; defaults to ['50%', '85%'] */
  snapPoints?: (string | number)[];
};

const renderBackdrop = (props: BottomSheetBackdropProps) => (
  <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
);

export const BottomSheet = forwardRef<BottomSheetRef, Props>(function BottomSheet(
  { open, onClose, children, className, snapPoints = ['50%', '85%'] },
  ref
) {
  const sheetRef = useRef<GorhomBottomSheet>(null);

  useImperativeHandle(ref, () => ({
    open: () => sheetRef.current?.snapToIndex(0),
    close: () => sheetRef.current?.close(),
  }));

  // Sync with controlled `open` prop
  useEffect(() => {
    if (open) {
      sheetRef.current?.snapToIndex(0);
    } else {
      sheetRef.current?.close();
    }
  }, [open]);

  const handleChange = useCallback(
    (index: number) => {
      if (index === -1 && onClose) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <GorhomBottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onChange={handleChange}
      handleIndicatorStyle={{ backgroundColor: '#d1d5db', width: 40 }}
      backgroundStyle={{ backgroundColor: 'white' }}
    >
      <BottomSheetView className={cn('flex-1 px-4 pb-8', className)}>
        {children}
      </BottomSheetView>
    </GorhomBottomSheet>
  );
});

export default BottomSheet;
