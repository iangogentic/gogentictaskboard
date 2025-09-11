'use client';

import * as React from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastProps {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'destructive' | 'info';
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
}

const variantStyles = {
  default: 'bg-white border-gray-200',
  success: 'bg-green-50 border-green-200',
  destructive: 'bg-red-50 border-red-200',
  info: 'bg-blue-50 border-blue-200',
};

const variantIcons = {
  default: null,
  success: <CheckCircle className="w-5 h-5 text-green-600" />,
  destructive: <AlertCircle className="w-5 h-5 text-red-600" />,
  info: <Info className="w-5 h-5 text-blue-600" />,
};

export function Toast({
  title,
  description,
  variant = 'default',
  action,
  onDismiss,
}: ToastProps) {
  React.useEffect(() => {
    if (!action) {
      const timer = setTimeout(() => {
        onDismiss?.();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [action, onDismiss]);

  return (
    <div
      className={cn(
        'pointer-events-auto w-full max-w-sm rounded-lg border p-4',
        'shadow-lg transition-all duration-200',
        'animate-in slide-in-from-bottom-5',
        variantStyles[variant]
      )}
    >
      <div className="flex items-start gap-3">
        {variantIcons[variant]}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{title}</p>
          {description && (
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              {action.label}
            </button>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastProps[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onDismiss={() => onDismiss(toast.id)}
        />
      ))}
    </div>
  );
}