/**
 * Core build logic for generating a static website from an Obsidian vault.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync, existsSync } from 'fs';
import { resolve, join, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { parse as parseYaml } from 'yaml';
import { buildGraph, buildBacklinks } from './graph.js';
import { buildPage, buildIndex, buildTagsPage } from './render.js';
const PACKAGE_DIR = resolve(fileURLToPath(import.meta.url), '..', '..');
export function loadConfig(source) {
    const config = { title: basename(source), subtitle: '', lang: 'en', 'content-directory': 'content', 'output-directory': 'public' };
    const configPath = join(source, 'site.yaml');
    if (existsSync(configPath)) {
        const data = parseYaml(readFileSync(configPath, 'utf-8'));
        Object.assign(config, data);
    }
    return config;
}
export function scanVault(source, contentDirectory) {
    const contentDir = join(source, contentDirectory);
    const scanDir = existsSync(contentDir) ? contentDir : source;
    const pages = new Map();
    const files = readdirSync(scanDir, { recursive: true })
        .map(f => String(f))
        .filter(f => extname(f) === '.md')
        .sort();
    for (const file of files) {
        const stem = basename(file, '.md');
        const filePath = join(scanDir, file);
        const raw = readFileSync(filePath, 'utf-8');
        let title = stem.replace(/-/g, ' ');
        let content = raw;
        const tags = new Set();
        const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        if (fmMatch) {
            const fm = parseYaml(fmMatch[1]);
            if (fm && typeof fm.title === 'string') {
                title = fm.title;
            }
            if (fm && Array.isArray(fm.tags)) {
                for (const t of fm.tags) {
                    if (typeof t === 'string')
                        tags.add(t);
                }
            }
            content = raw.slice(fmMatch[0].length).replace(/^\r?\n/, '');
        }
        // Extract inline #tags from body (skip headings, code blocks, wikilinks)
        let inCodeBlock = false;
        for (const line of content.split('\n')) {
            if (line.startsWith('```')) {
                inCodeBlock = !inCodeBlock;
                continue;
            }
            if (inCodeBlock)
                continue;
            if (/^#{1,6}\s/.test(line))
                continue;
            // Match #tag patterns, excluding inside wikilinks
            const withoutWikilinks = line.replace(/\[\[[^\]]*\]\]/g, '');
            const matches = withoutWikilinks.matchAll(/(?:^|\s)#([a-zA-Z\uAC00-\uD7AF\u3131-\u318E][a-zA-Z0-9\uAC00-\uD7AF\u3131-\u318E_-]*)/g);
            for (const m of matches) {
                tags.add(m[1]);
            }
        }
        pages.set(stem, { path: filePath, title, content, tags: [...tags] });
    }
    return pages;
}
export function build(options) {
    const source = resolve(options.source);
    const config = loadConfig(source);
    if (options.output) {
        config['output-directory'] = options.output;
    }
    const output = resolve(source, config['output-directory']);
    console.log(`Source: ${source}`);
    console.log(`Output: ${output}`);
    // Load templates
    const pageTemplate = readFileSync(join(PACKAGE_DIR, 'layouts', 'page.html'), 'utf-8');
    const indexTemplate = readFileSync(join(PACKAGE_DIR, 'layouts', 'index.html'), 'utf-8');
    const tagsTemplate = readFileSync(join(PACKAGE_DIR, 'layouts', 'tags.html'), 'utf-8');
    // Scan vault
    const pages = scanVault(source, config['content-directory']);
    console.log(`Found ${pages.size} pages`);
    // Build graph and backlinks
    const graphData = buildGraph(pages);
    const backlinks = buildBacklinks(pages);
    console.log(`Graph: ${graphData.nodes.length} nodes, ${graphData.links.length} edges`);
    // Create output directory
    mkdirSync(output, { recursive: true });
    // Generate pages
    for (const stem of pages.keys()) {
        const html = buildPage(stem, pages, backlinks, pageTemplate, config, graphData);
        writeFileSync(join(output, `${stem}.html`), html, 'utf-8');
    }
    // Generate index
    const indexHtml = buildIndex(graphData, pages, indexTemplate, config);
    writeFileSync(join(output, 'index.html'), indexHtml, 'utf-8');
    // Generate tags page
    const tagsHtml = buildTagsPage(pages, tagsTemplate, config);
    writeFileSync(join(output, 'tags.html'), tagsHtml, 'utf-8');
    // Copy static files
    copyFileSync(join(PACKAGE_DIR, 'styles', 'style.css'), join(output, 'style.css'));
    console.log(`Generated ${pages.size} pages + index.html → ${output}`);
}
