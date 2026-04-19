import fs from 'fs';
import path from 'path';

export interface GenerateOptions {
  projectName: string;
  testingType: string;
  framework: string;
  language: string;
  testRunner?: string;
  buildTool?: string;
  testingPattern?: string;
  cicdTool?: string;
  reportingTool?: string;
  utilities?: string[];
  includeSampleTests?: boolean;
}

interface IdLabel {
  id: string;
  label: string;
}

interface UtilityInfo {
  id: string;
  label: string;
  description: string;
}

interface TestingTypeInfo {
  id: string;
  label: string;
  frameworks: string[];
}

interface FrameworkInfo {
  id: string;
  label: string;
  languages: string[];
  cicdTools: string[];
  reportingTools: string[];
  testingPatterns: string[];
}

interface LanguageInfo {
  id: string;
  label: string;
  testRunners: string[];
  buildTools: string[];
}

interface RawMetadataResponse {
  success: boolean;
  data: {
    version: string;
    testingTypes: TestingTypeInfo[];
    frameworks: FrameworkInfo[];
    languages: LanguageInfo[];
    testRunners: IdLabel[];
    buildTools: IdLabel[];
    cicdTools: IdLabel[];
    reportingTools: IdLabel[];
    testingPatterns: IdLabel[];
    utilities: UtilityInfo[];
  };
}

export interface MetadataResponse {
  testingTypes: string[];
  frameworks: Record<string, { languages: string[]; testingTypes: string[] }>;
  languages: string[];
  testRunners: Record<string, string[]>;
  buildTools: Record<string, string[]>;
  testingPatterns: string[];
  cicdTools: string[];
  reportingTools: string[];
  utilities: string[];
}

const DEFAULT_API_URL = 'https://qastarter.qatonic.com';

export function getApiUrl(): string {
  return process.env.QASTARTER_API_URL || DEFAULT_API_URL;
}

/**
 * Headers to attach to every REST call. Tagged with `X-QAStarter-Client` so
 * the backend can (a) raise the rate limit for trusted MCP clients and
 * (b) separate AI vs human combo picks in analytics. Set
 * `QASTARTER_CLIENT=mcp` from the MCP server's entry point; optionally pass
 * `QASTARTER_MCP_TOKEN` to claim the elevated limit if the server is
 * configured with `QASTARTER_MCP_BYPASS_TOKEN`.
 */
export function clientHeaders(): Record<string, string> {
  const out: Record<string, string> = {};
  const client = process.env.QASTARTER_CLIENT;
  if (client) out['X-QAStarter-Client'] = client;
  const token = process.env.QASTARTER_MCP_TOKEN;
  if (token) out['X-QAStarter-Token'] = token;
  return out;
}

function transformMetadata(raw: RawMetadataResponse): MetadataResponse {
  const testingTypeMap = new Map<string, string[]>();
  raw.data.testingTypes.forEach((tt) => {
    testingTypeMap.set(tt.id, tt.frameworks);
  });

  const frameworks: Record<string, { languages: string[]; testingTypes: string[] }> = {};
  raw.data.frameworks.forEach((f) => {
    const testingTypes: string[] = [];
    testingTypeMap.forEach((fws, ttId) => {
      if (fws.includes(f.id)) {
        testingTypes.push(ttId);
      }
    });
    frameworks[f.id] = {
      languages: f.languages,
      testingTypes,
    };
  });

  const testRunners: Record<string, string[]> = {};
  const buildTools: Record<string, string[]> = {};
  raw.data.languages.forEach((l) => {
    testRunners[l.id] = l.testRunners;
    buildTools[l.id] = l.buildTools;
  });

  return {
    testingTypes: raw.data.testingTypes.map((t) => t.id),
    frameworks,
    languages: raw.data.languages.map((l) => l.id),
    testRunners,
    buildTools,
    testingPatterns: raw.data.testingPatterns.map((p) => p.id),
    cicdTools: raw.data.cicdTools.map((c) => c.id),
    reportingTools: raw.data.reportingTools.map((r) => r.id),
    utilities: raw.data.utilities.map((u) => u.id),
  };
}

export async function fetchMetadata(): Promise<MetadataResponse> {
  const response = await fetch(`${getApiUrl()}/api/v1/metadata`, {
    headers: clientHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch metadata: ${response.statusText}`);
  }
  const raw: RawMetadataResponse = await response.json();
  return transformMetadata(raw);
}

/**
 * Fetch the Bill of Materials (library versions) from the QAStarter API.
 * Falls back to null if the server is unreachable.
 */
export async function fetchBom(): Promise<Record<string, Record<string, string>> | null> {
  try {
    const response = await fetch(`${getApiUrl()}/api/v1/bom`, {
      headers: clientHeaders(),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const body = await response.json();
    return body?.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Low-level helper: stream the generated project ZIP for a given config.
 * Callers decide whether to save it to disk or extract it in-process.
 */
export async function generateProjectBuffer(options: GenerateOptions): Promise<{
  buffer: Buffer;
  filename: string;
}> {
  const params = new URLSearchParams();
  params.set('projectName', options.projectName);
  params.set('testingType', options.testingType);
  params.set('framework', options.framework);
  params.set('language', options.language);
  if (options.testRunner) params.set('testRunner', options.testRunner);
  if (options.buildTool) params.set('buildTool', options.buildTool);
  if (options.testingPattern) params.set('testingPattern', options.testingPattern);
  if (options.cicdTool) params.set('cicdTool', options.cicdTool);
  if (options.reportingTool) params.set('reportingTool', options.reportingTool);
  if (options.utilities && options.utilities.length > 0) {
    params.set('utilities', options.utilities.join(','));
  }
  if (options.includeSampleTests !== undefined) {
    params.set('includeSampleTests', String(options.includeSampleTests));
  }

  const url = `${getApiUrl()}/api/v1/generate?${params.toString()}`;
  const response = await fetch(url, { headers: clientHeaders() });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to generate project (HTTP ${response.status}): ${errorText}`);
  }

  const contentDisposition = response.headers.get('content-disposition');
  let filename = `${options.projectName}.zip`;
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?([^"]+)"?/);
    if (match) filename = match[1];
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return { buffer, filename };
}

/**
 * POST to /api/v1/project-preview — returns project file tree and sample contents.
 */
export async function previewProject(
  options: GenerateOptions
): Promise<Record<string, unknown>> {
  const response = await fetch(`${getApiUrl()}/api/v1/project-preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...clientHeaders() },
    body: JSON.stringify(options),
  });
  if (!response.ok) {
    throw new Error(`Failed to preview project (HTTP ${response.status}): ${await response.text()}`);
  }
  const body = (await response.json()) as { data?: Record<string, unknown> };
  return body.data ?? {};
}

/**
 * POST to /api/v1/project-dependencies — returns resolved dependency map for a combo.
 */
export async function getProjectDependencies(
  options: GenerateOptions
): Promise<Record<string, unknown>> {
  const response = await fetch(`${getApiUrl()}/api/v1/project-dependencies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...clientHeaders() },
    body: JSON.stringify(options),
  });
  if (!response.ok) {
    throw new Error(
      `Failed to fetch dependencies (HTTP ${response.status}): ${await response.text()}`
    );
  }
  const body = (await response.json()) as { data?: Record<string, unknown> };
  return body.data ?? {};
}

/**
 * POST to /api/v1/validate-config — returns {valid, errors[]}.
 */
export async function validateConfig(
  options: GenerateOptions
): Promise<{ valid: boolean; errors?: Array<{ field: string; message: string }> }> {
  const response = await fetch(`${getApiUrl()}/api/v1/validate-config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...clientHeaders() },
    body: JSON.stringify(options),
  });
  if (!response.ok) {
    const text = await response.text();
    // Incompatible combos return 400; surface as structured error instead of throwing.
    try {
      const body = JSON.parse(text) as { error?: { message?: string } };
      return { valid: false, errors: [{ field: 'combination', message: body.error?.message ?? text }] };
    } catch {
      return { valid: false, errors: [{ field: 'combination', message: text }] };
    }
  }
  const body = (await response.json()) as {
    data?: { valid: boolean; errors?: Array<{ field: string; message: string }> };
  };
  return body.data ?? { valid: true };
}

export async function generateProject(
  options: GenerateOptions,
  outputPath: string
): Promise<string> {
  const params = new URLSearchParams();

  params.set('projectName', options.projectName);
  params.set('testingType', options.testingType);
  params.set('framework', options.framework);
  params.set('language', options.language);

  if (options.testRunner) params.set('testRunner', options.testRunner);
  if (options.buildTool) params.set('buildTool', options.buildTool);
  if (options.testingPattern) params.set('testingPattern', options.testingPattern);
  if (options.cicdTool) params.set('cicdTool', options.cicdTool);
  if (options.reportingTool) params.set('reportingTool', options.reportingTool);
  if (options.utilities && options.utilities.length > 0) {
    params.set('utilities', options.utilities.join(','));
  }
  if (options.includeSampleTests !== undefined) {
    params.set('includeSampleTests', String(options.includeSampleTests));
  }

  const url = `${getApiUrl()}/api/v1/generate?${params.toString()}`;
  const response = await fetch(url, { headers: clientHeaders() });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to generate project: ${errorText}`);
  }

  const contentDisposition = response.headers.get('content-disposition');
  let filename = `${options.projectName}.zip`;
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?([^"]+)"?/);
    if (match) filename = match[1];
  }

  const buffer = await response.arrayBuffer();
  const outputFile = path.join(outputPath, filename);

  fs.mkdirSync(outputPath, { recursive: true });
  fs.writeFileSync(outputFile, Buffer.from(buffer));

  return outputFile;
}
