import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { extractZipSafely, resolveTargetDir } from './server';

let fixture: string;
beforeEach(() => {
  fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'qastarter-mcp-'));
});
afterEach(() => {
  vi.restoreAllMocks();
  const resolved = path.resolve(fixture);
  if (
    path.dirname(resolved) !== path.resolve(os.tmpdir()) ||
    !path.basename(resolved).startsWith('qastarter-mcp-')
  ) {
    throw new Error('Refusing to remove an unexpected fixture directory');
  }
  fs.rmSync(resolved, { recursive: true, force: true });
});
const zipWith = (name: string, text = 'generated') => {
  const zip = new AdmZip();
  zip.addFile(name, Buffer.from(text));
  return zip.toBuffer();
};

describe('MCP project extraction', () => {
  it('preserves executable launchers and replaces existing files', () => {
    const target = path.join(fixture, 'project');
    extractZipSafely(zipWith('gradlew', '#!/bin/sh\n'), target);
    expect(fs.readFileSync(path.join(target, 'gradlew'), 'utf8')).toBe('#!/bin/sh\n');
    if (process.platform !== 'win32')
      expect(fs.statSync(path.join(target, 'gradlew')).mode & 0o111).not.toBe(0);
    extractZipSafely(zipWith('gradlew', 'updated'), target);
    expect(fs.readFileSync(path.join(target, 'gradlew'), 'utf8')).toBe('updated');
  });

  it('rejects pre-existing directory links before touching outside files', () => {
    const target = path.join(fixture, 'project');
    const outside = path.join(fixture, 'outside');
    fs.mkdirSync(target);
    fs.mkdirSync(outside);
    fs.writeFileSync(path.join(outside, 'keep.txt'), 'original');
    fs.symlinkSync(
      outside,
      path.join(target, 'linked'),
      process.platform === 'win32' ? 'junction' : 'dir'
    );
    expect(() => extractZipSafely(zipWith('linked/keep.txt'), target)).toThrow('Unsafe');
    expect(fs.readFileSync(path.join(outside, 'keep.txt'), 'utf8')).toBe('original');
  });

  it('rejects an apparently relative target that escapes through a parent link', () => {
    const cwd = path.join(fixture, 'cwd'),
      outside = path.join(fixture, 'outside');
    fs.mkdirSync(cwd);
    fs.mkdirSync(outside);
    fs.symlinkSync(
      outside,
      path.join(cwd, 'linked'),
      process.platform === 'win32' ? 'junction' : 'dir'
    );
    vi.spyOn(process, 'cwd').mockReturnValue(cwd);
    expect(() => resolveTargetDir('linked/new-project', false)).toThrow('outside');
  });
});
