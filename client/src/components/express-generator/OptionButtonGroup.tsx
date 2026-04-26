import React, { useRef, useCallback, KeyboardEvent } from 'react';
import { Check, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface OptionButtonGroupProps {
  label?: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  labels: Record<string, string>;
  icon?: React.ReactNode;
  columns?: number;
  /** Optional hint shown when options is empty (e.g. "Pick a Framework first") */
  lockedHint?: string;
  /** Optional per-option descriptions displayed in a tooltip on hover/focus */
  descriptions?: Record<string, string>;
  /** A11y label for the radiogroup (screen readers announce this) */
  groupLabel?: string;
  /**
   * Per-option short badges (e.g. "Coming Soon"). Options listed here
   * are rendered as disabled — clicks and arrow-key selection skip them.
   */
  disabledOptions?: Record<string, string>;
}

/**
 * OptionButtonGroup
 *
 * A horizontal pill group used for single-select configuration fields.
 * Supports:
 *  - Hover/focus tooltips with option descriptions
 *  - Keyboard arrow navigation (Left/Right/Home/End) with roving tabindex
 *  - Locked empty state with a contextual "what's blocking me" hint
 *  - Optional multi-column grid layout
 */
export default function OptionButtonGroup({
  label,
  options,
  value,
  onChange,
  labels,
  icon,
  columns,
  lockedHint,
  descriptions,
  groupLabel,
  disabledOptions,
}: OptionButtonGroupProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Which index should receive tab focus (roving tabindex pattern).
  // If a value is already selected, focus that; otherwise, focus the first option.
  const focusedIndex = Math.max(
    options.findIndex((o) => o === value),
    0
  );

  const moveFocus = useCallback((nextIndex: number) => {
    const container = containerRef.current;
    if (!container) return;
    const buttons = container.querySelectorAll<HTMLButtonElement>('button[data-option-button]');
    const target = buttons[nextIndex];
    if (target) {
      target.focus();
    }
  }, []);

  // Walk the options list to find the next non-disabled index, wrapping
  // around. Returns null if every option is disabled (degenerate case).
  const findEnabled = useCallback(
    (start: number, step: 1 | -1): number | null => {
      const n = options.length;
      for (let i = 1; i <= n; i++) {
        const idx = (start + step * i + n) % n;
        if (!disabledOptions || !disabledOptions[options[idx]]) return idx;
      }
      return null;
    },
    [options, disabledOptions]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
      let nextIndex: number | null = null;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          nextIndex = findEnabled(index, 1);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          nextIndex = findEnabled(index, -1);
          break;
        case 'Home':
          nextIndex = findEnabled(-1, 1);
          break;
        case 'End':
          nextIndex = findEnabled(options.length, -1);
          break;
      }

      if (nextIndex !== null) {
        e.preventDefault();
        moveFocus(nextIndex);
        // WAI-ARIA radio group: arrow keys both move focus and select
        onChange(options[nextIndex]);
      }
    },
    [moveFocus, findEnabled, options]
  );

  return (
    <div className="space-y-2">
      {/* Section label (optional — parent may render its own) */}
      {label && (
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          {icon && (
            <span className="flex-shrink-0 [&_svg]:size-4 text-muted-foreground">{icon}</span>
          )}
          <span>{label}</span>
        </div>
      )}

      {/* Options grid or empty state */}
      {options.length === 0 ? (
        <div className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border/60 bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground">
          <Lock className="size-3 shrink-0" />
          <span>{lockedHint ?? 'Locked — pick a previous option first'}</span>
        </div>
      ) : (
        <div
          ref={containerRef}
          role="radiogroup"
          aria-label={groupLabel ?? label}
          className="flex flex-wrap gap-2"
          style={
            columns
              ? {
                  display: 'grid',
                  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                  gap: '0.5rem',
                }
              : undefined
          }
        >
          {options.map((opt, index) => {
            const isSelected = opt === value;
            const displayLabel = labels[opt] ?? opt;
            const description = descriptions?.[opt];
            const disabledBadge = disabledOptions?.[opt];
            const isDisabled = !!disabledBadge;
            const isFocusable = !isDisabled && index === focusedIndex;

            const button = (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-disabled={isDisabled}
                disabled={isDisabled}
                tabIndex={isFocusable ? 0 : -1}
                data-option-button
                onClick={() => {
                  if (isDisabled) return;
                  onChange(opt);
                }}
                onKeyDown={(e) => handleKeyDown(e, index)}
                title={isDisabled ? `${displayLabel} — ${disabledBadge}` : undefined}
                className={cn(
                  'relative inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                  isSelected
                    ? 'bg-primary/10 border-primary/40 text-primary font-semibold'
                    : isDisabled
                      ? 'bg-muted/20 border-border text-muted-foreground/60 cursor-not-allowed opacity-70'
                      : 'bg-card border-border hover:bg-muted/50 text-foreground'
                )}
              >
                {isSelected && <Check className="size-3.5 shrink-0" />}
                {displayLabel}
                {isDisabled && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                    {disabledBadge}
                  </span>
                )}
              </button>
            );

            // Only wrap in tooltip if we have a description for this option
            if (description) {
              return (
                <Tooltip key={opt}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[260px] text-xs leading-relaxed">
                    <p className="font-semibold mb-0.5">{displayLabel}</p>
                    <p className="text-muted-foreground">{description}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return button;
          })}
        </div>
      )}
    </div>
  );
}
