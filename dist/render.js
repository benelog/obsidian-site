/**
 * HTML rendering — pure functions.
 */
import { marked } from 'marked';
import { WIKILINK_RE } from './types.js';
import { extractWikilinks, buildLocalGraph } from './graph.js';
import { extractTitle } from './note.js';
/** Placeholder syntax used by the layout templates: `{name}`. */
const PLACEHOLDER_RE = /\{(\w+)\}/g;
/** Everything from a `## Related` heading to the end of the note. */
const RELATED_SECTION_RE = /^##\s+Related\s*$[\s\S]*/m;
export function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
/**
 * Fill `{name}` placeholders in a single pass. Values are inserted verbatim
 * and never re-scanned, and placeholders without a value are left as-is.
 */
export function renderTemplate(template, vars) {
    return template.replace(PLACEHOLDER_RE, (match, name) => Object.hasOwn(vars, name) ? vars[name] : match);
}
/** `<li>` link to an existing page, labelled with its title. */
export function pageListItem(stem, pages) {
    return `<li><a href="${stem}.html">${escapeHtml(pages.get(stem).title)}</a></li>`;
}
function listSection(className, heading, items) {
    return `<section class="${className}"><h2>${heading}</h2><ul>${items.join('\n')}</ul></section>`;
}
export function convertMarkdown(text) {
    return marked.parse(text, { async: false });
}
/**
 * Drop the trailing `## Related` section from note content. Its links are
 * still picked up by `extractWikilinks` on the full content and shown in the
 * sidebar; they are just not repeated in the body.
 */
export function stripRelatedSection(content) {
    return content.replace(RELATED_SECTION_RE, '');
}
export function processWikilinks(html, pages) {
    return html.replace(WIKILINK_RE, (_match, target, display) => {
        const label = display || extractTitle(target);
        if (pages.has(target)) {
            return `<a href="${target}.html" class="wikilink">${label}</a>`;
        }
        return `<span class="broken-link">${label}</span>`;
    });
}
export function downgradeHeadings(html) {
    return html.replace(/<h([1-5])>(.*?)<\/h\1>/g, (_match, level, content) => {
        const newLevel = Math.min(parseInt(level) + 1, 6);
        return `<h${newLevel}>${content}</h${newLevel}>`;
    });
}
export function renderRelated(wikilinks, pages) {
    if (wikilinks.length === 0)
        return '';
    const targets = [...new Set(wikilinks)].sort().filter(target => pages.has(target));
    if (targets.length === 0)
        return '';
    return listSection('related', 'Related', targets.map(stem => pageListItem(stem, pages)));
}
export function renderBacklinks(stem, backlinks, pages) {
    const sources = backlinks.get(stem) || [];
    if (sources.length === 0)
        return '';
    return listSection('backlinks', 'Backlinks', sources.map(src => pageListItem(src, pages)));
}
export function renderEditLink(stem, contentDirectory, gitHub) {
    if (!gitHub?.['repository-url'])
        return '';
    const branch = gitHub['content-branch'] || 'main';
    const url = `${gitHub['repository-url']}/edit/${branch}/${contentDirectory}/${stem}.md`;
    return `<a href="${url}" class="edit-link" target="_blank" rel="noopener noreferrer">Edit</a>`;
}
export function renderTags(tags) {
    if (tags.length === 0)
        return '';
    const items = tags.map(tag => {
        const safe = escapeHtml(tag);
        return `<a href="tags.html#tag-${safe}" class="page-tag">#${safe}</a>`;
    });
    return `<div class="page-tags">${items.join('\n')}</div>`;
}
/**
 * Local (depth-2) graph around `stem`, rendered through the page-graph
 * layout. Empty when the page has no connections.
 */
export function renderPageGraph(stem, graphData, template) {
    const local = buildLocalGraph(stem, graphData);
    if (local.nodes.length < 2)
        return '';
    return renderTemplate(template, {
        graph_json: JSON.stringify(local),
        center_id: JSON.stringify(stem),
    });
}
export function buildPage(stem, model, templates) {
    const { pages, backlinks, graph, config } = model;
    const page = pages.get(stem);
    let body = convertMarkdown(stripRelatedSection(page.content));
    body = downgradeHeadings(body);
    body = processWikilinks(body, pages);
    return renderTemplate(templates['page.html'], {
        title: escapeHtml(page.title),
        site_title: config.title,
        lang: config.lang,
        body,
        related: renderRelated(extractWikilinks(page.content), pages),
        backlinks: renderBacklinks(stem, backlinks, pages),
        edit_link: renderEditLink(stem, config['content-directory'], config.gitHub),
        tags: renderTags(page.tags),
        page_graph: renderPageGraph(stem, graph, templates['page-graph.html']),
    });
}
export function extractTags(pages) {
    const tagMap = new Map();
    for (const [stem, page] of pages) {
        for (const tag of page.tags) {
            const list = tagMap.get(tag);
            if (list) {
                list.push(stem);
            }
            else {
                tagMap.set(tag, [stem]);
            }
        }
    }
    return tagMap;
}
export function buildTagsPage(model, template) {
    const { pages, config } = model;
    const tagMap = extractTags(pages);
    const sortedTags = [...tagMap.keys()].sort((a, b) => a.localeCompare(b));
    // Tag list (top summary)
    const tagList = sortedTags.map(tag => {
        const safe = escapeHtml(tag);
        const count = tagMap.get(tag).length;
        return `<li><a href="#tag-${safe}" class="tag-link">#${safe}</a> <span class="tag-count">(${count})</span></li>`;
    });
    // Tag sections (detail)
    const tagSections = sortedTags.map(tag => {
        const safe = escapeHtml(tag);
        const items = tagMap.get(tag).sort().map(stem => pageListItem(stem, pages)).join('\n');
        return `<section id="tag-${safe}" class="tag-section">
<h2>#${safe}</h2>
<ul>${items}</ul>
</section>`;
    });
    return renderTemplate(template, {
        title: 'Tags',
        site_title: config.title,
        lang: config.lang,
        tag_list: tagList.join('\n'),
        tag_sections: tagSections.join('\n'),
        tag_count: String(sortedTags.length),
    });
}
export function buildIndex(model, template) {
    const { pages, graph, config } = model;
    const pageList = [...pages.keys()].sort().map(stem => pageListItem(stem, pages));
    return renderTemplate(template, {
        title: config.title,
        subtitle: config.subtitle || '',
        lang: config.lang,
        graph_data: JSON.stringify(graph),
        page_list: pageList.join('\n'),
        page_count: String(pages.size),
    });
}
