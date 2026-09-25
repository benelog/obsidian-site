import { extractTitle } from '../src/note.js';
import type { PageInfo, SiteConfig } from '../src/types.js';

/**
 * Build a pages map from `{ stem: content }`, with optional per-stem tags.
 * Titles follow the same stem → title rule as the real scanner.
 */
export function pages(entries: Record<string, string>, tagMap?: Record<string, string[]>): Map<string, PageInfo> {
  const map = new Map<string, PageInfo>();
  for (const [stem, content] of Object.entries(entries)) {
    map.set(stem, { path: `${stem}.md`, title: extractTitle(stem), content, tags: tagMap?.[stem] || [] });
  }
  return map;
}

export function testConfig(overrides: Partial<SiteConfig> = {}): SiteConfig {
  return {
    title: 'Test',
    subtitle: '',
    lang: 'en',
    'content-directory': 'content',
    'output-directory': 'public',
    ...overrides,
  };
}
