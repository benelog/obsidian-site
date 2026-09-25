/**
 * Site model and in-memory rendering — pure functions.
 *
 * `buildSiteModel` derives everything the renderers need from the scanned
 * pages, and `renderSite` turns that into a map of output files. Nothing
 * here touches the filesystem.
 */
import { buildGraph, buildBacklinks } from './graph.js';
import { buildPage, buildIndex, buildTagsPage } from './render.js';
export function buildSiteModel(pages, config) {
    return {
        pages,
        backlinks: buildBacklinks(pages),
        graph: buildGraph(pages),
        config,
    };
}
export function renderSite(model, templates, styles) {
    const files = new Map();
    for (const stem of model.pages.keys()) {
        files.set(`${stem}.html`, buildPage(stem, model, templates['page.html']));
    }
    files.set('index.html', buildIndex(model, templates['index.html']));
    files.set('tags.html', buildTagsPage(model, templates['tags.html']));
    for (const [name, css] of styles) {
        files.set(name, css);
    }
    return files;
}
