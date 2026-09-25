/**
 * Parsing of a single Obsidian note — pure functions.
 *
 * A note is a markdown file with an optional YAML frontmatter block.
 * The filename (stem) is the page's identity and, unless the frontmatter
 * says otherwise, its title.
 */
import { type PageInfo } from './types.js';
export interface Frontmatter {
    title?: string;
    tags: string[];
}
/** Filename stem → page title: hyphens become spaces. */
export declare function extractTitle(stem: string): string;
/**
 * Split a note into its frontmatter and body. Only `title` and `tags` are
 * read from the frontmatter; other keys are ignored. Malformed values are
 * treated as absent.
 */
export declare function parseFrontmatter(raw: string): {
    frontmatter: Frontmatter;
    body: string;
};
/**
 * Collect inline `#tags` from a note body, skipping headings, fenced code
 * blocks and anything inside wikilinks.
 */
export declare function extractInlineTags(body: string): string[];
/**
 * Turn raw note text into page data. Frontmatter tags come first, then
 * inline tags; duplicates are removed.
 */
export declare function parseNote(stem: string, raw: string): Omit<PageInfo, 'path'>;
