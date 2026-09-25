/**
 * Build orchestration: scan the vault, render in memory, write to disk.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { resolve, join, basename, extname } from 'path';

import { loadConfig } from './config.js';
import { parseNote } from './note.js';
import { buildSiteModel, renderSite, type SiteFiles } from './site.js';
import { loadTemplates, loadStyles } from './theme.js';
import type { PageInfo, SiteConfig } from './types.js';

export interface BuildOptions {
  source: string;
  /** Overrides `output-directory` from site.yaml. */
  output?: string;
}

export interface BuildResult {
  source: string;
  output: string;
  config: SiteConfig;
  pageCount: number;
  nodeCount: number;
  edgeCount: number;
}

/**
 * Read every `.md` under the content directory (or the vault root if the
 * content directory does not exist), keyed by filename stem.
 */
export function scanVault(source: string, contentDirectory: string): Map<string, PageInfo> {
  const contentDir = join(source, contentDirectory);
  const scanDir = existsSync(contentDir) ? contentDir : source;
  const pages = new Map<string, PageInfo>();

  const files = readdirSync(scanDir, { recursive: true })
    .map(f => String(f))
    .filter(f => extname(f) === '.md')
    .sort();

  for (const file of files) {
    const stem = basename(file, '.md');
    const filePath = join(scanDir, file);
    const raw = readFileSync(filePath, 'utf-8');
    pages.set(stem, { path: filePath, ...parseNote(stem, raw) });
  }
  return pages;
}

export function writeSite(files: SiteFiles, output: string): void {
  mkdirSync(output, { recursive: true });
  for (const [name, content] of files) {
    writeFileSync(join(output, name), content, 'utf-8');
  }
}

export function build(options: BuildOptions): BuildResult {
  const source = resolve(options.source);
  const config = loadConfig(source);
  if (options.output) {
    config['output-directory'] = options.output;
  }
  const output = resolve(source, config['output-directory']);

  const pages = scanVault(source, config['content-directory']);
  const model = buildSiteModel(pages, config);
  const files = renderSite(model, loadTemplates(source), loadStyles(source));
  writeSite(files, output);

  return {
    source,
    output,
    config,
    pageCount: pages.size,
    nodeCount: model.graph.nodes.length,
    edgeCount: model.graph.links.length,
  };
}
