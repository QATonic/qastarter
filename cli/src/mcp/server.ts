/**
 * QAStarter MCP server.
 *
 * Exposes the QAStarter scaffold engine to MCP-aware AI clients (Claude Desktop,
 * Cursor, Claude Code, Windsurf, etc.) over stdio. Under the hood it calls the
 * QAStarter REST API (default: https://qastarter.qatonic.com) — override with
 * the QASTARTER_API_URL environment variable to target a local dev server.
 *
 * Design principles:
 *   - Discovery first. `list_combinations` + `validate_combination` let the AI
 *     choose sensible defaults before it asks to generate anything.
 *   - Preview before write. `preview_project` returns the file tree and key
 *     files so the AI (and the user) can sanity-check before files land on disk.
 *   - Safe file writes. `generate_project` refuses absolute paths unless
 *     explicitly allowed, refuses non-empty target directories unless `force`
 *     is set, and never writes outside the resolved target dir.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import {
  fetchBom,
  fetchMetadata,
  generateProjectBuffer,
  getApiUrl,
  getProjectDependencies,
  previewProject,
  validateConfig,
  type GenerateOptions,
} from '../lib/api.js';

// ---------- helpers ----------

const SERVER_NAME = 'qastarter';
const SERVER_VERSION = '1.0.0';

/** Minimum fields the generator requires. */
interface BaseConfig {
  projectName: string;
  testingType: string;
  framework: string;
  language: string;
}

function asText(payload: unknown): { content: Array<{ type: 'text'; text: string }> } {
  return {
    content: [
      {
        type: 'text',
        text: typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2),
      },
    ],
  };
}

function asError(message: string): {
  content: Array<{ type: 'text'; text: string }>;
  isError: true;
} {
  return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
}

/** Coerce a caller-supplied args object into a GenerateOptions. */
function toGenerateOptions(args: Record<string, unknown> | undefined): GenerateOptions {
  const a = args ?? {};
  const required = ['projectName', 'testingType', 'framework', 'language'] as const;
  for (const key of required) {
    if (typeof a[key] !== 'string' || !a[key]) {
      throw new Error(`Missing required field: ${key}`);
    }
  }
  return {
    projectName: String(a.projectName),
    testingType: String(a.testingType),
    framework: String(a.framework),
    language: String(a.language),
    testRunner: typeof a.testRunner === 'string' ? a.testRunner : undefined,
    buildTool: typeof a.buildTool === 'string' ? a.buildTool : undefined,
    testingPattern: typeof a.testingPattern === 'string' ? a.testingPattern : undefined,
    cicdTool: typeof a.cicdTool === 'string' ? a.cicdTool : undefined,
    reportingTool: typeof a.reportingTool === 'string' ? a.reportingTool : undefined,
    utilities: Array.isArray(a.utilities) ? (a.utilities as unknown[]).map(String) : undefined,
    includeSampleTests:
      typeof a.includeSampleTests === 'boolean' ? a.includeSampleTests : undefined,
  };
}

/**
 * Resolve and sanity-check a target directory.
 *  - Relative paths resolve against process.cwd().
 *  - Absolute paths are rejected unless `allowAbsolute=true`.
 *  - Paths that escape cwd (via `..`) are always rejected.
 */
function resolveTargetDir(input: string, allowAbsolute: boolean): string {
  if (!input || typeof input !== 'string') {
    throw new Error('targetDir must be a non-empty string');
  }
  const isAbsolute = path.isAbsolute(input);
  if (isAbsolute && !allowAbsolute) {
    throw new Error(
      `targetDir "${input}" is absolute; pass allowAbsolute: true to opt in, or use a relative path.`
    );
  }
  const resolved = path.resolve(process.cwd(), input);
  if (!isAbsolute) {
    // Guard against ../.. traversal even for "relative" inputs.
    const relFromCwd = path.relative(process.cwd(), resolved);
    if (relFromCwd.startsWith('..') || path.isAbsolute(relFromCwd)) {
      throw new Error(`targetDir "${input}" escapes the current working directory.`);
    }
  }
  return resolved;
}

/** Extract a ZIP buffer into a target directory safely. */
function extractZipSafely(buffer: Buffer, targetDir: string): string[] {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();
  const written: string[] = [];

  for (const entry of entries) {
    // Reject any entry that tries to break out of targetDir (ZipSlip guard).
    const entryPath = path.resolve(targetDir, entry.entryName);
    const rel = path.relative(targetDir, entryPath);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      throw new Error(`Unsafe zip entry: ${entry.entryName}`);
    }
    if (entry.isDirectory) {
      fs.mkdirSync(entryPath, { recursive: true });
      continue;
    }
    fs.mkdirSync(path.dirname(entryPath), { recursive: true });
    fs.writeFileSync(entryPath, entry.getData());
    written.push(path.relative(targetDir, entryPath));
  }
  return written;
}

// ---------- tool registry ----------

interface ToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown> | undefined) => Promise<ReturnType<typeof asText>>;
}

const PROJECT_CONFIG_PROPS = {
  projectName: {
    type: 'string',
    description: 'Project / output folder name (will be sanitised — letters, digits, hyphen).',
  },
  testingType: {
    type: 'string',
    enum: ['web', 'mobile', 'api', 'desktop', 'performance'],
    description: 'Which layer of the stack you are testing.',
  },
  framework: {
    type: 'string',
    description:
      'Automation framework: selenium, playwright, cypress, webdriverio, robotframework, appium, espresso, xcuitest, flutter, winappdriver, pyautogui, restassured, requests, supertest, restsharp, graphql, grpc, resty, k6, gatling, locust.',
  },
  language: {
    type: 'string',
    enum: ['java', 'python', 'csharp', 'javascript', 'typescript', 'go', 'kotlin', 'swift', 'dart'],
    description: 'Programming language for the generated project.',
  },
  testRunner: {
    type: 'string',
    description:
      'Optional: testng, junit5, pytest, jest, mocha, cypress, nunit, xctest, testify, flutter-test, robot.',
  },
  buildTool: {
    type: 'string',
    description: 'Optional: maven, gradle, npm, pip, nuget, mod, spm, pub.',
  },
  testingPattern: {
    type: 'string',
    enum: ['page-object-model', 'bdd', 'fluent'],
    description: 'Structural pattern. Default: page-object-model.',
  },
  cicdTool: {
    type: 'string',
    description:
      'Optional: github-actions, gitlab-ci, jenkins, azure-devops, circleci. Drops a pipeline file.',
  },
  reportingTool: {
    type: 'string',
    description: 'Optional: allure, extent-reports, mocha-awesome, pytest-html.',
  },
  utilities: {
    type: 'array',
    items: { type: 'string' },
    description:
      'Optional utilities: configReader, jsonReader, screenshotUtility, logger, dataProvider.',
  },
  includeSampleTests: {
    type: 'boolean',
    description: 'Include sample test files (default true).',
  },
} as const;

const TOOLS: ToolDef[] = [
  {
    name: 'list_combinations',
    description:
      'List every testing type, framework, language, runner, build tool and utility QAStarter supports. Call this FIRST before picking a combo — the result tells you what values are valid for `generate_project` and the other tools.',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const metadata = await fetchMetadata();
      return asText({
        apiUrl: getApiUrl(),
        ...metadata,
      });
    },
  },
  {
    name: 'validate_combination',
    description:
      'Check whether a (testingType, framework, language, runner, buildTool) combination is supported. Returns `{ valid: true }` or `{ valid: false, errors: [...] }`. Use this before calling `generate_project` to avoid 400 errors.',
    inputSchema: {
      type: 'object',
      required: ['projectName', 'testingType', 'framework', 'language'],
      properties: PROJECT_CONFIG_PROPS,
    },
    handler: async (args) => {
      const options = toGenerateOptions(args);
      const result = await validateConfig(options);
      return asText(result);
    },
  },
  {
    name: 'get_bom',
    description:
      'Return the QAStarter Bill-of-Materials: pinned library/tool versions per language so you can compare with a project already on disk before suggesting an upgrade.',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const bom = await fetchBom();
      return asText(bom ?? { error: 'BOM service unavailable' });
    },
  },
  {
    name: 'get_dependencies',
    description:
      'Resolve the exact dependency map (with versions) that would be added to the generated project, given a full config. Useful when the user wants to know "what will this add to my classpath / package.json / requirements.txt".',
    inputSchema: {
      type: 'object',
      required: ['projectName', 'testingType', 'framework', 'language'],
      properties: PROJECT_CONFIG_PROPS,
    },
    handler: async (args) => {
      const options = toGenerateOptions(args);
      const deps = await getProjectDependencies(options);
      return asText(deps);
    },
  },
  {
    name: 'preview_project',
    description:
      'Dry-run: generate the project structure server-side and return a file tree, key-file contents and stats, WITHOUT writing anything to disk. Use this to show the user what they would get before calling `generate_project`.',
    inputSchema: {
      type: 'object',
      required: ['projectName', 'testingType', 'framework', 'language'],
      properties: PROJECT_CONFIG_PROPS,
    },
    handler: async (args) => {
      const options = toGenerateOptions(args);
      const preview = await previewProject(options);
      return asText(preview);
    },
  },
  {
    name: 'generate_project',
    description:
      'Generate a full project and write the files directly into `targetDir`. By default the targetDir must be inside the current working directory and must not exist (or be empty). Returns the list of files written. For a dry run without touching disk, use `preview_project` instead.',
    inputSchema: {
      type: 'object',
      required: ['projectName', 'testingType', 'framework', 'language', 'targetDir'],
      properties: {
        ...PROJECT_CONFIG_PROPS,
        targetDir: {
          type: 'string',
          description:
            'Directory to create the project in. Relative paths are resolved against the current working directory.',
        },
        force: {
          type: 'boolean',
          description: 'Overwrite files if targetDir already exists and is non-empty.',
        },
        allowAbsolute: {
          type: 'boolean',
          description:
            'Permit absolute targetDir paths (default false — only cwd-relative paths allowed).',
        },
      },
    },
    handler: async (args) => {
      const a = args ?? {};
      const options = toGenerateOptions(a);
      const targetDirInput = typeof a.targetDir === 'string' ? a.targetDir : '';
      const allowAbsolute = a.allowAbsolute === true;
      const force = a.force === true;
      const targetDir = resolveTargetDir(targetDirInput, allowAbsolute);

      if (fs.existsSync(targetDir)) {
        const contents = fs.readdirSync(targetDir);
        if (contents.length > 0 && !force) {
          return asError(
            `targetDir "${targetDir}" is not empty. Pass force: true to overwrite, or pick an empty directory.`
          );
        }
      } else {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const { buffer, filename } = await generateProjectBuffer(options);
      const files = extractZipSafely(buffer, targetDir);

      return asText({
        ok: true,
        targetDir,
        filenameHint: filename,
        fileCount: files.length,
        files: files.slice(0, 100),
        truncated: files.length > 100,
        nextSteps: [
          `cd "${targetDir}"`,
          'open README.md for language-specific setup instructions',
        ],
      });
    },
  },
];

// ---------- server wiring ----------

export async function runMcpServer(): Promise<void> {
  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {}, resources: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = TOOLS.find((t) => t.name === request.params.name);
    if (!tool) {
      return asError(`Unknown tool: ${request.params.name}`);
    }
    try {
      return await tool.handler(request.params.arguments as Record<string, unknown> | undefined);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return asError(message);
    }
  });

  // Resources: expose metadata + BOM as read-only resources.
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [
      {
        uri: 'qastarter://compatibility-matrix',
        name: 'Compatibility matrix',
        description: 'Every supported (testingType, framework, language, runner, buildTool) combo.',
        mimeType: 'application/json',
      },
      {
        uri: 'qastarter://bom',
        name: 'Bill of Materials',
        description: 'Pinned library and tool versions per language.',
        mimeType: 'application/json',
      },
    ],
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    if (uri === 'qastarter://compatibility-matrix') {
      const metadata = await fetchMetadata();
      return {
        contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(metadata, null, 2) }],
      };
    }
    if (uri === 'qastarter://bom') {
      const bom = await fetchBom();
      return {
        contents: [
          { uri, mimeType: 'application/json', text: JSON.stringify(bom ?? {}, null, 2) },
        ],
      };
    }
    throw new Error(`Unknown resource: ${uri}`);
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // stdio is our transport — log via stderr only, stdout is protocol-owned.
  process.stderr.write(
    `[qastarter-mcp] ready — ${TOOLS.length} tools, API=${getApiUrl()}\n`
  );
}
