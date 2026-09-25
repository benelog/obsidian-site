/**
 * HTML rendering — pure functions.
 */

import { marked } from 'marked';
import { WIKILINK_RE, type PageInfo, type GitHubConfig } from './types.js';
import { extractWikilinks, buildLocalGraph, type GraphData } from './graph.js';
import { extractTitle } from './note.js';
import type { SiteModel } from './site.js';

/** Placeholder syntax used by the layout templates: `{name}`. */
const PLACEHOLDER_RE = /\{(\w+)\}/g;

/** Everything from a `## Related` heading to the end of the note. */
const RELATED_SECTION_RE = /^##\s+Related\s*$[\s\S]*/m;

export function escapeHtml(text: string): string {
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
export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(PLACEHOLDER_RE, (match, name: string) =>
    Object.hasOwn(vars, name) ? vars[name] : match,
  );
}

/** `<li>` link to an existing page, labelled with its title. */
export function pageListItem(stem: string, pages: Map<string, PageInfo>): string {
  return `<li><a href="${stem}.html">${escapeHtml(pages.get(stem)!.title)}</a></li>`;
}

function listSection(className: string, heading: string, items: string[]): string {
  return `<section class="${className}"><h2>${heading}</h2><ul>${items.join('\n')}</ul></section>`;
}

export function convertMarkdown(text: string): string {
  return marked.parse(text, { async: false }) as string;
}

/**
 * Drop the trailing `## Related` section from note content. Its links are
 * still picked up by `extractWikilinks` on the full content and shown in the
 * sidebar; they are just not repeated in the body.
 */
export function stripRelatedSection(content: string): string {
  return content.replace(RELATED_SECTION_RE, '');
}

export function processWikilinks(html: string, pages: Map<string, PageInfo>): string {
  return html.replace(WIKILINK_RE, (_match, target: string, display?: string) => {
    const label = display || extractTitle(target);
    if (pages.has(target)) {
      return `<a href="${target}.html" class="wikilink">${label}</a>`;
    }
    return `<span class="broken-link">${label}</span>`;
  });
}

export function downgradeHeadings(html: string): string {
  return html.replace(/<h([1-5])>(.*?)<\/h\1>/g, (_match, level: string, content: string) => {
    const newLevel = Math.min(parseInt(level) + 1, 6);
    return `<h${newLevel}>${content}</h${newLevel}>`;
  });
}

export function renderRelated(wikilinks: string[], pages: Map<string, PageInfo>): string {
  if (wikilinks.length === 0) return '';

  const targets = [...new Set(wikilinks)].sort().filter(target => pages.has(target));
  if (targets.length === 0) return '';
  return listSection('related', 'Related', targets.map(stem => pageListItem(stem, pages)));
}

export function renderBacklinks(stem: string, backlinks: Map<string, string[]>, pages: Map<string, PageInfo>): string {
  const sources = backlinks.get(stem) || [];
  if (sources.length === 0) return '';
  return listSection('backlinks', 'Backlinks', sources.map(src => pageListItem(src, pages)));
}

export function renderEditLink(stem: string, contentDirectory: string, gitHub?: GitHubConfig): string {
  if (!gitHub?.['repository-url']) return '';
  const branch = gitHub['content-branch'] || 'main';
  const url = `${gitHub['repository-url']}/edit/${branch}/${contentDirectory}/${stem}.md`;
  return `<a href="${url}" class="edit-link" target="_blank" rel="noopener noreferrer">Edit</a>`;
}

export function renderTags(tags: string[]): string {
  if (tags.length === 0) return '';
  const items = tags.map(tag => {
    const safe = escapeHtml(tag);
    return `<a href="tags.html#tag-${safe}" class="page-tag">#${safe}</a>`;
  });
  return `<div class="page-tags">${items.join('\n')}</div>`;
}

export function renderPageGraph(stem: string, graphData: GraphData, pages: Map<string, PageInfo>): string {
  const local = buildLocalGraph(stem, graphData);
  if (local.nodes.length < 2) return '';

  // Build node data with titles from pages map
  const nodeData = local.nodes.map(n => ({
    id: n.id,
    title: pages.get(n.id)?.title || n.title,
    count: n.count,
  }));

  const graphJson = JSON.stringify({ nodes: nodeData, links: local.links });

  return `<section class="page-graph">
<h2>Graph</h2>
<div class="page-graph-container" id="page-graph"></div>
</section>
<script src="https://d3js.org/d3.v7.min.js"></script>
<script>
(function() {
  const data = ${graphJson};
  const centerId = ${JSON.stringify(stem)};
  const container = document.getElementById('page-graph');
  const width = container.clientWidth;
  const height = 220;
  container.style.height = height + 'px';

  const svg = d3.select('#page-graph')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const g = svg.append('g');

  const zoom = d3.zoom()
    .scaleExtent([0.5, 4])
    .on('zoom', (event) => g.attr('transform', event.transform));
  svg.call(zoom);

  const nodeRadius = d => d.id === centerId ? 8 : 5;

  const simulation = d3.forceSimulation(data.nodes)
    .force('link', d3.forceLink(data.links).id(d => d.id).distance(60))
    .force('charge', d3.forceManyBody().strength(-80))
    .force('x', d3.forceX(width / 2).strength(0.15))
    .force('y', d3.forceY(height / 2).strength(0.15))
    .force('collision', d3.forceCollide().radius(d => nodeRadius(d) + 4));

  const link = g.append('g')
    .selectAll('line')
    .data(data.links)
    .join('line')
    .attr('stroke', '#ccc')
    .attr('stroke-width', 0.8);

  const node = g.append('g')
    .selectAll('circle')
    .data(data.nodes)
    .join('circle')
    .attr('r', nodeRadius)
    .attr('fill', d => d.id === centerId ? '#03C75A' : '#b2dfdb')
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5)
    .style('cursor', 'pointer')
    .on('click', (event, d) => {
      if (d.id !== centerId) window.location.href = d.id + '.html';
    })
    .call(d3.drag()
      .on('start', (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
      .on('end', (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }));

  node.append('title').text(d => d.title);

  const labels = g.append('g')
    .selectAll('text')
    .data(data.nodes)
    .join('text')
    .text(d => d.title)
    .attr('font-size', d => d.id === centerId ? 12 : 10)
    .attr('font-weight', d => d.id === centerId ? '700' : '400')
    .attr('fill', '#666')
    .attr('dx', d => nodeRadius(d) + 3)
    .attr('dy', 3)
    .style('pointer-events', 'none');

  simulation.on('tick', () => {
    link
      .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
    node.attr('cx', d => d.x).attr('cy', d => d.y);
    labels.attr('x', d => d.x).attr('y', d => d.y);
  });
})();
</script>`;
}

export function buildPage(stem: string, model: SiteModel, template: string): string {
  const { pages, backlinks, graph, config } = model;
  const page = pages.get(stem)!;

  let body = convertMarkdown(stripRelatedSection(page.content));
  body = downgradeHeadings(body);
  body = processWikilinks(body, pages);

  return renderTemplate(template, {
    title: escapeHtml(page.title),
    site_title: config.title,
    lang: config.lang,
    body,
    related: renderRelated(extractWikilinks(page.content), pages),
    backlinks: renderBacklinks(stem, backlinks, pages),
    edit_link: renderEditLink(stem, config['content-directory'], config.gitHub),
    tags: renderTags(page.tags),
    page_graph: renderPageGraph(stem, graph, pages),
  });
}

export function extractTags(pages: Map<string, PageInfo>): Map<string, string[]> {
  const tagMap = new Map<string, string[]>();
  for (const [stem, page] of pages) {
    for (const tag of page.tags) {
      const list = tagMap.get(tag);
      if (list) {
        list.push(stem);
      } else {
        tagMap.set(tag, [stem]);
      }
    }
  }
  return tagMap;
}

export function buildTagsPage(model: SiteModel, template: string): string {
  const { pages, config } = model;
  const tagMap = extractTags(pages);
  const sortedTags = [...tagMap.keys()].sort((a, b) => a.localeCompare(b));

  // Tag list (top summary)
  const tagList = sortedTags.map(tag => {
    const safe = escapeHtml(tag);
    const count = tagMap.get(tag)!.length;
    return `<li><a href="#tag-${safe}" class="tag-link">#${safe}</a> <span class="tag-count">(${count})</span></li>`;
  });

  // Tag sections (detail)
  const tagSections = sortedTags.map(tag => {
    const safe = escapeHtml(tag);
    const items = tagMap.get(tag)!.sort().map(stem => pageListItem(stem, pages)).join('\n');
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

export function buildIndex(model: SiteModel, template: string): string {
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
