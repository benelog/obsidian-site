/**
 * Graph and link analysis — pure functions.
 */

import { WIKILINK_RE, type PageInfo } from './types.js';

export interface GraphNode {
  id: string;
  title: string;
  count: number;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphEdge[];
}

export function extractWikilinks(content: string): string[] {
  const links: string[] = [];
  const re = new RegExp(WIKILINK_RE.source, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    links.push(m[1]);
  }
  return links;
}

export function buildGraph(pages: Map<string, PageInfo>): GraphData {
  const linksMap = new Map<string, string[]>();
  for (const [stem, info] of pages) {
    linksMap.set(stem, extractWikilinks(info.content));
  }

  const edgesSet = new Set<string>();
  for (const [src, targets] of linksMap) {
    for (const tgt of targets) {
      if (pages.has(tgt)) {
        const edge = [src, tgt].sort().join('\0');
        edgesSet.add(edge);
      }
    }
  }

  const linkCounts = new Map<string, number>();
  for (const edge of edgesSet) {
    const [a, b] = edge.split('\0');
    linkCounts.set(a, (linkCounts.get(a) || 0) + 1);
    linkCounts.set(b, (linkCounts.get(b) || 0) + 1);
  }

  const nodes: GraphNode[] = [];
  for (const [stem, info] of pages) {
    nodes.push({
      id: stem,
      title: info.title,
      count: linkCounts.get(stem) || 0,
    });
  }

  const edges: GraphEdge[] = [...edgesSet]
    .sort()
    .map(e => {
      const [a, b] = e.split('\0');
      return { source: a, target: b };
    });

  return { nodes, links: edges };
}

export function buildLocalGraph(centerStem: string, fullGraph: GraphData): GraphData {
  // Build adjacency map
  const adj = new Map<string, Set<string>>();
  for (const link of fullGraph.links) {
    if (!adj.has(link.source)) adj.set(link.source, new Set());
    if (!adj.has(link.target)) adj.set(link.target, new Set());
    adj.get(link.source)!.add(link.target);
    adj.get(link.target)!.add(link.source);
  }

  // BFS depth 2
  const visited = new Set<string>();
  const queue: { id: string; depth: number }[] = [{ id: centerStem, depth: 0 }];
  visited.add(centerStem);

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    if (depth >= 2) continue;
    for (const neighbor of adj.get(id) || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ id: neighbor, depth: depth + 1 });
      }
    }
  }

  // Center alone → empty
  if (visited.size <= 1) return { nodes: [], links: [] };

  const nodeSet = visited;
  const nodes = fullGraph.nodes.filter(n => nodeSet.has(n.id));
  const links = fullGraph.links.filter(l => nodeSet.has(l.source) && nodeSet.has(l.target));

  return { nodes, links };
}

export function buildBacklinks(pages: Map<string, PageInfo>): Map<string, string[]> {
  const backlinks = new Map<string, Set<string>>();
  for (const stem of pages.keys()) {
    backlinks.set(stem, new Set());
  }

  for (const [stem, info] of pages) {
    for (const target of extractWikilinks(info.content)) {
      if (backlinks.has(target) && target !== stem) {
        backlinks.get(target)!.add(stem);
      }
    }
  }

  const result = new Map<string, string[]>();
  for (const [stem, sources] of backlinks) {
    result.set(stem, [...sources].sort());
  }
  return result;
}
