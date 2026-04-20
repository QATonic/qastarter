import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Copy, Check, Github, ExternalLink, Terminal, Shield, Zap, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const CLAUDE_DESKTOP_CONFIG = `{
  "mcpServers": {
    "qastarter": {
      "command": "npx",
      "args": ["-y", "@qatonic_innovations/qastarter-cli", "mcp"]
    }
  }
}`;

const NPX_CMD = 'npx -y @qatonic_innovations/qastarter-cli mcp';
const GLOBAL_INSTALL_CMD = 'npm i -g @qatonic_innovations/qastarter-cli && qastarter mcp';

const TOOLS: Array<{ name: string; summary: string; blurb: string }> = [
  {
    name: 'list_combinations',
    summary: 'Discover what QAStarter supports.',
    blurb:
      'Returns every valid (testingType × framework × language × runner × build tool). AI clients call this first so they pick combinations that actually work.',
  },
  {
    name: 'validate_combination',
    summary: 'Confirm a combo before scaffolding.',
    blurb:
      'Returns `{ valid: true }` or `{ valid: false, errors: [...] }`. Saves a 400 roundtrip when the AI isn\u2019t sure.',
  },
  {
    name: 'preview_project',
    summary: 'Dry-run without touching disk.',
    blurb:
      'Returns the file tree and key-file contents so the user can sanity-check before anything lands in the workspace.',
  },
  {
    name: 'generate_project',
    summary: 'Write the full project into targetDir.',
    blurb:
      'Safe by default \u2014 relative paths only, refuses non-empty dirs unless `force: true`, zip-slip guarded, rejects symlink entries.',
  },
  {
    name: 'get_dependencies',
    summary: 'The deps that would be added to your project.',
    blurb:
      'Useful when the user wants to answer "what goes into my pom.xml / package.json / requirements.txt if I pick this combo?".',
  },
  {
    name: 'get_bom',
    summary: 'Pinned library versions per language.',
    blurb:
      'Backs the `qastarter update` command too \u2014 lets the AI answer "is my project up to date?" questions.',
  },
];

function CopyableBlock({ value, language }: { value: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative group">
      <pre
        className={cn(
          'rounded-lg border bg-muted/40 text-sm p-4 overflow-x-auto font-mono text-foreground/90',
          'ring-1 ring-border/60'
        )}
        data-language={language}
      >
        {value}
      </pre>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="absolute top-2 right-2 h-7 gap-1 text-xs opacity-90"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            /* clipboard may be unavailable; no-op */
          }
        }}
        aria-label="Copy to clipboard"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  );
}

export default function Mcp() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Background flourish, same palette as the landing page */}
      <div className="relative flex-1">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-500/15 to-teal-500/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-teal-500/15 to-cyan-500/15 rounded-full blur-3xl" />
        </div>

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative max-w-4xl">
          {/* Hero */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-medium mb-5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>NEW \u2014 AI-native QA scaffolding</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-5 tracking-tight">
              QAStarter speaks{' '}
              <span className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 bg-clip-text text-transparent">
                MCP
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Let Claude Desktop, Cursor, Claude Code, Windsurf, and any other MCP-aware AI client
              scaffold production-ready test automation projects directly into your workspace \u2014
              no browser, no download, no rate-limit mid-session.
            </p>
          </div>

          {/* Quick-start config */}
          <Card className="mb-10 border-emerald-500/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Terminal className="h-5 w-5 text-emerald-500" />
                Add to your AI IDE in 30 seconds
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Paste this into your <code className="rounded bg-muted px-1.5 py-0.5">claude_desktop_config.json</code>{' '}
                (or the equivalent MCP block for Cursor / Claude Code / Windsurf):
              </p>
              <CopyableBlock value={CLAUDE_DESKTOP_CONFIG} language="json" />
              <p className="text-sm text-muted-foreground">
                Restart the client and ask it:
              </p>
              <blockquote className="border-l-2 border-emerald-500/60 pl-4 italic text-foreground/90">
                \u201cUse qastarter to scaffold a Playwright TypeScript project with Jest into{' '}
                <code className="not-italic">./tests/e2e</code>.\u201d
              </blockquote>
            </CardContent>
          </Card>

          {/* Alternative install */}
          <div className="grid md:grid-cols-2 gap-4 mb-14">
            <div className="rounded-lg border bg-card p-5">
              <h3 className="text-sm font-semibold mb-2">One-off via npx</h3>
              <CopyableBlock value={NPX_CMD} />
              <p className="text-xs text-muted-foreground mt-2">No global install. MCP clients that run `npx` will pick this up automatically.</p>
            </div>
            <div className="rounded-lg border bg-card p-5">
              <h3 className="text-sm font-semibold mb-2">Or install globally</h3>
              <CopyableBlock value={GLOBAL_INSTALL_CMD} />
              <p className="text-xs text-muted-foreground mt-2">Gives you the <code>qastarter</code> binary for direct use.</p>
            </div>
          </div>

          {/* What the AI can do */}
          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 tracking-tight">Six tools your AI gets</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {TOOLS.map((t) => (
                <Card key={t.name} className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-mono text-emerald-600 dark:text-emerald-400">
                      {t.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium mb-1">{t.summary}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{t.blurb}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Why it matters */}
          <section className="mb-16 grid md:grid-cols-3 gap-6">
            <div>
              <Shield className="h-6 w-6 text-emerald-500 mb-3" />
              <h3 className="font-semibold mb-1">Safe by default</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Relative paths only. Refuses non-empty directories unless you opt in. Zip-slip + symlink guarded.
              </p>
            </div>
            <div>
              <Zap className="h-6 w-6 text-emerald-500 mb-3" />
              <h3 className="font-semibold mb-1">Built for AI iteration</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Authenticated MCP clients get 10\u00d7 the anonymous rate limit. No more "too many requests" mid-session.
              </p>
            </div>
            <div>
              <Sparkles className="h-6 w-6 text-emerald-500 mb-3" />
              <h3 className="font-semibold mb-1">Same engine as the web app</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every combo you can pick in the wizard is available through MCP. Templates stay canonical.
              </p>
            </div>
          </section>

          {/* Footer CTA */}
          <div className="text-center py-12 rounded-xl border bg-card/40">
            <h2 className="text-2xl font-bold mb-3">Try it now</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Open your AI IDE, paste the config above, and ask it to scaffold your next QA framework.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild>
                <a
                  href="https://www.npmjs.com/package/@qatonic_innovations/qastarter-cli"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  View on npm
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a
                  href="https://github.com/QATonic/qastarter"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  <Github className="h-4 w-4" />
                  Source on GitHub
                </a>
              </Button>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
