'use client';

import * as React from 'react';
import { ToastContainer } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';

const ToastContext = React.createContext<ReturnType<typeof useToast> | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toastMethods = useToast();

  return (
    <ToastContext.Provider value={toastMethods}>
      {children}
      <ToastContainer
        toasts={toastMethods.toasts}
        onDismiss={toastMethods.dismissToast}
      />
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
}