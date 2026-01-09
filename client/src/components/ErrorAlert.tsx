import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  showRetry?: boolean;
}

export function ErrorAlert({
  title = 'Error',
  message,
  onRetry,
  onDismiss,
  className = '',
  showRetry = true,
}: ErrorAlertProps) {
  return (
    <Alert variant="destructive" className={`relative ${className}`} data-testid="alert-error">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>{title}</span>
        {onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mr-2"
            onClick={onDismiss}
            data-testid="button-dismiss-error"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <p className="text-sm">{message}</p>
        {showRetry && onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="gap-2 bg-background hover:bg-background/80"
            data-testid="button-retry"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
