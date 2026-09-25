/**
 * Parsing of a single Obsidian note — pure functions.
 *
 * A note is a markdown file with an optional YAML frontmatter block.
 * The filename (stem) is the page's identity and, unless the frontmatter
 * says otherwise, its title.
 */
import { parse as parseYaml } from 'yaml';
import { WIKILINK_RE } from './types.js';
/** Opening fence, YAML, closing fence including its line ending (or EOF). */
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
/** A markdown heading line (`# ...` through `###### ...`). */
const HEADING_RE = /^#{1,6}\s/;
const CODE_FENCE = '```';
/**
 * An inline `#tag`. Must be preceded by start-of-line or whitespace and start
 * with a Latin letter or Korean syllable/jamo, so that `#1`, `a#b` and
 * markdown headings are not treated as tags.
 */
const INLINE_TAG_RE = /(?:^|\s)#([a-zA-Z가-힯ㄱ-ㆎ][a-zA-Z0-9가-힯ㄱ-ㆎ_-]*)/g;
/** Filename stem → page title: hyphens become spaces. */
export function extractTitle(stem) {
    return stem.replace(/-/g, ' ');
}
/**
 * Split a note into its frontmatter and body. Only `title` and `tags` are
 * read from the frontmatter; other keys are ignored. Malformed values are
 * treated as absent.
 */
export function parseFrontmatter(raw) {
    const match = raw.match(FRONTMATTER_RE);
    if (!match) {
        return { frontmatter: { tags: [] }, body: raw };
    }
    const data = parseYaml(match[1]);
    const record = typeof data === 'object' && data !== null ? data : {};
    const title = typeof record.title === 'string' ? record.title : undefined;
    const tags = Array.isArray(record.tags)
        ? record.tags.filter((t) => typeof t === 'string')
        : [];
    const body = raw.slice(match[0].length);
    return { frontmatter: { title, tags }, body };
}
/**
 * Collect inline `#tags` from a note body, skipping headings, fenced code
 * blocks and anything inside wikilinks.
 */
export function extractInlineTags(body) {
    const tags = new Set();
    let inCodeBlock = false;
    for (const line of body.split('\n')) {
        if (line.startsWith(CODE_FENCE)) {
            inCodeBlock = !inCodeBlock;
            continue;
        }
        if (inCodeBlock || HEADING_RE.test(line))
            continue;
        const withoutWikilinks = line.replace(WIKILINK_RE, '');
        for (const m of withoutWikilinks.matchAll(INLINE_TAG_RE)) {
            tags.add(m[1]);
        }
    }
    return [...tags];
}
/**
 * Turn raw note text into page data. Frontmatter tags come first, then
 * inline tags; duplicates are removed.
 */
export function parseNote(stem, raw) {
    const { frontmatter, body } = parseFrontmatter(raw);
    const tags = [...new Set([...frontmatter.tags, ...extractInlineTags(body)])];
    return {
        title: frontmatter.title ?? extractTitle(stem),
        content: body,
        tags,
    };
}
