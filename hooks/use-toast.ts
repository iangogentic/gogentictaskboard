'use client';

import { useState, useCallback } from 'react';
import { ToastProps } from '@/components/ui/toast';

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast = useCallback((props: Omit<ToastProps, 'id' | 'onDismiss'>) => {
    const id = `toast-${++toastId}`;
    const newToast: ToastProps = {
      ...props,
      id,
    };

    setToasts((prev) => [...prev, newToast]);

    const dismiss = () => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return { id, dismiss };
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    toast,
    toasts,
    dismissToast,
  };
}