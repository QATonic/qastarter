import React, { useState, useCallback, useRef } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExpressGenerator } from './ExpressGeneratorContext';

export default function CurlCommand() {
  const { config } = useExpressGenerator();
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build the JSON payload from the current config
  const payload = JSON.stringify(
    {
      testingType: config.testingType,
      framework: config.framework,
      language: config.language,
      testRunner: config.testRunner,
      buildTool: config.buildTool,
      testingPattern: config.testingPattern,
      projectName: config.projectName,
      cicdTool: config.cicdTool,
      reportingTool: config.reportingTool,
      ...(config.groupId ? { groupId: config.groupId } : {}),
      ...(config.artifactId ? { artifactId: config.artifactId } : {}),
    },
    null,
    2
  );

  const curlCommand = [
    'curl -X POST https://qastarter.com/api/v1/generate-project',
    '  -H "Content-Type: application/json"',
    `  -d '${payload}'`,
    '  -o project.zip',
  ].join(' \\\n');

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(curlCommand);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Failed to copy curl command:', err);
    }
  }, [curlCommand]);

  return (
    <div className="relative rounded-lg bg-muted border border-border overflow-hidden">
      {/* Copy button */}
      <button
        type="button"
        onClick={handleCopy}
        className={cn(
          'absolute top-2 right-2 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-all',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          copied
            ? 'bg-primary/10 border-primary/40 text-primary'
            : 'bg-background border-border hover:bg-muted/80 text-muted-foreground'
        )}
      >
        {copied ? (
          <>
            <Check className="size-3" />
            Copied
          </>
        ) : (
          <>
            <Copy className="size-3" />
            Copy
          </>
        )}
      </button>

      {/* Code block */}
      <pre className="overflow-x-auto p-4 pr-24 text-xs leading-relaxed font-mono text-foreground">
        <code>{curlCommand}</code>
      </pre>
    </div>
  );
}
