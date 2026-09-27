import { useCallback, useRef, useState, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { minDuration } from '@/lib/minDuration';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export type AdminConfirmOptions = {
  title: string;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  action?: () => Promise<unknown>;
};

export function useAdminConfirm() {
  const [options, setOptions] = useState<AdminConfirmOptions | null>(null);
  const [pending, setPending] = useState(false);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: AdminConfirmOptions) => {
    resolver.current?.(false);
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = (value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOptions(null);
  };

  const handleConfirm = async () => {
    if (!options?.action) {
      settle(true);
      return;
    }
    setPending(true);
    let ok = true;
    try {
      await minDuration(options.action());
    } catch (error) {
      console.error(error);
      ok = false;
    } finally {
      setPending(false);
    }
    settle(ok);
  };

  const confirmDialog = (
    <AlertDialog
      open={options !== null}
      onOpenChange={(open) => !open && !pending && settle(false)}
    >
      <AlertDialogContent variant={options?.destructive ? 'danger' : 'primary'}>
        <AlertDialogHeader>
          <AlertDialogTitle>{options?.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {options?.description ?? 'This action cannot be undone.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>
            {options?.cancelText ?? 'Cancel'}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={options?.destructive ? 'destructive' : 'default'}
            disabled={pending}
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
          >
            {pending && <Loader2 className="animate-spin" />}
            {options?.confirmText ?? 'Confirm'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { confirm, confirmDialog };
}
