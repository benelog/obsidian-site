import { describe, it, expect } from 'vitest';
import { buildSiteModel, renderSite } from '../src/site.js';
import type { Templates } from '../src/theme.js';
import type { PageInfo, SiteConfig } from '../src/types.js';

function pages(entries: Record<string, string>): Map<string, PageInfo> {
  const map = new Map<string, PageInfo>();
  for (const [stem, content] of Object.entries(entries)) {
    map.set(stem, { path: `${stem}.md`, title: stem, content, tags: [] });
  }
  return map;
}

const config: SiteConfig = {
  title: 'Site',
  subtitle: '',
  lang: 'en',
  'content-directory': 'content',
  'output-directory': 'public',
};

const templates: Templates = {
  'page.html': 'PAGE {title} {body}',
  'index.html': 'INDEX {title} {page_count}',
  'tags.html': 'TAGS {tag_count}',
};

describe('buildSiteModel', () => {
  it('derives backlinks and graph from pages', () => {
    const model = buildSiteModel(pages({ a: '[[b]]', b: '' }), config);
    expect(model.backlinks.get('b')).toEqual(['a']);
    expect(model.graph.links).toEqual([{ source: 'a', target: 'b' }]);
    expect(model.config).toBe(config);
  });
});

describe('renderSite', () => {
  it('produces one HTML file per page plus index, tags and styles', () => {
    const model = buildSiteModel(pages({ a: 'Hello', b: '' }), config);
    const files = renderSite(model, templates, new Map([['style.css', 'body{}']]));

    expect([...files.keys()].sort()).toEqual(['a.html', 'b.html', 'index.html', 'style.css', 'tags.html']);
    expect(files.get('a.html')).toContain('PAGE a');
    expect(files.get('a.html')).toContain('<p>Hello</p>');
    expect(files.get('index.html')).toBe('INDEX Site 2');
    expect(files.get('tags.html')).toBe('TAGS 0');
    expect(files.get('style.css')).toBe('body{}');
  });

  it('includes every stylesheet it is given', () => {
    const model = buildSiteModel(pages({}), config);
    const styles = new Map([['a.css', '/*a*/'], ['b.css', '/*b*/']]);
    const files = renderSite(model, templates, styles);
    expect(files.get('a.css')).toBe('/*a*/');
    expect(files.get('b.css')).toBe('/*b*/');
  });
});
