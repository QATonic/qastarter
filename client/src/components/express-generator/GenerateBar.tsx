import { useState, useEffect, useCallback, useRef } from 'react';
import { useExpressGenerator } from './ExpressGeneratorContext';
import CurlCommand from './CurlCommand';
import PreviewPanel from './PreviewPanel';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Download, Share2, Terminal, Loader2, AlertCircle, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface GenerateBarProps {
  onGenerate: () => void;
  isGenerating: boolean;
}

const REQUIRED_FIELDS: {
  key:
    | 'testingType'
    | 'framework'
    | 'language'
    | 'testRunner'
    | 'buildTool'
    | 'testingPattern'
    | 'projectName';
  label: string;
}[] = [
  { key: 'testingType', label: 'Testing Type' },
  { key: 'framework', label: 'Framework' },
  { key: 'language', label: 'Language' },
  { key: 'testRunner', label: 'Test Runner' },
  { key: 'buildTool', label: 'Build Tool' },
  { key: 'testingPattern', label: 'Testing Pattern' },
  { key: 'projectName', label: 'Project Name' },
];

export default function GenerateBar({ onGenerate, isGenerating }: GenerateBarProps) {
  const { config, isConfigValid, shareableUrl } = useExpressGenerator();
  const [showCurl, setShowCurl] = useState(false);
  const { toast } = useToast();

  // Find first missing required field for the inline hint
  const missingFields = REQUIRED_FIELDS.filter(({ key }) => {
    const value = config[key];
    return typeof value === 'string' ? value.trim() === '' : !value;
  });
  const firstMissing = missingFields[0];
  const valid = isConfigValid();

  // One-shot celebration: when the form first becomes valid, briefly highlight
  // the Generate button so users notice it lit up.
  const [celebrate, setCelebrate] = useState(false);
  const wasValidRef = useRef(valid);
  useEffect(() => {
    if (valid && !wasValidRef.current) {
      setCelebrate(true);
      const t = setTimeout(() => setCelebrate(false), 1800);
      return () => clearTimeout(t);
    }
    wasValidRef.current = valid;
  }, [valid]);

  const handleGenerate = useCallback(() => {
    if (isConfigValid() && !isGenerating) {
      onGenerate();
    }
  }, [isConfigValid, isGenerating, onGenerate]);

  // Keyboard shortcut: Ctrl+Enter / Cmd+Enter
  // Skip when focus is in a text input/textarea to avoid accidental generation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
        handleGenerate();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleGenerate]);

  const handleShare = async () => {
    if (!shareableUrl) return;
    try {
      await navigator.clipboard.writeText(shareableUrl);
      toast({
        title: 'Link copied',
        description: 'Shareable URL has been copied to your clipboard.',
      });
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Could not copy the link. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 z-10">
      <div className="flex items-center justify-between gap-3 px-6 py-3">
        {/* Left side: Generate button + shortcut hint */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex flex-col items-start gap-1 min-w-0">
            <Button
              size="lg"
              disabled={!valid || isGenerating}
              onClick={handleGenerate}
              className={cn(
                'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md transition-all',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                celebrate &&
                  'ring-4 ring-emerald-400/50 ring-offset-2 ring-offset-background scale-[1.02] shadow-lg shadow-emerald-500/30'
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Generate &amp; Download
                </>
              )}
            </Button>
            {valid ? (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  Ctrl
                </kbd>
                <span>+</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  Enter
                </kbd>
                <span className="ml-1">to generate</span>
              </span>
            ) : (
              <span
                className="text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1 max-w-[300px] sm:max-w-none"
                title={firstMissing ? `Pick a ${firstMissing.label}` : undefined}
              >
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span className="truncate">
                  One more thing: pick a <strong>{firstMissing?.label}</strong>
                  <span className="text-muted-foreground ml-1">
                    ({REQUIRED_FIELDS.length - missingFields.length}/{REQUIRED_FIELDS.length} done)
                  </span>
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Right side: mobile preview + Share + Curl toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile-only: open preview as a sheet so phone users can see their stack */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 lg:hidden"
                aria-label="View live preview"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Preview</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-hidden">
              <SheetHeader className="px-6 py-4 border-b border-border">
                <SheetTitle>Live Preview</SheetTitle>
              </SheetHeader>
              <div className="h-[calc(100dvh-65px)] overflow-hidden">
                <PreviewPanel />
              </div>
            </SheetContent>
          </Sheet>

          <Tooltip>
            <TooltipTrigger asChild>
              {/* Wrapping span ensures the tooltip still triggers on disabled buttons */}
              <span tabIndex={valid ? -1 : 0}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  disabled={!valid}
                  className="gap-1.5"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Share</span>
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              {valid
                ? 'Copy a shareable link to your clipboard'
                : 'Complete required fields to share your stack'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={valid ? -1 : 0}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCurl((prev) => !prev)}
                  disabled={!valid}
                  className={cn('gap-1.5', showCurl && 'bg-accent')}
                >
                  <Terminal className="w-4 h-4" />
                  <span className="hidden sm:inline">curl</span>
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              {valid
                ? 'Show curl command for CLI / CI use'
                : 'Complete required fields to see the curl command'}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Expandable curl command */}
      {showCurl && (
        <div className="px-6 pb-4">
          <CurlCommand />
        </div>
      )}
    </div>
  );
}
