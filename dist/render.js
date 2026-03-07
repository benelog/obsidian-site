/**
 * HTML rendering — pure functions.
 */
import { marked } from 'marked';
import { WIKILINK_RE } from './types.js';
import { extractWikilinks } from './graph.js';
export function extractTitle(stem) {
    return stem.replace(/-/g, ' ');
}
export function convertMarkdown(text) {
    return marked.parse(text, { async: false });
}
export function processWikilinks(html, pages) {
    return html.replace(new RegExp(WIKILINK_RE.source, 'g'), (_match, target, display) => {
        const label = display || target.replace(/-/g, ' ');
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
    const seen = new Set();
    const items = [];
    for (const target of [...wikilinks].sort()) {
        if (seen.has(target))
            continue;
        seen.add(target);
        if (pages.has(target)) {
            items.push(`<li><a href="${target}.html">${pages.get(target).title}</a></li>`);
        }
    }
    if (items.length === 0)
        return '';
    return '<section class="related"><h2>Related</h2><ul>' + items.join('\n') + '</ul></section>';
}
export function renderBacklinks(stem, backlinks, pages) {
    const links = backlinks.get(stem) || [];
    if (links.length === 0)
        return '';
    const items = [];
    for (const src of links) {
        items.push(`<li><a href="${src}.html">${pages.get(src).title}</a></li>`);
    }
    return '<section class="backlinks"><h2>Backlinks</h2><ul>' + items.join('\n') + '</ul></section>';
}
export function renderEditLink(stem, contentDirectory, gitHub) {
    if (!gitHub?.['repository-url'])
        return '';
    const branch = gitHub['content-branch'] || 'main';
    const url = `${gitHub['repository-url']}/edit/${branch}/${contentDirectory}/${stem}.md`;
    return `<a href="${url}" class="edit-link" target="_blank" rel="noopener noreferrer">Edit</a>`;
}
export function buildPage(stem, pages, backlinks, template, config) {
    const page = pages.get(stem);
    const content = page.content;
    const title = page.title;
    const wikilinks = extractWikilinks(content);
    const contentWithoutRelated = content.split(/^##\s+Related\s*$/m)[0];
    let htmlBody = convertMarkdown(contentWithoutRelated);
    htmlBody = downgradeHeadings(htmlBody);
    htmlBody = processWikilinks(htmlBody, pages);
    const relatedHtml = renderRelated(wikilinks, pages);
    const backlinksHtml = renderBacklinks(stem, backlinks, pages);
    const editLinkHtml = renderEditLink(stem, config['content-directory'], config.gitHub);
    return template
        .replaceAll('{title}', title)
        .replaceAll('{site_title}', config.title)
        .replaceAll('{lang}', config.lang)
        .replaceAll('{body}', htmlBody)
        .replaceAll('{related}', relatedHtml)
        .replaceAll('{backlinks}', backlinksHtml)
        .replaceAll('{edit_link}', editLinkHtml);
}
export function buildIndex(graphData, pages, template, config) {
    const pageListItems = [];
    for (const stem of [...pages.keys()].sort()) {
        pageListItems.push(`<li><a href="${stem}.html">${pages.get(stem).title}</a></li>`);
    }
    const pageListHtml = pageListItems.join('\n');
    return template
        .replaceAll('{title}', config.title)
        .replaceAll('{subtitle}', config.subtitle || '')
        .replaceAll('{lang}', config.lang)
        .replaceAll('{graph_data}', JSON.stringify(graphData))
        .replaceAll('{page_list}', pageListHtml)
        .replaceAll('{page_count}', String(pages.size));
}
