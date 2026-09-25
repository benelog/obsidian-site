import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { resolveStaticFile } from '../src/serve.js';

describe('resolveStaticFile', () => {
  let root: string;

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), 'obsidian-site-serve-'));
    writeFileSync(join(root, 'index.html'), '<html></html>');
    writeFileSync(join(root, 'style.css'), '');
    writeFileSync(join(root, 'My Note.html'), '');
    mkdirSync(join(root, 'sub'));
    writeFileSync(join(root, 'sub', 'data.bin'), '');
  });

  afterAll(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('serves index.html for /', () => {
    expect(resolveStaticFile(root, '/')).toEqual({ path: join(root, 'index.html'), contentType: 'text/html' });
  });

  it('maps extensions to content types', () => {
    expect(resolveStaticFile(root, '/style.css')?.contentType).toBe('text/css');
    expect(resolveStaticFile(root, '/sub/data.bin')?.contentType).toBe('application/octet-stream');
  });

  it('ignores the query string', () => {
    expect(resolveStaticFile(root, '/style.css?v=2')?.path).toBe(join(root, 'style.css'));
  });

  it('decodes percent-encoded paths', () => {
    expect(resolveStaticFile(root, '/My%20Note.html')?.path).toBe(join(root, 'My Note.html'));
  });

  it('returns null for missing files and directories', () => {
    expect(resolveStaticFile(root, '/nope.html')).toBeNull();
    expect(resolveStaticFile(root, '/sub')).toBeNull();
  });

  it('refuses paths that escape the root', () => {
    expect(resolveStaticFile(root, '/../../etc/passwd')).toBeNull();
    expect(resolveStaticFile(root, '/sub/../../' + 'etc/passwd')).toBeNull();
  });

  it('returns null for malformed percent-encoding', () => {
    expect(resolveStaticFile(root, '/%E0%A4%A')).toBeNull();
  });
});
