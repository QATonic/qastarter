/**
 * CodeHighlight — lightweight syntax-highlighted code viewer.
 *
 * Uses highlight.js with a curated set of languages that match
 * QAStarter's generated project types. Auto-detects the language
 * from the file extension and falls back to plaintext.
 */

import { useMemo } from 'react';
import hljs from 'highlight.js/lib/core';

// Register only the languages QAStarter projects use (keeps bundle small)
import java from 'highlight.js/lib/languages/java';
import kotlin from 'highlight.js/lib/languages/kotlin';
import python from 'highlight.js/lib/languages/python';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import csharp from 'highlight.js/lib/languages/csharp';
import swift from 'highlight.js/lib/languages/swift';
import go from 'highlight.js/lib/languages/go';
import dart from 'highlight.js/lib/languages/dart';
import xml from 'highlight.js/lib/languages/xml';
import json from 'highlight.js/lib/languages/json';
import yaml from 'highlight.js/lib/languages/yaml';
import bash from 'highlight.js/lib/languages/bash';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import properties from 'highlight.js/lib/languages/properties';
import gradle from 'highlight.js/lib/languages/gradle';
import css from 'highlight.js/lib/languages/css';
import markdown from 'highlight.js/lib/languages/markdown';
import ini from 'highlight.js/lib/languages/ini';

hljs.registerLanguage('java', java);
hljs.registerLanguage('kotlin', kotlin);
hljs.registerLanguage('python', python);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('swift', swift);
hljs.registerLanguage('go', go);
hljs.registerLanguage('dart', dart);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('json', json);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('dockerfile', dockerfile);
hljs.registerLanguage('properties', properties);
hljs.registerLanguage('gradle', gradle);
hljs.registerLanguage('css', css);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('ini', ini);

/** Map file extension to highlight.js language name. */
const EXT_TO_LANG: Record<string, string> = {
  java: 'java',
  kt: 'kotlin',
  kts: 'kotlin',
  py: 'python',
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  cs: 'csharp',
  csproj: 'xml',
  sln: 'xml',
  swift: 'swift',
  go: 'go',
  dart: 'dart',
  xml: 'xml',
  html: 'xml',
  htm: 'xml',
  pom: 'xml',
  json: 'json',
  yml: 'yaml',
  yaml: 'yaml',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  bat: 'bash',
  cmd: 'bash',
  dockerfile: 'dockerfile',
  properties: 'properties',
  cfg: 'ini',
  ini: 'ini',
  toml: 'ini',
  env: 'ini',
  gradle: 'gradle',
  css: 'css',
  scss: 'css',
  md: 'markdown',
  txt: 'plaintext',
  gitignore: 'ini',
  dockerignore: 'ini',
  editorconfig: 'ini',
};

function getLangFromFilename(filename: string): string | undefined {
  const lower = filename.toLowerCase();

  // Special filenames (no extension)
  if (lower === 'dockerfile') return 'dockerfile';
  if (lower === 'jenkinsfile') return 'gradle'; // Groovy-like
  if (lower === 'makefile') return 'bash';
  if (lower === 'gemfile') return 'ruby';

  const ext = lower.split('.').pop();
  if (!ext) return undefined;
  return EXT_TO_LANG[ext];
}

interface CodeHighlightProps {
  /** The source code text to highlight. */
  code: string;
  /** Filename used to auto-detect language (e.g. "LoginTest.java"). */
  filename?: string;
}

export default function CodeHighlight({ code, filename }: CodeHighlightProps) {
  const html = useMemo(() => {
    if (!code) return '';

    const lang = filename ? getLangFromFilename(filename) : undefined;

    try {
      if (lang && lang !== 'plaintext' && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      // Auto-detect if no language mapped
      const result = hljs.highlightAuto(code);
      return result.value;
    } catch {
      // If highlighting fails, return escaped plaintext
      return code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }
  }, [code, filename]);

  return (
    <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed hljs-preview">
      <code dangerouslySetInnerHTML={{ __html: html }} />
    </pre>
  );
}
