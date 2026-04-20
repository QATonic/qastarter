import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  useState,
} from 'react';
import { WizardConfig, DEFAULT_CONFIG } from '@/components/wizard-steps/types';
import { WizardValidator } from '@shared/validationMatrix';

// ---------------------------------------------------------------------------
// URL param key mapping (short keys for compact shareable URLs)
// ---------------------------------------------------------------------------
const URL_KEY_MAP: Record<string, keyof WizardConfig> = {
  t: 'testingType',
  f: 'framework',
  l: 'language',
  r: 'testRunner',
  b: 'buildTool',
  p: 'testingPattern',
  n: 'projectName',
  ci: 'cicdTool',
  rp: 'reportingTool',
  gid: 'groupId',
  aid: 'artifactId',
  url: 'baseUrl',
  cf: 'cloudDeviceFarm',
  oas: 'openApiSpecUrl',
};

const REVERSE_URL_KEY_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(URL_KEY_MAP).map(([k, v]) => [v, k])
);

// ---------------------------------------------------------------------------
// localStorage keys
// ---------------------------------------------------------------------------
const LS_CONFIG_KEY = 'qastarter.express.config.v1';
const LS_RECENT_KEY = 'qastarter.express.recent.v1';
const RECENT_STACK_LIMIT = 4;

export interface RecentStack {
  testingType: string;
  framework: string;
  language: string;
  testRunner: string;
  buildTool: string;
  projectName: string;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Context type
// ---------------------------------------------------------------------------
export interface ExpressGeneratorContextType {
  config: WizardConfig;
  updateConfig: <K extends keyof WizardConfig>(key: K, value: WizardConfig[K]) => void;
  applyPreset: (preset: Partial<WizardConfig>) => void;
  getFilteredOptions: (step: string) => string[];
  isConfigValid: () => boolean;
  reset: () => void;
  shareableUrl: string;
  recentStacks: RecentStack[];
  /**
   * Whether the initial config was pre-populated from the URL (`?…`), from
   * localStorage (returning user), or if the user is starting fresh. `null`
   * until the hydration effect runs. UI can surface a dismissable breadcrumb
   * to reduce "why are my choices already filled in?" confusion.
   */
  hydrationSource: 'url' | 'localStorage' | null;
  recordRecentStack: () => void;
  clearRecentStacks: () => void;
}

const ExpressGeneratorContext = createContext<ExpressGeneratorContextType | null>(null);

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------
type Action =
  | { type: 'SET_FIELD'; key: keyof WizardConfig; value: WizardConfig[keyof WizardConfig] }
  | { type: 'APPLY_PRESET'; preset: Partial<WizardConfig> }
  | { type: 'RESET' }
  | { type: 'HYDRATE'; config: Partial<WizardConfig> };

/**
 * After a field is set, cascade-clear any downstream selections that are no
 * longer valid, then auto-select downstream fields that have exactly one
 * valid option remaining.
 */
function cascadeAndAutoSelect(config: WizardConfig): WizardConfig {
  // 1. Reset invalid downstream selections first
  let c = WizardValidator.resetInvalidSelections(config);

  // 2. Auto-select downstream fields when only one option exists
  const steps: Array<{ field: keyof WizardConfig; step: string }> = [
    { field: 'framework', step: 'framework' },
    { field: 'language', step: 'language' },
    { field: 'testRunner', step: 'testRunner' },
    { field: 'buildTool', step: 'buildTool' },
  ];

  for (const { field, step } of steps) {
    const options = WizardValidator.getFilteredOptions(step, c);
    if (!c[field] && options.length === 1) {
      (c as Record<string, string>)[field] = options[0];
    }
  }

  // 3. Testing pattern is required by the server schema, so always pick a
  //    default once framework+language are known. The first entry in the
  //    validation matrix is the sensible default for each framework
  //    (POM for web/mobile/desktop, Fluent for REST Assured, etc.). Users
  //    can still override it by clicking another pattern.
  if (!c.testingPattern && c.framework && c.language) {
    const patterns = WizardValidator.getFilteredOptions('testingPattern', c);
    if (patterns.length > 0) {
      c.testingPattern = patterns[0];
    }
  }

  // 3. Java metadata auto-population
  if (c.language === 'java' && (c.buildTool === 'maven' || c.buildTool === 'gradle')) {
    const slug = (c.projectName || 'my-project')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (!c.groupId) {
      c = { ...c, groupId: 'com.qastarter' };
    }
    // artifactId is always derived from project name (no UI field)
    c = { ...c, artifactId: slug };
  }

  return c;
}

function reducer(state: WizardConfig, action: Action): WizardConfig {
  switch (action.type) {
    case 'SET_FIELD': {
      const updated = { ...state, [action.key]: action.value };

      // When a primary selection field changes, clear downstream fields that
      // depend on it so cascadeAndAutoSelect can rebuild them cleanly.
      const clearDownstream: Record<string, (keyof WizardConfig)[]> = {
        testingType: [
          'framework',
          'language',
          'testRunner',
          'buildTool',
          'testingPattern',
          'cicdTool',
          'reportingTool',
          'groupId',
          'artifactId',
        ],
        framework: [
          'language',
          'testRunner',
          'buildTool',
          'testingPattern',
          'cicdTool',
          'reportingTool',
          'groupId',
          'artifactId',
        ],
        language: [
          'testRunner',
          'buildTool',
          'testingPattern',
          'reportingTool',
          'groupId',
          'artifactId',
        ],
      };

      const fieldsToClear = clearDownstream[action.key as string];
      if (fieldsToClear) {
        for (const f of fieldsToClear) {
          if (typeof updated[f] === 'string') {
            (updated as Record<string, string>)[f] = '';
          }
        }
      }

      // Auto-switch defaults when testingType changes
      if (action.key === 'testingType') {
        const urlDefaults: Record<string, string> = {
          web: 'https://www.saucedemo.com/',
          api: 'https://jsonplaceholder.typicode.com',
        };
        updated.baseUrl = urlDefaults[action.value] || '';
        updated.testUsername = action.value === 'web' ? 'standard_user' : '';
        updated.testPassword = action.value === 'web' ? 'secret_sauce' : '';
        updated.appPath =
          action.value === 'desktop' ? 'Microsoft.WindowsCalculator_8wekyb3d8bbwe!App' : '';
        updated.deviceName = '';
        updated.platformVersion = '';
        updated.apiAuthType = 'none';
        updated.apiAuthToken = '';
        // Reset cloud device farm when switching to types that don't support it
        if (action.value !== 'web' && action.value !== 'mobile') {
          updated.cloudDeviceFarm = 'none';
        }
      }

      // When baseUrl changes for web, auto-switch credentials
      if (action.key === 'baseUrl' && state.testingType === 'web') {
        const isSauceDemo = /saucedemo\.com/i.test(action.value);
        if (isSauceDemo) {
          updated.testUsername = 'standard_user';
          updated.testPassword = 'secret_sauce';
        } else if (state.testUsername === 'standard_user' || !state.testUsername) {
          updated.testUsername = '';
          updated.testPassword = '';
        }
      }

      return cascadeAndAutoSelect(updated);
    }

    case 'APPLY_PRESET': {
      const merged = { ...DEFAULT_CONFIG, ...action.preset };
      return cascadeAndAutoSelect(merged);
    }

    case 'HYDRATE': {
      const merged = { ...DEFAULT_CONFIG, ...action.config };
      return cascadeAndAutoSelect(merged);
    }

    case 'RESET':
      return { ...DEFAULT_CONFIG };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Helpers to read / write URL search params
// ---------------------------------------------------------------------------

// URL param name for the user-picked dependencies array (base64url-encoded JSON)
const URL_DEPS_KEY = 'd';

/**
 * base64url-encode a UTF-8 string. Avoids `+` / `/` / `=` so the value
 * can sit safely inside a URL query string without further escaping.
 */
function base64UrlEncode(input: string): string {
  // btoa only handles latin1; convert to UTF-8 bytes first
  const utf8 = unescape(encodeURIComponent(input));
  return btoa(utf8).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * base64url-decode back to a UTF-8 string. Returns null if the input
 * isn't valid base64url so callers can short-circuit gracefully.
 */
function base64UrlDecode(input: string): string | null {
  try {
    let padded = input.replace(/-/g, '+').replace(/_/g, '/');
    while (padded.length % 4) padded += '=';
    return decodeURIComponent(escape(atob(padded)));
  } catch {
    return null;
  }
}

function readConfigFromUrl(): Partial<WizardConfig> {
  const params = new URLSearchParams(window.location.search);
  const partial: Record<string, any> = {};

  for (const [shortKey, configKey] of Object.entries(URL_KEY_MAP)) {
    const value = params.get(shortKey);
    if (value) {
      partial[configKey] = value;
    }
  }

  // User-picked dependencies are encoded separately as base64url(JSON)
  const depsParam = params.get(URL_DEPS_KEY);
  if (depsParam) {
    const decoded = base64UrlDecode(depsParam);
    if (decoded) {
      try {
        const parsed = JSON.parse(decoded);
        if (Array.isArray(parsed)) {
          partial.dependencies = parsed;
        }
      } catch {
        // Ignore malformed dependency payloads
      }
    }
  }

  return partial as Partial<WizardConfig>;
}

function buildShareableUrl(config: WizardConfig): string {
  const params = new URLSearchParams();

  for (const [configKey, shortKey] of Object.entries(REVERSE_URL_KEY_MAP)) {
    const value = config[configKey as keyof WizardConfig];
    if (value && typeof value === 'string' && value.length > 0) {
      params.set(shortKey, value);
    }
  }

  // Encode user-picked dependencies as a single base64url-encoded JSON blob
  // so that shared links round-trip the dependency search selections.
  if (Array.isArray(config.dependencies) && config.dependencies.length > 0) {
    try {
      const json = JSON.stringify(config.dependencies);
      params.set(URL_DEPS_KEY, base64UrlEncode(json));
    } catch {
      // Ignore — the link will simply not include deps if serialization fails
    }
  }

  const qs = params.toString();
  const base = `${window.location.origin}${window.location.pathname}`;
  return qs ? `${base}?${qs}` : base;
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------
function readConfigFromLocalStorage(): Partial<WizardConfig> | null {
  try {
    const stored = localStorage.getItem(LS_CONFIG_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (parsed && typeof parsed === 'object') {
      return parsed as Partial<WizardConfig>;
    }
  } catch {
    // Ignore parse/access errors (private mode, quota, corrupted JSON, etc.)
  }
  return null;
}

function writeConfigToLocalStorage(config: WizardConfig): void {
  try {
    // Strip sensitive fields before persisting
    const { apiAuthToken, testPassword, ...safeConfig } = config;
    localStorage.setItem(LS_CONFIG_KEY, JSON.stringify(safeConfig));
  } catch {
    // Ignore quota errors
  }
}

function readRecentStacksFromLocalStorage(): RecentStack[] {
  try {
    const stored = localStorage.getItem(LS_RECENT_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (s): s is RecentStack => s && typeof s === 'object' && typeof s.framework === 'string'
      );
    }
  } catch {
    // Ignore
  }
  return [];
}

function writeRecentStacksToLocalStorage(stacks: RecentStack[]): void {
  try {
    localStorage.setItem(LS_RECENT_KEY, JSON.stringify(stacks));
  } catch {
    // Ignore
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function ExpressGeneratorProvider({ children }: { children: React.ReactNode }) {
  const [config, dispatch] = useReducer(reducer, DEFAULT_CONFIG);
  const [recentStacks, setRecentStacks] = useState<RecentStack[]>([]);
  const initializedRef = useRef(false);
  const urlUpdateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storageUpdateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate from URL or localStorage on mount (once).
  // `hydrationSource` lets the rest of the app show a one-line breadcrumb
  // ("Restored your previous stack" / "Loaded from shared link") so returning
  // users aren't confused when they land on the wizard with fields already
  // filled in.
  const [hydrationSource, setHydrationSource] = useState<'url' | 'localStorage' | null>(null);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Priority 1: URL params (sharing takes precedence)
    const urlConfig = readConfigFromUrl();
    if (Object.keys(urlConfig).length > 0) {
      dispatch({ type: 'HYDRATE', config: urlConfig });
      setHydrationSource('url');
    } else {
      // Priority 2: localStorage (returning user)
      const stored = readConfigFromLocalStorage();
      if (stored && Object.keys(stored).length > 0) {
        dispatch({ type: 'HYDRATE', config: stored });
        setHydrationSource('localStorage');
      }
    }

    // Always hydrate recent stacks
    setRecentStacks(readRecentStacksFromLocalStorage());
  }, []);

  // Debounced URL sync (300ms)
  useEffect(() => {
    if (!initializedRef.current) return;

    if (urlUpdateTimer.current) {
      clearTimeout(urlUpdateTimer.current);
    }

    urlUpdateTimer.current = setTimeout(() => {
      const url = buildShareableUrl(config);
      window.history.replaceState(null, '', url);
    }, 300);

    return () => {
      if (urlUpdateTimer.current) {
        clearTimeout(urlUpdateTimer.current);
      }
    };
  }, [config]);

  // Debounced localStorage sync (500ms) — persists across reloads
  useEffect(() => {
    if (!initializedRef.current) return;

    if (storageUpdateTimer.current) {
      clearTimeout(storageUpdateTimer.current);
    }

    storageUpdateTimer.current = setTimeout(() => {
      writeConfigToLocalStorage(config);
    }, 500);

    return () => {
      if (storageUpdateTimer.current) {
        clearTimeout(storageUpdateTimer.current);
      }
    };
  }, [config]);

  // --- Public API ---
  const updateConfig = useCallback(
    <K extends keyof WizardConfig>(key: K, value: WizardConfig[K]) => {
      dispatch({ type: 'SET_FIELD', key, value });
    },
    []
  );

  const applyPreset = useCallback((preset: Partial<WizardConfig>) => {
    dispatch({ type: 'APPLY_PRESET', preset });
  }, []);

  const getFilteredOptions = useCallback(
    (step: string): string[] => {
      return WizardValidator.getFilteredOptions(step, config);
    },
    [config]
  );

  const isConfigValid = useCallback((): boolean => {
    return Boolean(
      config.testingType &&
      config.framework &&
      config.language &&
      config.testRunner &&
      config.buildTool &&
      config.testingPattern &&
      config.projectName
    );
  }, [config]);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
    // Clear the persisted config so reset is sticky across reloads
    try {
      localStorage.removeItem(LS_CONFIG_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const recordRecentStack = useCallback(() => {
    // Only record complete stacks
    if (
      !config.testingType ||
      !config.framework ||
      !config.language ||
      !config.testRunner ||
      !config.buildTool
    ) {
      return;
    }

    const entry: RecentStack = {
      testingType: config.testingType,
      framework: config.framework,
      language: config.language,
      testRunner: config.testRunner,
      buildTool: config.buildTool,
      projectName: config.projectName || '',
      timestamp: Date.now(),
    };

    setRecentStacks((prev) => {
      // Dedupe by framework+language+testRunner+buildTool combo
      const key = `${entry.testingType}|${entry.framework}|${entry.language}|${entry.testRunner}|${entry.buildTool}`;
      const filtered = prev.filter(
        (s) =>
          `${s.testingType}|${s.framework}|${s.language}|${s.testRunner}|${s.buildTool}` !== key
      );
      const next = [entry, ...filtered].slice(0, RECENT_STACK_LIMIT);
      writeRecentStacksToLocalStorage(next);
      return next;
    });
  }, [config]);

  const clearRecentStacks = useCallback(() => {
    setRecentStacks([]);
    try {
      localStorage.removeItem(LS_RECENT_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const shareableUrl = useMemo(() => buildShareableUrl(config), [config]);

  const value = useMemo<ExpressGeneratorContextType>(
    () => ({
      config,
      updateConfig,
      applyPreset,
      getFilteredOptions,
      isConfigValid,
      reset,
      shareableUrl,
      recentStacks,
      recordRecentStack,
      clearRecentStacks,
      hydrationSource,
    }),
    [
      config,
      updateConfig,
      applyPreset,
      getFilteredOptions,
      isConfigValid,
      reset,
      shareableUrl,
      recentStacks,
      recordRecentStack,
      clearRecentStacks,
      hydrationSource,
    ]
  );

  return (
    <ExpressGeneratorContext.Provider value={value}>{children}</ExpressGeneratorContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useExpressGenerator(): ExpressGeneratorContextType {
  const ctx = useContext(ExpressGeneratorContext);
  if (!ctx) {
    throw new Error('useExpressGenerator must be used within an ExpressGeneratorProvider');
  }
  return ctx;
}
