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

const DEFAULT_API_URL = 'https://qastarter.replit.app';

export function getApiUrl(): string {
  return process.env.QASTARTER_API_URL || DEFAULT_API_URL;
}

function transformMetadata(raw: RawMetadataResponse): MetadataResponse {
  const testingTypeMap = new Map<string, string[]>();
  raw.data.testingTypes.forEach(tt => {
    testingTypeMap.set(tt.id, tt.frameworks);
  });

  const frameworks: Record<string, { languages: string[]; testingTypes: string[] }> = {};
  raw.data.frameworks.forEach(f => {
    const testingTypes: string[] = [];
    testingTypeMap.forEach((fws, ttId) => {
      if (fws.includes(f.id)) {
        testingTypes.push(ttId);
      }
    });
    frameworks[f.id] = {
      languages: f.languages,
      testingTypes
    };
  });

  const testRunners: Record<string, string[]> = {};
  const buildTools: Record<string, string[]> = {};
  raw.data.languages.forEach(l => {
    testRunners[l.id] = l.testRunners;
    buildTools[l.id] = l.buildTools;
  });

  return {
    testingTypes: raw.data.testingTypes.map(t => t.id),
    frameworks,
    languages: raw.data.languages.map(l => l.id),
    testRunners,
    buildTools,
    testingPatterns: raw.data.testingPatterns.map(p => p.id),
    cicdTools: raw.data.cicdTools.map(c => c.id),
    reportingTools: raw.data.reportingTools.map(r => r.id),
    utilities: raw.data.utilities.map(u => u.id)
  };
}

export async function fetchMetadata(): Promise<MetadataResponse> {
  const response = await fetch(`${getApiUrl()}/api/v1/metadata`);
  if (!response.ok) {
    throw new Error(`Failed to fetch metadata: ${response.statusText}`);
  }
  const raw: RawMetadataResponse = await response.json();
  return transformMetadata(raw);
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
  const response = await fetch(url);

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
