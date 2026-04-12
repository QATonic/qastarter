/**
 * DependencySearch
 *
 * Spring Initializr-style dependency picker. Searches public package
 * registries (Maven Central / npm) live and lets the user add a
 * package to the current project. Selected packages are stored on
 * the WizardConfig and injected into the generated build file
 * (pom.xml / build.gradle / package.json) at download time.
 *
 * The active registry (Maven vs npm) is chosen automatically from
 * the currently-selected language, but the user can flip between
 * tabs to search the other registry too.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useExpressGenerator } from './ExpressGeneratorContext';
import type { UserDependency, DependencyRegistry } from '@/components/wizard-steps/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import {
  Search,
  Loader2,
  Plus,
  X,
  Package,
  ExternalLink,
  AlertCircle,
  ChevronDown,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  registry: DependencyRegistry;
  name: string;
  group?: string;
  version: string;
  description?: string;
  homepage?: string;
}

interface SearchResponse {
  success: boolean;
  data?: {
    registry: DependencyRegistry;
    query: string;
    count: number;
    results: SearchResult[];
  };
  error?: { message?: string };
}

const DEBOUNCE_MS = 350;
const MIN_QUERY_LEN = 2;

/**
 * Map a language id to the registry it lives in.
 * Falls back to npm because most "general" use cases are JS-based.
 */
function defaultRegistryFor(language: string | undefined): DependencyRegistry {
  if (!language) return 'npm';
  const lc = language.toLowerCase();
  if (lc === 'java' || lc === 'kotlin' || lc === 'scala') return 'maven';
  return 'npm';
}

export default function DependencySearch() {
  const { config, updateConfig } = useExpressGenerator();
  const selected: UserDependency[] = config.dependencies ?? [];

  const [registry, setRegistry] = useState<DependencyRegistry>(() =>
    defaultRegistryFor(config.language)
  );
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [resultCount, setResultCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-flip registry when the language changes (only if user hasn't picked anything yet)
  useEffect(() => {
    setRegistry(defaultRegistryFor(config.language));
  }, [config.language]);

  // Keyboard shortcut: "/" to focus the search input (Spring Initializr-style)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Debounce the query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  // Fire the search when debouncedQuery / registry changes
  useEffect(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    if (debouncedQuery.length < MIN_QUERY_LEN) {
      setResults([]);
      setResultCount(0);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);

    const url = `/api/v1/dependencies/search?registry=${encodeURIComponent(
      registry
    )}&q=${encodeURIComponent(debouncedQuery)}&limit=15`;

    fetch(url, { signal: controller.signal })
      .then(async (res) => {
        const json: SearchResponse = await res.json().catch(() => ({ success: false }));
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || `Search failed (${res.status})`);
        }
        setResults(json.data?.results ?? []);
        setResultCount(json.data?.count ?? 0);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setResults([]);
        setResultCount(0);
        setError(err instanceof Error ? err.message : 'Search failed. Please try again.');
      })
      .finally(() => {
        if (abortRef.current === controller) {
          setLoading(false);
          abortRef.current = null;
        }
      });

    return () => controller.abort();
  }, [debouncedQuery, registry]);

  const selectedIds = useMemo(
    () => new Set(selected.map((d) => `${d.registry}:${d.id}`)),
    [selected]
  );

  const addDependency = (result: SearchResult) => {
    const key = `${result.registry}:${result.id}`;
    if (selectedIds.has(key)) return;
    const next: UserDependency[] = [
      ...selected,
      {
        id: result.id,
        registry: result.registry,
        name: result.name,
        version: result.version,
        group: result.group,
        description: result.description,
        homepage: result.homepage,
      },
    ];
    updateConfig('dependencies', next);
  };

  const removeDependency = (dep: UserDependency) => {
    const next = selected.filter((d) => !(d.registry === dep.registry && d.id === dep.id));
    updateConfig('dependencies', next);
  };

  const setDependencyVersion = useCallback(
    (dep: UserDependency, version: string) => {
      const next = selected.map((d) =>
        d.registry === dep.registry && d.id === dep.id ? { ...d, version } : d
      );
      updateConfig('dependencies', next);
    },
    [selected, updateConfig]
  );

  const hasResults = results.length > 0;
  const isSearching = debouncedQuery.length >= MIN_QUERY_LEN;

  return (
    <div className="space-y-3">
      {/* Registry tabs */}
      <Tabs
        value={registry}
        onValueChange={(v) => {
          setRegistry(v as DependencyRegistry);
          setQuery('');
          setResults([]);
          setResultCount(0);
        }}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 h-9">
          <TabsTrigger value="maven" className="text-xs gap-1.5">
            <Package className="w-3.5 h-3.5" />
            Maven Central
          </TabsTrigger>
          <TabsTrigger value="npm" className="text-xs gap-1.5">
            <Package className="w-3.5 h-3.5" />
            npm
          </TabsTrigger>
        </TabsList>

        <TabsContent value={registry} className="mt-3 space-y-2">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                registry === 'maven'
                  ? 'Search Maven Central (e.g. selenium-java, jackson, lombok)...'
                  : 'Search npm (e.g. axios, lodash, dotenv)...'
              }
              className="pl-9 pr-9 h-10"
              aria-label={`Search ${registry === 'maven' ? 'Maven Central' : 'npm registry'}`}
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
            )}
          </div>

          {/* Results panel */}
          <div className="rounded-lg border border-border/60 bg-card/50 overflow-hidden">
            {error ? (
              <div className="flex items-center gap-2 p-4 text-sm text-destructive bg-destructive/5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : !isSearching ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                <Search className="w-5 h-5 mx-auto mb-2 opacity-40" />
                Type at least {MIN_QUERY_LEN} characters to search{' '}
                {registry === 'maven' ? 'Maven Central' : 'npm'}.
              </div>
            ) : loading && results.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-6 text-sm text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span>Searching {registry === 'maven' ? 'Maven Central' : 'npm'}...</span>
              </div>
            ) : !loading && results.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No packages found for{' '}
                <span className="font-mono text-foreground/70">&quot;{debouncedQuery}&quot;</span>.
                {registry === 'maven' && (
                  <p className="text-xs mt-1 opacity-70">
                    Tip: Try the exact artifact name (e.g. &quot;selenium-java&quot; instead of
                    &quot;selenium&quot;).
                  </p>
                )}
              </div>
            ) : (
              <>
                {/* Result count header */}
                {hasResults && (
                  <div className="flex items-center justify-between px-3 py-1.5 bg-muted/30 border-b border-border/40">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {resultCount > results.length
                        ? `Showing ${results.length} of ${resultCount} results`
                        : `${results.length} result${results.length !== 1 ? 's' : ''}`}
                    </span>
                    {loading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                  </div>
                )}

                {/* Scrollable results list */}
                <ScrollArea className="max-h-[360px]">
                  <ul className="divide-y divide-border/30">
                    {results.map((result) => {
                      const key = `${result.registry}:${result.id}`;
                      const alreadyAdded = selectedIds.has(key);
                      return (
                        <li
                          key={key}
                          className={cn(
                            'flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-muted/40 transition-colors group',
                            alreadyAdded && 'opacity-50 bg-muted/10'
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold truncate">{result.name}</span>
                              <Badge
                                variant="outline"
                                className="text-[10px] font-mono px-1.5 py-0 h-[18px] border-primary/20 text-primary/80"
                              >
                                {result.version}
                              </Badge>
                              {result.homepage && (
                                <a
                                  href={result.homepage}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-muted-foreground/50 hover:text-primary transition-colors"
                                  aria-label={`Open ${result.name} homepage`}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                            {result.group && (
                              <p className="text-[11px] text-muted-foreground/70 font-mono truncate mt-0.5">
                                {result.group}
                              </p>
                            )}
                            {result.description && (
                              <p className="text-xs text-muted-foreground/60 line-clamp-1 mt-0.5">
                                {result.description}
                              </p>
                            )}
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant={alreadyAdded ? 'ghost' : 'outline'}
                            disabled={alreadyAdded}
                            onClick={() => addDependency(result)}
                            className={cn(
                              'h-7 px-2.5 text-xs shrink-0 transition-all',
                              !alreadyAdded &&
                                'hover:bg-primary hover:text-primary-foreground hover:border-primary'
                            )}
                            aria-label={
                              alreadyAdded ? `${result.name} already added` : `Add ${result.name}`
                            }
                          >
                            {alreadyAdded ? (
                              <>
                                <Check className="w-3 h-3 mr-1" />
                                Added
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3 mr-1" />
                                Add
                              </>
                            )}
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                </ScrollArea>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Selected dependencies */}
      {selected.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Added Dependencies ({selected.length})
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => updateConfig('dependencies', [])}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
            >
              Clear all
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selected.map((dep) => (
              <DependencyChip
                key={`${dep.registry}:${dep.id}`}
                dep={dep}
                onRemove={() => removeDependency(dep)}
                onVersionChange={(v) => setDependencyVersion(dep, v)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// DependencyChip — single chip with inline version picker
// ----------------------------------------------------------------------------

interface DependencyChipProps {
  dep: UserDependency;
  onRemove: () => void;
  onVersionChange: (version: string) => void;
}

function DependencyChip({ dep, onRemove, onVersionChange }: DependencyChipProps) {
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  // Fetch versions lazily on first open
  useEffect(() => {
    if (!open || fetchedRef.current) return;
    fetchedRef.current = true;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const url = `/api/v1/dependencies/versions?registry=${encodeURIComponent(
      dep.registry
    )}&id=${encodeURIComponent(dep.id)}`;

    fetch(url, { signal: controller.signal })
      .then(async (res) => {
        const json = await res.json().catch(() => ({ success: false }));
        if (!res.ok || !json.success) {
          throw new Error(json?.error?.message || `Failed (${res.status})`);
        }
        const list: string[] = json.data?.versions ?? [];
        // Ensure currently-pinned version is in the list (top of list)
        if (dep.version && !list.includes(dep.version)) {
          list.unshift(dep.version);
        }
        setVersions(list);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Could not load versions');
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [open, dep.registry, dep.id, dep.version]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="secondary" className="gap-0.5 pr-0.5 pl-2 max-w-[260px] flex items-center">
          <span className="truncate text-xs">{dep.name}</span>

          {/* Version picker popover */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="ml-1 inline-flex items-center gap-0.5 rounded px-1 py-0.5 font-mono text-[10px] text-muted-foreground hover:bg-foreground/10 hover:text-foreground transition-colors"
                aria-label={`Change version of ${dep.name}, currently ${dep.version}`}
              >
                {dep.version}
                <ChevronDown className="w-2.5 h-2.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="start"
              className="w-56 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-3 py-2 border-b border-border/50">
                <p className="text-xs font-medium">Select version</p>
                <p className="text-[10px] text-muted-foreground font-mono truncate">{dep.id}</p>
              </div>
              {loading ? (
                <div className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Loading versions...
                </div>
              ) : error ? (
                <div className="flex items-center gap-2 px-3 py-3 text-xs text-destructive">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {error}
                </div>
              ) : versions.length === 0 ? (
                <div className="px-3 py-3 text-xs text-muted-foreground">No versions found.</div>
              ) : (
                <ScrollArea className="max-h-56">
                  <ul className="py-1">
                    {versions.map((v) => {
                      const isCurrent = v === dep.version;
                      return (
                        <li key={v}>
                          <button
                            type="button"
                            onClick={() => {
                              onVersionChange(v);
                              setOpen(false);
                            }}
                            className={cn(
                              'w-full flex items-center justify-between px-3 py-1.5 text-xs font-mono hover:bg-accent text-left',
                              isCurrent && 'bg-accent/50'
                            )}
                          >
                            <span>{v}</span>
                            {isCurrent && <Check className="w-3 h-3 text-primary" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </ScrollArea>
              )}
            </PopoverContent>
          </Popover>

          <button
            type="button"
            onClick={onRemove}
            className="ml-0.5 rounded-sm hover:bg-destructive/20 p-0.5"
            aria-label={`Remove ${dep.name}`}
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top">
        <div className="text-xs">
          <div className="font-mono">{dep.id}</div>
          <div className="text-muted-foreground capitalize">{dep.registry}</div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
