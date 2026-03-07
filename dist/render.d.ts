/**
 * HTML rendering — pure functions.
 */
import { type PageInfo, type SiteConfig, type GitHubConfig } from './types.js';
import type { GraphData } from './graph.js';
export declare function extractTitle(stem: string): string;
export declare function convertMarkdown(text: string): string;
export declare function processWikilinks(html: string, pages: Map<string, PageInfo>): string;
export declare function downgradeHeadings(html: string): string;
export declare function renderRelated(wikilinks: string[], pages: Map<string, PageInfo>): string;
export declare function renderBacklinks(stem: string, backlinks: Map<string, string[]>, pages: Map<string, PageInfo>): string;
export declare function renderEditLink(stem: string, contentDirectory: string, gitHub?: GitHubConfig): string;
export declare function buildPage(stem: string, pages: Map<string, PageInfo>, backlinks: Map<string, string[]>, template: string, config: SiteConfig): string;
export declare function buildIndex(graphData: GraphData, pages: Map<string, PageInfo>, template: string, config: SiteConfig): string;
