import { describe, it, expect } from 'vitest';
import {
  extractTitle,
  downgradeHeadings,
  processWikilinks,
  renderRelated,
  renderBacklinks,
  renderTags,
  extractTags,
  buildTagsPage,
} from '../src/render.js';
import type { PageInfo } from '../src/types.js';

function pages(entries: Record<string, string>, tagMap?: Record<string, string[]>): Map<string, PageInfo> {
  const map = new Map<string, PageInfo>();
  for (const [stem, content] of Object.entries(entries)) {
    map.set(stem, { path: `${stem}.md`, title: stem.replace(/-/g, ' '), content, tags: tagMap?.[stem] || [] });
  }
  return map;
}

describe('extractTitle', () => {
  it('replaces hyphens with spaces', () => {
    expect(extractTitle('spring-boot')).toBe('spring boot');
  });

  it('returns as-is when no hyphens', () => {
    expect(extractTitle('react')).toBe('react');
  });
});

describe('downgradeHeadings', () => {
  it('downgrades h1 to h2', () => {
    expect(downgradeHeadings('<h1>Title</h1>')).toBe('<h2>Title</h2>');
  });

  it('downgrades h2 to h3', () => {
    expect(downgradeHeadings('<h2>Sub</h2>')).toBe('<h3>Sub</h3>');
  });

  it('caps at h6', () => {
    expect(downgradeHeadings('<h5>Deep</h5>')).toBe('<h6>Deep</h6>');
  });

  it('handles multiple headings', () => {
    const input = '<h1>A</h1><h2>B</h2>';
    expect(downgradeHeadings(input)).toBe('<h2>A</h2><h3>B</h3>');
  });

  it('leaves non-heading content unchanged', () => {
    expect(downgradeHeadings('<p>text</p>')).toBe('<p>text</p>');
  });
});

describe('processWikilinks', () => {
  it('converts wikilink to anchor when page exists', () => {
    const p = pages({ foo: '' });
    const result = processWikilinks('[[foo]]', p);
    expect(result).toBe('<a href="foo.html" class="wikilink">foo</a>');
  });

  it('converts wikilink with display text', () => {
    const p = pages({ foo: '' });
    const result = processWikilinks('[[foo|My Foo]]', p);
    expect(result).toBe('<a href="foo.html" class="wikilink">My Foo</a>');
  });

  it('renders broken link for non-existent page', () => {
    const p = pages({});
    const result = processWikilinks('[[missing]]', p);
    expect(result).toBe('<span class="broken-link">missing</span>');
  });

  it('replaces hyphens in default display text', () => {
    const p = pages({ 'my-page': '' });
    const result = processWikilinks('[[my-page]]', p);
    expect(result).toBe('<a href="my-page.html" class="wikilink">my page</a>');
  });
});

describe('renderRelated', () => {
  it('returns empty string for no wikilinks', () => {
    expect(renderRelated([], pages({}))).toBe('');
  });

  it('renders related section with valid links', () => {
    const p = pages({ foo: '', bar: '' });
    const result = renderRelated(['foo', 'bar'], p);
    expect(result).toContain('<section class="related">');
    expect(result).toContain('<a href="bar.html">bar</a>');
    expect(result).toContain('<a href="foo.html">foo</a>');
  });

  it('skips non-existent pages', () => {
    const p = pages({ foo: '' });
    const result = renderRelated(['foo', 'missing'], p);
    expect(result).toContain('foo.html');
    expect(result).not.toContain('missing');
  });

  it('deduplicates links', () => {
    const p = pages({ foo: '' });
    const result = renderRelated(['foo', 'foo'], p);
    const matches = result.match(/foo\.html/g) || [];
    expect(matches).toHaveLength(1);
  });

  it('returns empty string when all links are broken', () => {
    expect(renderRelated(['missing'], pages({}))).toBe('');
  });
});

describe('renderBacklinks', () => {
  it('returns empty string when no backlinks', () => {
    const bl = new Map<string, string[]>([['a', []]]);
    expect(renderBacklinks('a', bl, pages({}))).toBe('');
  });

  it('renders backlinks section', () => {
    const p = pages({ a: '', b: '' });
    const bl = new Map<string, string[]>([['a', ['b']]]);
    const result = renderBacklinks('a', bl, p);
    expect(result).toContain('<section class="backlinks">');
    expect(result).toContain('<a href="b.html">b</a>');
  });

  it('returns empty string for unknown stem', () => {
    const bl = new Map<string, string[]>();
    expect(renderBacklinks('unknown', bl, pages({}))).toBe('');
  });
});

describe('renderTags', () => {
  it('returns empty string for no tags', () => {
    expect(renderTags([])).toBe('');
  });

  it('renders tags with links to tags page', () => {
    const result = renderTags(['programming', 'web']);
    expect(result).toContain('class="page-tags"');
    expect(result).toContain('<a href="tags.html#tag-programming" class="page-tag">#programming</a>');
    expect(result).toContain('<a href="tags.html#tag-web" class="page-tag">#web</a>');
  });

  it('renders single tag', () => {
    const result = renderTags(['solo']);
    expect(result).toContain('class="page-tags"');
    expect(result).toContain('tags.html#tag-solo');
  });
});

describe('extractTags', () => {
  it('collects tags from all pages', () => {
    const p = pages({ foo: '', bar: '' }, { foo: ['a', 'b'], bar: ['b', 'c'] });
    const tagMap = extractTags(p);
    expect(tagMap.get('a')).toEqual(['foo']);
    expect(tagMap.get('b')!.sort()).toEqual(['bar', 'foo']);
    expect(tagMap.get('c')).toEqual(['bar']);
  });

  it('returns empty map when no tags', () => {
    const p = pages({ foo: '' });
    const tagMap = extractTags(p);
    expect(tagMap.size).toBe(0);
  });
});

describe('buildTagsPage', () => {
  const template = '<html lang="{lang}"><title>{title} — {site_title}</title><div>{tag_count}</div><ul>{tag_list}</ul><div>{tag_sections}</div></html>';
  const config = { title: 'Test', subtitle: '', lang: 'en', 'content-directory': 'content', 'output-directory': 'public' };

  it('renders tag list with counts', () => {
    const p = pages({ foo: '', bar: '' }, { foo: ['web'], bar: ['web', 'dev'] });
    const html = buildTagsPage(p, template, config);
    expect(html).toContain('Tags');
    expect(html).toContain('web');
    expect(html).toContain('dev');
    expect(html).toContain('(2)'); // web: 2 pages
    expect(html).toContain('(1)'); // dev: 1 page
  });

  it('renders tag sections with page links', () => {
    const p = pages({ foo: '', bar: '' }, { foo: ['web'], bar: ['web'] });
    const html = buildTagsPage(p, template, config);
    expect(html).toContain('id="tag-web"');
    expect(html).toContain('foo.html');
    expect(html).toContain('bar.html');
  });

  it('sorts tags alphabetically', () => {
    const p = pages({ a: '' }, { a: ['zoo', 'alpha'] });
    const html = buildTagsPage(p, template, config);
    const alphaPos = html.indexOf('alpha');
    const zooPos = html.indexOf('zoo');
    expect(alphaPos).toBeLessThan(zooPos);
  });

  it('handles no tags gracefully', () => {
    const p = pages({ foo: '' });
    const html = buildTagsPage(p, template, config);
    expect(html).not.toContain('{title}'); // title replaced
    expect(html).toContain('0'); // tag_count = 0
  });
});
