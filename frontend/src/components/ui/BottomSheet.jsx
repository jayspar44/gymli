import { Drawer } from 'vaul';
import { cn } from '../../utils/cn';

export default function BottomSheet({ open, onClose, children, className }) {
  return (
    <Drawer.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Drawer.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl bg-[var(--color-surface)]',
            'max-h-[85vh]',
            className
          )}
          style={{ paddingBottom: 'calc(var(--safe-area-bottom, 0px) + 1rem)' }}
        >
          <div className="mx-auto mt-3 mb-2 h-1 w-10 rounded-full bg-[var(--color-border)]" />
          <div className="flex-1 overflow-y-auto px-4">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
