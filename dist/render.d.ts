/**
 * HTML rendering — pure functions.
 */
import { type PageInfo, type GitHubConfig } from './types.js';
import { type GraphData } from './graph.js';
import type { SiteModel } from './site.js';
export declare function convertMarkdown(text: string): string;
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
