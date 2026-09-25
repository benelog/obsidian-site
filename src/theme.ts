/**
 * Theme resolution: HTML layouts and CSS come from the package by default,
 * and a vault can override them with `_layouts/` and `_styles/` directories.
 */

import { readFileSync, readdirSync, existsSync, mkdirSync, copyFileSync } from 'fs';
import { resolve, join, extname } from 'path';
import { fileURLToPath } from 'url';

/** Root of the installed package, where `layouts/` and `styles/` live. */
export const PACKAGE_DIR = resolve(fileURLToPath(import.meta.url), '..', '..');

export const LAYOUT_FILES = ['page.html', 'page-graph.html', 'index.html', 'tags.html'] as const;
export type LayoutName = (typeof LAYOUT_FILES)[number];
export type Templates = Record<LayoutName, string>;

export const BUILTIN_STYLE = 'style.css';

/** Vault-relative directories that override the built-in theme. */
export const USER_LAYOUTS_DIR = '_layouts';
export const USER_STYLES_DIR = '_styles';

function resolveTemplate(source: string, name: LayoutName): string {
  const userPath = join(source, USER_LAYOUTS_DIR, name);
  const builtinPath = join(PACKAGE_DIR, 'layouts', name);
  return readFileSync(existsSync(userPath) ? userPath : builtinPath, 'utf-8');
}

/** Load every layout, preferring the vault's `_layouts/` copy file by file. */
export function loadTemplates(source: string): Templates {
  const templates = {} as Templates;
  for (const name of LAYOUT_FILES) {
    templates[name] = resolveTemplate(source, name);
  }
  return templates;
}

/**
 * CSS files to ship with the site, keyed by output filename.
 * If the vault has a `_styles/` directory, every `.css` in it replaces the
 * built-in stylesheet entirely.
 */
export function loadStyles(source: string): Map<string, string> {
  const styles = new Map<string, string>();
  const userDir = join(source, USER_STYLES_DIR);

  if (existsSync(userDir)) {
    for (const file of readdirSync(userDir)) {
      if (extname(file) === '.css') {
        styles.set(file, readFileSync(join(userDir, file), 'utf-8'));
      }
    }
  } else {
    styles.set(BUILTIN_STYLE, readFileSync(join(PACKAGE_DIR, 'styles', BUILTIN_STYLE), 'utf-8'));
  }

  return styles;
}

/**
 * Copy the built-in layouts and stylesheet into the vault's `_layouts/` and
 * `_styles/` so they can be customized. Returns the destination paths.
 */
export function initTheme(source: string): string[] {
  const layoutsDir = join(source, USER_LAYOUTS_DIR);
  const stylesDir = join(source, USER_STYLES_DIR);
  mkdirSync(layoutsDir, { recursive: true });
  mkdirSync(stylesDir, { recursive: true });

  const copied: string[] = [];
  for (const name of LAYOUT_FILES) {
    const dest = join(layoutsDir, name);
    copyFileSync(join(PACKAGE_DIR, 'layouts', name), dest);
    copied.push(dest);
  }
  const styleDest = join(stylesDir, BUILTIN_STYLE);
  copyFileSync(join(PACKAGE_DIR, 'styles', BUILTIN_STYLE), styleDest);
  copied.push(styleDest);
  return copied;
}
