/**
 * Site model and in-memory rendering — pure functions.
 *
 * `buildSiteModel` derives everything the renderers need from the scanned
 * pages, and `renderSite` turns that into a map of output files. Nothing
 * here touches the filesystem.
 */

import { buildGraph, buildBacklinks, type GraphData } from './graph.js';
import { buildPage, buildIndex, buildTagsPage } from './render.js';
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

export function buildSiteModel(pages: Map<string, PageInfo>, config: SiteConfig): SiteModel {
  return {
    pages,
    backlinks: buildBacklinks(pages),
    graph: buildGraph(pages),
    config,
  };
}

export function renderSite(model: SiteModel, templates: Templates, styles: Map<string, string>): SiteFiles {
  const files: SiteFiles = new Map();

  for (const stem of model.pages.keys()) {
    files.set(`${stem}.html`, buildPage(stem, model, templates));
  }
  files.set('index.html', buildIndex(model, templates['index.html']));
  files.set('tags.html', buildTagsPage(model, templates['tags.html']));

  for (const [name, css] of styles) {
    files.set(name, css);
  }

  return files;
}
