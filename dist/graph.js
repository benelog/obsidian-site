/**
 * Graph and link analysis — pure functions.
 */
import { WIKILINK_RE } from './types.js';
export function extractWikilinks(content) {
    const links = [];
    const re = new RegExp(WIKILINK_RE.source, 'g');
    let m;
    while ((m = re.exec(content)) !== null) {
        links.push(m[1]);
    }
    return links;
}
export function buildGraph(pages) {
    const linksMap = new Map();
    for (const [stem, info] of pages) {
        linksMap.set(stem, extractWikilinks(info.content));
    }
    const edgesSet = new Set();
    for (const [src, targets] of linksMap) {
        for (const tgt of targets) {
            if (pages.has(tgt)) {
                const edge = [src, tgt].sort().join('\0');
                edgesSet.add(edge);
            }
        }
    }
    const linkCounts = new Map();
    for (const edge of edgesSet) {
        const [a, b] = edge.split('\0');
        linkCounts.set(a, (linkCounts.get(a) || 0) + 1);
        linkCounts.set(b, (linkCounts.get(b) || 0) + 1);
    }
    const nodes = [];
    for (const [stem] of pages) {
        nodes.push({
            id: stem,
            title: stem.replace(/-/g, ' '),
            count: linkCounts.get(stem) || 0,
        });
    }
    const edges = [...edgesSet]
        .sort()
        .map(e => {
        const [a, b] = e.split('\0');
        return { source: a, target: b };
    });
    return { nodes, links: edges };
}
export function buildBacklinks(pages) {
    const backlinks = new Map();
    for (const stem of pages.keys()) {
        backlinks.set(stem, new Set());
    }
    for (const [stem, info] of pages) {
        for (const target of extractWikilinks(info.content)) {
            if (backlinks.has(target) && target !== stem) {
                backlinks.get(target).add(stem);
            }
        }
    }
    const result = new Map();
    for (const [stem, sources] of backlinks) {
        result.set(stem, [...sources].sort());
    }
    return result;
}
