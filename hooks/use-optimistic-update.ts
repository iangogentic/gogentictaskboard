import { useCallback, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface OptimisticOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  undoLabel?: string;
  successMessage?: string;
}

export function useOptimisticUpdate<T = any>() {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const previousStateRef = useRef<T | null>(null);

  const execute = useCallback(async <R = any>(
    optimisticUpdate: () => T,
    serverUpdate: () => Promise<R>,
    options: OptimisticOptions<R> = {}
  ) => {
    const {
      onSuccess,
      onError,
      undoLabel = 'Undo',
      successMessage = 'Updated successfully'
    } = options;

    // Store previous state for undo
    previousStateRef.current = optimisticUpdate();
    setIsUpdating(true);

    try {
      const result = await serverUpdate();
      
      // Success toast with undo
      const { dismiss } = toast({
        title: successMessage,
        action: previousStateRef.current ? {
          label: undoLabel,
          onClick: async () => {
            // Implement undo logic here
            console.log('Undo action triggered');
            dismiss();
          }
        } : undefined,
      });

      onSuccess?.(result);
      return result;
    } catch (error) {
      // Revert optimistic update on error
      if (previousStateRef.current) {
        // Trigger revert logic
        console.error('Reverting optimistic update due to error:', error);
      }

      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });

      onError?.(error as Error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [toast]);

  return {
    execute,
    isUpdating,
  };
}