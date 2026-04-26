import { useToast } from '@/hooks/use-toast';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export function Toaster() {
  const { toasts } = useToast();

  const getIcon = (variant?: 'default' | 'destructive' | null) => {
    if (variant === 'destructive') {
      return <AlertCircle className="h-5 w-5 text-destructive-foreground" />;
    }
    return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />;
  };

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-0.5">{getIcon(variant)}</div>
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
