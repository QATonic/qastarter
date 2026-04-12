import ProjectPreview from '@/components/ProjectPreview';
import StackSummary from './StackSummary';
import { useExpressGenerator } from './ExpressGeneratorContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Rocket, FolderTree, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const REQUIRED_KEYS = [
  'testingType',
  'framework',
  'language',
  'testRunner',
  'buildTool',
  'testingPattern',
  'projectName',
] as const;

/**
 * Compute the template pack ID from the current config.
 * Format matches server/templates/templatePackEngine.ts:getTemplatePackKey()
 */
function getTemplatePackId(config: {
  testingType?: string;
  language?: string;
  framework?: string;
  testRunner?: string;
  buildTool?: string;
}): string | null {
  if (
    !config.testingType ||
    !config.language ||
    !config.framework ||
    !config.testRunner ||
    !config.buildTool
  ) {
    return null;
  }
  return `${config.testingType}-${config.language}-${config.framework}-${config.testRunner}-${config.buildTool}`;
}

export default function PreviewPanel() {
  const { config, isConfigValid } = useExpressGenerator();

  // Compute progress (X of 6 required fields filled)
  const filledCount = REQUIRED_KEYS.reduce((acc, key) => {
    const value = config[key];
    return acc + (typeof value === 'string' && value.trim() !== '' ? 1 : 0);
  }, 0);
  const progressPct = Math.round((filledCount / REQUIRED_KEYS.length) * 100);
  const valid = isConfigValid();
  const packId = getTemplatePackId(config);

  return (
    <ScrollArea className="h-full w-full">
      <div className="p-6 space-y-5">
        {/* Header with progress bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {valid ? (
                <Rocket className="w-5 h-5 text-emerald-500" />
              ) : (
                <Sparkles className="w-5 h-5 text-primary" />
              )}
              <h2 className="text-lg font-semibold">
                {valid ? 'Ready to Generate' : 'Your Stack'}
              </h2>
            </div>
            <span
              className={cn(
                'text-xs font-semibold tabular-nums',
                valid ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
              )}
            >
              {filledCount} / {REQUIRED_KEYS.length}
            </span>
          </div>

          <Progress
            value={progressPct}
            className={cn('h-1.5', valid && '[&>div]:bg-emerald-500')}
          />

          <p className="text-sm text-muted-foreground">
            {valid
              ? 'Everything looks good \u2014 hit Generate & Download to grab the ZIP.'
              : filledCount === 0
                ? 'Click a preset above, or build your stack field-by-field on the left.'
                : `${REQUIRED_KEYS.length - filledCount} field${REQUIRED_KEYS.length - filledCount === 1 ? '' : 's'} to go. Your project structure will render as soon as you\u2019re done.`}
          </p>
        </div>

        {/* Live stack summary chips */}
        <StackSummary />

        {/* User-picked dependencies (from the Maven Central / npm search) */}
        {config.dependencies && config.dependencies.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">
                  Custom Dependencies{' '}
                  <span className="text-xs font-normal text-muted-foreground">
                    ({config.dependencies.length})
                  </span>
                </h3>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              These will be injected into your generated build file.
            </p>
            <ul className="space-y-1.5">
              {config.dependencies.map((dep) => (
                <li
                  key={`${dep.registry}:${dep.id}`}
                  className="flex items-center justify-between gap-2 rounded-md border border-border/50 bg-muted/20 px-2.5 py-1.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium truncate">{dep.name}</span>
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground/80 font-semibold">
                        {dep.registry}
                      </span>
                    </div>
                    {dep.group && (
                      <p className="text-[10px] text-muted-foreground font-mono truncate">
                        {dep.group}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground bg-background border border-border/50 rounded px-1.5 py-0.5 shrink-0">
                    {dep.version}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* File preview (only when valid) */}
        {valid && (
          <div className="space-y-3 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Project Structure</h3>
              </div>
              {packId && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-muted/40 px-2 py-1 text-[11px] font-mono text-muted-foreground cursor-help">
                      <Package className="size-3 shrink-0" />
                      <span className="truncate max-w-[260px]">{packId}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-[280px] text-xs">
                    <p className="font-semibold mb-0.5">Template Pack</p>
                    <p className="text-muted-foreground">
                      Your project is built from the <span className="font-mono">{packId}</span>{' '}
                      pack.
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <ProjectPreview
              projectName={config.projectName}
              configuration={config}
              onDownload={() => {}}
              hideDownloadButton={true}
            />
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
