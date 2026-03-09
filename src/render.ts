/**
 * HTML rendering — pure functions.
 */

import { marked } from 'marked';
import { WIKILINK_RE, type PageInfo, type SiteConfig, type GitHubConfig } from './types.js';
import { extractWikilinks, buildLocalGraph } from './graph.js';
import type { GraphData } from './graph.js';

export function extractTitle(stem: string): string {
  return stem.replace(/-/g, ' ');
}

export function convertMarkdown(text: string): string {
  return marked.parse(text, { async: false }) as string;
}

export function processWikilinks(html: string, pages: Map<string, PageInfo>): string {
  return html.replace(new RegExp(WIKILINK_RE.source, 'g'), (_match, target: string, display?: string) => {
    const label = display || target.replace(/-/g, ' ');
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

  const seen = new Set<string>();
  const items: string[] = [];
  for (const target of [...wikilinks].sort()) {
    if (seen.has(target)) continue;
    seen.add(target);
    if (pages.has(target)) {
      items.push(`<li><a href="${target}.html">${pages.get(target)!.title}</a></li>`);
    }
  }

  if (items.length === 0) return '';
  return '<section class="related"><h2>Related</h2><ul>' + items.join('\n') + '</ul></section>';
}

export function renderBacklinks(stem: string, backlinks: Map<string, string[]>, pages: Map<string, PageInfo>): string {
  const links = backlinks.get(stem) || [];
  if (links.length === 0) return '';

  const items: string[] = [];
  for (const src of links) {
    items.push(`<li><a href="${src}.html">${pages.get(src)!.title}</a></li>`);
  }
  return '<section class="backlinks"><h2>Backlinks</h2><ul>' + items.join('\n') + '</ul></section>';
}

export function renderEditLink(stem: string, contentDirectory: string, gitHub?: GitHubConfig): string {
  if (!gitHub?.['repository-url']) return '';
  const branch = gitHub['content-branch'] || 'main';
  const url = `${gitHub['repository-url']}/edit/${branch}/${contentDirectory}/${stem}.md`;
  return `<a href="${url}" class="edit-link" target="_blank" rel="noopener noreferrer">Edit</a>`;
}

export function renderTags(tags: string[]): string {
  if (tags.length === 0) return '';
  const items = tags.map(tag => `<a href="tags.html#tag-${tag}" class="page-tag">#${tag}</a>`);
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

export function buildPage(
  stem: string,
  pages: Map<string, PageInfo>,
  backlinks: Map<string, string[]>,
  template: string,
  config: SiteConfig,
  graphData?: GraphData,
): string {
  const page = pages.get(stem)!;
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
  const tagsHtml = renderTags(page.tags);
  const pageGraphHtml = graphData ? renderPageGraph(stem, graphData, pages) : '';

  return template
    .replaceAll('{title}', title)
    .replaceAll('{site_title}', config.title)
    .replaceAll('{lang}', config.lang)
    .replaceAll('{body}', htmlBody)
    .replaceAll('{related}', relatedHtml)
    .replaceAll('{backlinks}', backlinksHtml)
    .replaceAll('{edit_link}', editLinkHtml)
    .replaceAll('{tags}', tagsHtml)
    .replaceAll('{page_graph}', pageGraphHtml);
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

export function buildTagsPage(
  pages: Map<string, PageInfo>,
  template: string,
  config: SiteConfig,
): string {
  const tagMap = extractTags(pages);
  const sortedTags = [...tagMap.keys()].sort((a, b) => a.localeCompare(b));

  // Tag list (top summary)
  const tagListItems = sortedTags.map(tag => {
    const count = tagMap.get(tag)!.length;
    return `<li><a href="#tag-${tag}" class="tag-link">#${tag}</a> <span class="tag-count">(${count})</span></li>`;
  });
  const tagListHtml = tagListItems.join('\n');

  // Tag sections (detail)
  const tagSections = sortedTags.map(tag => {
    const stems = tagMap.get(tag)!.sort();
    const pageItems = stems.map(stem => {
      const title = pages.get(stem)!.title;
      return `<li><a href="${stem}.html">${title}</a></li>`;
    }).join('\n');
    return `<section id="tag-${tag}" class="tag-section">
<h2>#${tag}</h2>
<ul>${pageItems}</ul>
</section>`;
  });
  const tagSectionsHtml = tagSections.join('\n');

  return template
    .replaceAll('{title}', 'Tags')
    .replaceAll('{site_title}', config.title)
    .replaceAll('{lang}', config.lang)
    .replaceAll('{tag_list}', tagListHtml)
    .replaceAll('{tag_sections}', tagSectionsHtml)
    .replaceAll('{tag_count}', String(sortedTags.length));
}

export function buildIndex(
  graphData: GraphData,
  pages: Map<string, PageInfo>,
  template: string,
  config: SiteConfig,
): string {
  const pageListItems: string[] = [];
  for (const stem of [...pages.keys()].sort()) {
    pageListItems.push(`<li><a href="${stem}.html">${pages.get(stem)!.title}</a></li>`);
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
