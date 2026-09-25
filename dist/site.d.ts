/**
 * Site model and in-memory rendering — pure functions.
 *
 * `buildSiteModel` derives everything the renderers need from the scanned
 * pages, and `renderSite` turns that into a map of output files. Nothing
 * here touches the filesystem.
 */
import { type GraphData } from './graph.js';
import type { Templates } from './theme.js';
import type { PageInfo, SiteConfig } from './types.js';
export interface SiteModel {
    pages: Map<string, PageInfo>;
    backlinks: Map<string, string[]>;
    graph: GraphData;
    config: SiteConfig;
}
/** Output filename → file content. */
export type SiteFiles = Map<string, string>;
export declare function buildSiteModel(pages: Map<string, PageInfo>, config: SiteConfig): SiteModel;
export declare function renderSite(model: SiteModel, templates: Templates, styles: Map<string, string>): SiteFiles;
