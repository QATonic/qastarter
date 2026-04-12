import { Clock, X, Globe, Smartphone, Server, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExpressGenerator } from './ExpressGeneratorContext';
import { validationLabels } from '@shared/validationMatrix';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * RecentStacks
 *
 * Renders a horizontally-scrolling strip of up to 4 previously-generated
 * stacks. Clicking one re-applies that configuration via applyPreset, so a
 * returning user can jump back into their last stack with a single click.
 */
export default function RecentStacks() {
  const { recentStacks, applyPreset, clearRecentStacks, config } = useExpressGenerator();

  if (recentStacks.length === 0) {
    return null;
  }

  const iconFor = (testingType: string) => {
    switch (testingType) {
      case 'mobile':
        return Smartphone;
      case 'api':
        return Server;
      case 'desktop':
        return Monitor;
      case 'web':
      default:
        return Globe;
    }
  };

  const frameworkLabels = (validationLabels.frameworks ?? {}) as Record<string, string>;
  const languageLabels = (validationLabels.languages ?? {}) as Record<string, string>;

  return (
    <div className="w-full px-4 sm:px-6 pt-3 pb-3 border-b border-border/50 bg-background">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Recently Used
        </span>
        <button
          type="button"
          onClick={clearRecentStacks}
          className="ml-auto text-xs text-muted-foreground/80 hover:text-foreground inline-flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-muted/50 transition-colors"
          aria-label="Clear recent stacks"
        >
          <X className="size-3" />
          Clear
        </button>
      </div>
      <div className="relative">
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background/80 to-transparent z-10 sm:hidden" />
        <div className="w-full overflow-x-auto pb-1 scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            {recentStacks.map((stack, idx) => {
              const Icon = iconFor(stack.testingType);
              const frameworkLabel = frameworkLabels[stack.framework] ?? stack.framework;
              const languageLabel = languageLabels[stack.language] ?? stack.language;

              // Mark as active if the current config matches this stack
              const isActive =
                config.testingType === stack.testingType &&
                config.framework === stack.framework &&
                config.language === stack.language &&
                config.testRunner === stack.testRunner &&
                config.buildTool === stack.buildTool;

              return (
                <Tooltip key={`${stack.framework}-${stack.language}-${idx}`}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() =>
                        applyPreset({
                          testingType: stack.testingType,
                          framework: stack.framework,
                          language: stack.language,
                          testRunner: stack.testRunner,
                          buildTool: stack.buildTool,
                          projectName: stack.projectName,
                        })
                      }
                      className={cn(
                        'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all whitespace-nowrap',
                        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                        isActive
                          ? 'border-primary/50 bg-primary/10 text-primary font-semibold'
                          : 'border-border/70 bg-card hover:bg-muted/50 hover:border-primary/30 text-foreground'
                      )}
                    >
                      <Icon className="size-3.5 shrink-0" />
                      <span className="font-medium">{frameworkLabel}</span>
                      <span className="text-muted-foreground">·</span>
                      <span>{languageLabel}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[280px] text-xs leading-relaxed">
                    <p className="font-semibold mb-1">
                      {frameworkLabel} + {languageLabel}
                    </p>
                    <p className="text-muted-foreground">
                      {stack.testRunner} · {stack.buildTool}
                    </p>
                    {stack.projectName && (
                      <p className="text-muted-foreground mt-0.5">Project: {stack.projectName}</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
