import { CheckCircle2, XCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface CustomToastProps {
  message: string;
  type: ToastType;
  testId: string;
}

/**
 * Custom toast component with test ID support
 * Used by Sonner via toast.custom() to render toasts with data-testid attributes
 */
export function CustomToast({ message, type, testId }: CustomToastProps) {
  const icons = {
    success: CheckCircle2,
    error: XCircle,
    info: Info,
    warning: AlertTriangle,
  };

  const Icon = icons[type];

  const typeStyles = {
    success: 'border-green-600 bg-green-50 text-green-900',
    error: 'border-red-600 bg-red-50 text-red-900',
    info: 'border-blue-600 bg-blue-50 text-blue-900',
    warning: 'border-yellow-600 bg-yellow-50 text-yellow-900',
  };

  const iconStyles = {
    success: 'text-green-600',
    error: 'text-red-600',
    info: 'text-blue-600',
    warning: 'text-yellow-600',
  };

  return (
    <div
      data-testid={testId}
      className={cn(
        'flex items-start gap-3 p-4 rounded-md border-2 paper-shadow sketch-border',
        'min-w-[300px] max-w-[420px]',
        'rotate-[-0.5deg]',
        typeStyles[type]
      )}
    >
      <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', iconStyles[type])} />
      <p className="text-sm font-source-serif flex-1">{message}</p>
    </div>
  );
}
