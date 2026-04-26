import { useCallback, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  ExpressGeneratorProvider,
  useExpressGenerator,
} from '@/components/express-generator/ExpressGeneratorContext';
import ExpressGeneratorLayout from '@/components/express-generator/ExpressGeneratorLayout';
import SuccessView from '@/components/SuccessView';
import { useToast } from '@/hooks/use-toast';
import { WizardConfig } from '@/components/wizard-steps/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

type AppState = 'generator' | 'generating' | 'success';

interface GenerationError {
  title: string;
  message: string;
  kind: 'network' | 'client' | 'server' | 'timeout' | 'unknown';
  detail?: string;
}

// Map a thrown error / response into a user-facing GenerationError.
function classifyError(error: unknown): GenerationError {
  // Fetch network failure (offline, CORS, DNS)
  if (error instanceof TypeError && /fetch|network/i.test(error.message)) {
    return {
      kind: 'network',
      title: 'Network error',
      message: "We couldn't reach the server. Check your internet connection and try again.",
      detail: error.message,
    };
  }

  // AbortError from an abort() call — treat as timeout
  if (error instanceof Error && error.name === 'AbortError') {
    return {
      kind: 'timeout',
      title: 'Request timed out',
      message: 'Project generation took too long. Try again, or simplify your configuration.',
    };
  }

  // Our internal "HTTP_{status}" sentinel (set below)
  if (error instanceof Error && error.message.startsWith('HTTP_')) {
    const status = parseInt(error.message.slice(5), 10);

    if (status >= 400 && status < 500) {
      return {
        kind: 'client',
        title: 'Invalid configuration',
        message:
          status === 404
            ? "We couldn't find a template pack that matches your selections. Try a different combination."
            : 'The server rejected your configuration. Please review your selections and try again.',
        detail: `HTTP ${status}`,
      };
    }

    if (status >= 500) {
      return {
        kind: 'server',
        title: 'Server error',
        message:
          'Something went wrong on our end while generating your project. Please try again in a moment.',
        detail: `HTTP ${status}`,
      };
    }
  }

  // Anything else
  if (error instanceof Error) {
    return {
      kind: 'unknown',
      title: 'Generation failed',
      message: error.message || 'An unexpected error occurred.',
    };
  }

  return {
    kind: 'unknown',
    title: 'Generation failed',
    message: 'An unexpected error occurred. Please try again.',
  };
}

// Inner component that uses the context
function ExpressGeneratorInner() {
  const [appState, setAppState] = useState<AppState>('generator');
  const [projectConfig, setProjectConfig] = useState<WizardConfig | null>(null);
  const [error, setError] = useState<GenerationError | null>(null);
  const { config, recordRecentStack } = useExpressGenerator();
  const { toast } = useToast();

  const handleGenerate = useCallback(async () => {
    setError(null);
    setAppState('generating');
    setProjectConfig(config);

    // 60-second abort guard
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60_000);

    try {
      const response = await fetch('/api/v1/generate-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Try to extract a structured error body before falling back to status
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          try {
            const errorData = await response.json();
            const message = errorData.message || errorData.error;
            if (message) {
              throw new Error(message);
            }
          } catch {
            // Fall through to status-based error
          }
        }
        throw new Error(`HTTP_${response.status}`);
      }

      // Validate the response is a zip
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        // Server responded 200 but with JSON — treat as error
        const errorData = await response.json();
        throw new Error(errorData.message || 'Project generation failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.projectName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Record this successful stack in history
      recordRecentStack();

      toast({
        title: 'Project Generated Successfully!',
        description: `${config.projectName} has been downloaded.`,
      });
      setAppState('success');
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Error generating project:', err);
      const classified = classifyError(err);
      setError(classified);
      toast({
        title: classified.title,
        description: classified.message,
        variant: 'destructive',
      });
      setAppState('generator');
    }
  }, [config, recordRecentStack, toast]);

  const dismissError = useCallback(() => setError(null), []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main id="main-content" className="flex-1" role="main">
        {(appState === 'generator' || appState === 'generating') && (
          <div className="flex flex-col h-full">
            {error && (
              <div className="px-4 sm:px-6 pt-3">
                <Alert variant="destructive" className="relative pr-10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{error.title}</AlertTitle>
                  <AlertDescription className="mt-1 flex flex-col gap-2">
                    <span>{error.message}</span>
                    {error.detail && (
                      <span className="text-xs opacity-70 font-mono">{error.detail}</span>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleGenerate}
                        className="h-7 gap-1.5"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Retry
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={dismissError}
                        className="h-7"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </AlertDescription>
                  <button
                    type="button"
                    onClick={dismissError}
                    aria-label="Dismiss error"
                    className="absolute right-2 top-2 p-1 rounded-md hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Alert>
              </div>
            )}
            <div className="flex-1 min-h-0">
              <ExpressGeneratorLayout
                onGenerate={handleGenerate}
                isGenerating={appState === 'generating'}
              />
            </div>
          </div>
        )}
        {appState === 'success' && projectConfig && (
          <SuccessView
            config={projectConfig}
            onGenerateAnother={() => {
              setError(null);
              setAppState('generator');
            }}
          />
        )}
      </main>
      {appState === 'success' && <Footer />}
    </div>
  );
}

export default function ExpressGenerator() {
  return (
    <ExpressGeneratorProvider>
      <ExpressGeneratorInner />
    </ExpressGeneratorProvider>
  );
}
