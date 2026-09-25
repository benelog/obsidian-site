/**
 * HTML rendering — pure functions.
 */
import { type PageInfo, type GitHubConfig } from './types.js';
import { type GraphData } from './graph.js';
import type { SiteModel } from './site.js';
export declare function escapeHtml(text: string): string;
/**
 * Fill `{name}` placeholders in a single pass. Values are inserted verbatim
 * and never re-scanned, and placeholders without a value are left as-is.
 */
export declare function renderTemplate(template: string, vars: Record<string, string>): string;
/** `<li>` link to an existing page, labelled with its title. */
export declare function pageListItem(stem: string, pages: Map<string, PageInfo>): string;
export declare function convertMarkdown(text: string): string;
/**
 * Drop the trailing `## Related` section from note content. Its links are
 * still picked up by `extractWikilinks` on the full content and shown in the
 * sidebar; they are just not repeated in the body.
 */
export declare function stripRelatedSection(content: string): string;
export declare function processWikilinks(html: string, pages: Map<string, PageInfo>): string;
export declare function downgradeHeadings(html: string): string;
export declare function renderRelated(wikilinks: string[], pages: Map<string, PageInfo>): string;
export declare function renderBacklinks(stem: string, backlinks: Map<string, string[]>, pages: Map<string, PageInfo>): string;
export declare function renderEditLink(stem: string, contentDirectory: string, gitHub?: GitHubConfig): string;
export declare function renderTags(tags: string[]): string;
export declare function renderPageGraph(stem: string, graphData: GraphData, pages: Map<string, PageInfo>): string;
export declare function buildPage(stem: string, model: SiteModel, template: string): string;
export declare function extractTags(pages: Map<string, PageInfo>): Map<string, string[]>;
export declare function buildTagsPage(model: SiteModel, template: string): string;
export declare function buildIndex(model: SiteModel, template: string): string;
