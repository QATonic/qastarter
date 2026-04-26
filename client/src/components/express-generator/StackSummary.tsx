import React from 'react';
import {
  Globe,
  Code2,
  Languages,
  Terminal,
  Wrench,
  Layers,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExpressGenerator } from './ExpressGeneratorContext';
import { validationLabels } from '@shared/validationMatrix';

interface SummaryItem {
  key: string;
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  required: boolean;
}

/**
 * StackSummary - shows the user's current selections as labeled chips.
 * Empty slots show as dashed placeholders so the user always sees what's
 * left to fill in. Replaces the cold checklist with a warm "you're building"
 * view that updates in real time.
 */
export default function StackSummary() {
  const { config } = useExpressGenerator();

  const items: SummaryItem[] = [
    {
      key: 'testingType',
      label: 'Testing Type',
      value:
        validationLabels.testingTypes[
          config.testingType as keyof typeof validationLabels.testingTypes
        ] || '',
      icon: Globe,
      required: true,
    },
    {
      key: 'framework',
      label: 'Framework',
      value:
        validationLabels.frameworks[config.framework as keyof typeof validationLabels.frameworks] ||
        '',
      icon: Code2,
      required: true,
    },
    {
      key: 'language',
      label: 'Language',
      value:
        validationLabels.languages[config.language as keyof typeof validationLabels.languages] ||
        '',
      icon: Languages,
      required: true,
    },
    {
      key: 'testRunner',
      label: 'Test Runner',
      value:
        validationLabels.testRunners[
          config.testRunner as keyof typeof validationLabels.testRunners
        ] || '',
      icon: Terminal,
      required: true,
    },
    {
      key: 'buildTool',
      label: 'Build Tool',
      value:
        validationLabels.buildTools[config.buildTool as keyof typeof validationLabels.buildTools] ||
        '',
      icon: Wrench,
      required: true,
    },
    {
      key: 'testingPattern',
      label: 'Testing Pattern',
      value:
        (validationLabels.testingPatterns &&
          validationLabels.testingPatterns[
            config.testingPattern as keyof typeof validationLabels.testingPatterns
          ]) ||
        '',
      icon: Layers,
      required: false,
    },
    {
      key: 'projectName',
      label: 'Project Name',
      value: config.projectName || '',
      icon: FileText,
      required: true,
    },
  ];

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const Icon = item.icon;
        const isFilled = item.value.length > 0;

        return (
          <div
            key={item.key}
            className={cn(
              'flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all',
              isFilled
                ? 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10'
                : 'border-dashed border-border/50 bg-muted/20'
            )}
          >
            <div
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-md shrink-0 transition-colors',
                isFilled
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-muted/50 text-muted-foreground/60'
              )}
            >
              {isFilled ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
            </div>

            <div className="flex-1 min-w-0">
              <div
                className={cn(
                  'text-[11px] font-semibold uppercase tracking-wide',
                  isFilled
                    ? 'text-emerald-700/80 dark:text-emerald-400/80'
                    : 'text-muted-foreground/70'
                )}
              >
                {item.label}
                {item.required && !isFilled && (
                  <span className="text-destructive/70 ml-0.5">*</span>
                )}
              </div>
              <div
                className={cn(
                  'text-sm truncate',
                  isFilled ? 'font-semibold text-foreground' : 'text-muted-foreground/60 italic'
                )}
              >
                {isFilled ? item.value : item.required ? 'Waiting for your pick…' : 'Optional'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
