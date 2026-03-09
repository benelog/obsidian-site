import { describe, it, expect } from 'vitest';
import { extractWikilinks, buildGraph, buildBacklinks, buildLocalGraph } from '../src/graph.js';
import type { PageInfo } from '../src/types.js';

function pages(entries: Record<string, string>): Map<string, PageInfo> {
  const map = new Map<string, PageInfo>();
  for (const [stem, content] of Object.entries(entries)) {
    map.set(stem, { path: `${stem}.md`, title: stem.replace(/-/g, ' '), content });
  }
  return map;
}

describe('extractWikilinks', () => {
  it('extracts simple wikilinks', () => {
    expect(extractWikilinks('see [[foo]] and [[bar]]')).toEqual(['foo', 'bar']);
  });

  it('extracts wikilinks with display text', () => {
    expect(extractWikilinks('see [[foo|Foo Page]]')).toEqual(['foo']);
  });

  it('returns empty array for no wikilinks', () => {
    expect(extractWikilinks('plain text')).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(extractWikilinks('')).toEqual([]);
  });

  it('handles multiple wikilinks on one line', () => {
    expect(extractWikilinks('[[a]] [[b]] [[c]]')).toEqual(['a', 'b', 'c']);
  });
});

describe('buildGraph', () => {
  it('creates nodes for all pages', () => {
    const p = pages({ alpha: '', beta: '' });
    const graph = buildGraph(p);
    expect(graph.nodes.map(n => n.id).sort()).toEqual(['alpha', 'beta']);
  });

  it('creates edges for mutual links', () => {
    const p = pages({ a: '[[b]]', b: '[[a]]' });
    const graph = buildGraph(p);
    expect(graph.links).toEqual([{ source: 'a', target: 'b' }]);
  });

  it('deduplicates bidirectional edges', () => {
    const p = pages({ x: '[[y]]', y: '[[x]]' });
    const graph = buildGraph(p);
    expect(graph.links).toHaveLength(1);
  });

  it('ignores links to non-existent pages', () => {
    const p = pages({ a: '[[missing]]' });
    const graph = buildGraph(p);
    expect(graph.links).toEqual([]);
  });

  it('counts links correctly', () => {
    const p = pages({ a: '[[b]] [[c]]', b: '', c: '[[a]]' });
    const graph = buildGraph(p);
    const nodeA = graph.nodes.find(n => n.id === 'a')!;
    expect(nodeA.count).toBe(2);
  });

  it('uses stem as title with hyphens replaced by spaces', () => {
    const p = pages({ 'my-page': '' });
    const graph = buildGraph(p);
    expect(graph.nodes[0].title).toBe('my page');
  });
});

describe('buildLocalGraph', () => {
  it('returns nodes within depth 2 from center', () => {
    // a - b - c - d (linear chain)
    const p = pages({ a: '[[b]]', b: '[[c]]', c: '[[d]]', d: '' });
    const full = buildGraph(p);
    const local = buildLocalGraph('a', full);
    const ids = local.nodes.map(n => n.id).sort();
    // depth 0: a, depth 1: b, depth 2: c — d is depth 3, excluded
    expect(ids).toEqual(['a', 'b', 'c']);
  });

  it('returns empty when center has no connections', () => {
    const p = pages({ a: '', b: '[[c]]', c: '' });
    const full = buildGraph(p);
    const local = buildLocalGraph('a', full);
    expect(local).toEqual({ nodes: [], links: [] });
  });

  it('includes edges between collected nodes only', () => {
    // a - b - c, b - d
    const p = pages({ a: '[[b]]', b: '[[c]] [[d]]', c: '', d: '' });
    const full = buildGraph(p);
    const local = buildLocalGraph('a', full);
    const ids = local.nodes.map(n => n.id).sort();
    expect(ids).toEqual(['a', 'b', 'c', 'd']);
    // All edges among a,b,c,d should be included
    expect(local.links.length).toBe(3); // a-b, b-c, b-d
  });

  it('does not include nodes beyond depth 2', () => {
    // a - b - c - d - e
    const p = pages({ a: '[[b]]', b: '[[c]]', c: '[[d]]', d: '[[e]]', e: '' });
    const full = buildGraph(p);
    const local = buildLocalGraph('a', full);
    const ids = local.nodes.map(n => n.id).sort();
    expect(ids).toEqual(['a', 'b', 'c']);
    expect(local.links.length).toBe(2); // a-b, b-c
  });
});

describe('buildBacklinks', () => {
  it('builds reverse links', () => {
    const p = pages({ a: '[[b]]', b: '' });
    const bl = buildBacklinks(p);
    expect(bl.get('b')).toEqual(['a']);
    expect(bl.get('a')).toEqual([]);
  });

  it('excludes self-links', () => {
    const p = pages({ a: '[[a]]' });
    const bl = buildBacklinks(p);
    expect(bl.get('a')).toEqual([]);
  });

  it('ignores links to non-existent pages', () => {
    const p = pages({ a: '[[missing]]' });
    const bl = buildBacklinks(p);
    expect(bl.has('missing')).toBe(false);
  });

  it('sorts backlinks alphabetically', () => {
    const p = pages({ c: '[[a]]', b: '[[a]]', a: '' });
    const bl = buildBacklinks(p);
    expect(bl.get('a')).toEqual(['b', 'c']);
  });
});
