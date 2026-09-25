import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { loadTemplates, loadStyles, initTheme, LAYOUT_FILES, PACKAGE_DIR } from '../src/theme.js';

let vault: string;

beforeEach(() => {
  vault = mkdtempSync(join(tmpdir(), 'obsidian-site-theme-'));
});

afterEach(() => {
  rmSync(vault, { recursive: true, force: true });
});

describe('loadTemplates', () => {
  it('loads every built-in layout when the vault has no overrides', () => {
    const templates = loadTemplates(vault);
    for (const name of LAYOUT_FILES) {
      expect(templates[name]).toBe(readFileSync(join(PACKAGE_DIR, 'layouts', name), 'utf-8'));
    }
  });

  it('prefers _layouts/ overrides file by file', () => {
    mkdirSync(join(vault, '_layouts'));
    writeFileSync(join(vault, '_layouts', 'page.html'), 'CUSTOM');
    const templates = loadTemplates(vault);
    expect(templates['page.html']).toBe('CUSTOM');
    expect(templates['index.html']).toContain('<!DOCTYPE html>');
  });
});

describe('loadStyles', () => {
  it('returns the built-in stylesheet when _styles/ is absent', () => {
    const styles = loadStyles(vault);
    expect([...styles.keys()]).toEqual(['style.css']);
    expect(styles.get('style.css')!.length).toBeGreaterThan(0);
  });

  it('returns only .css files from _styles/ when present', () => {
    mkdirSync(join(vault, '_styles'));
    writeFileSync(join(vault, '_styles', 'a.css'), '/*a*/');
    writeFileSync(join(vault, '_styles', 'notes.txt'), 'x');
    const styles = loadStyles(vault);
    expect([...styles.keys()]).toEqual(['a.css']);
    expect(styles.get('a.css')).toBe('/*a*/');
  });
});

describe('initTheme', () => {
  it('copies built-in layouts and styles into the vault', () => {
    const copied = initTheme(vault);
    for (const name of LAYOUT_FILES) {
      expect(existsSync(join(vault, '_layouts', name))).toBe(true);
    }
    expect(existsSync(join(vault, '_styles', 'style.css'))).toBe(true);
    expect(copied).toHaveLength(LAYOUT_FILES.length + 1);
  });

  it('produces files that loadTemplates and loadStyles pick up as overrides', () => {
    initTheme(vault);
    writeFileSync(join(vault, '_layouts', 'page.html'), 'EDITED');
    expect(loadTemplates(vault)['page.html']).toBe('EDITED');
    expect(loadStyles(vault).has('style.css')).toBe(true);
  });
});
