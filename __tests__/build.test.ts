import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import { build } from '../src/build.js';

const FIXTURE_DIR = join(import.meta.dirname, 'fixtures', 'sample-vault');
const OUTPUT_DIR = join(FIXTURE_DIR, 'public');

describe('build integration', () => {
  beforeAll(() => {
    build({ source: FIXTURE_DIR });
  });

  afterAll(() => {
    rmSync(OUTPUT_DIR, { recursive: true, force: true });
  });

  it('generates HTML files for each markdown page', () => {
    expect(existsSync(join(OUTPUT_DIR, 'javascript.html'))).toBe(true);
    expect(existsSync(join(OUTPUT_DIR, 'typescript.html'))).toBe(true);
    expect(existsSync(join(OUTPUT_DIR, 'react.html'))).toBe(true);
    expect(existsSync(join(OUTPUT_DIR, 'standalone.html'))).toBe(true);
  });

  it('generates index.html', () => {
    expect(existsSync(join(OUTPUT_DIR, 'index.html'))).toBe(true);
  });

  it('copies style.css', () => {
    expect(existsSync(join(OUTPUT_DIR, 'style.css'))).toBe(true);
  });

  describe('site config', () => {
    it('applies site title from site.yaml', () => {
      const html = readFileSync(join(OUTPUT_DIR, 'index.html'), 'utf-8');
      expect(html).toContain('Sample Site');
    });

    it('applies subtitle from site.yaml', () => {
      const html = readFileSync(join(OUTPUT_DIR, 'index.html'), 'utf-8');
      expect(html).toContain('A test site for integration testing');
    });
  });

  describe('page rendering', () => {
    it('uses frontmatter title as page heading', () => {
      const html = readFileSync(join(OUTPUT_DIR, 'javascript.html'), 'utf-8');
      expect(html).toContain('<h1>JavaScript</h1>');
    });

    it('uses filename as title when no frontmatter title', () => {
      const html = readFileSync(join(OUTPUT_DIR, 'standalone.html'), 'utf-8');
      expect(html).toContain('<h1>standalone</h1>');
    });

    it('renders wikilinks as anchor tags', () => {
      const html = readFileSync(join(OUTPUT_DIR, 'javascript.html'), 'utf-8');
      expect(html).toContain('<a href="typescript.html" class="wikilink">');
      expect(html).toContain('<a href="react.html" class="wikilink">');
    });

    it('renders broken wikilinks as spans', () => {
      const html = readFileSync(join(OUTPUT_DIR, 'react.html'), 'utf-8');
      expect(html).toContain('<span class="broken-link">missing page</span>');
    });

    it('renders Related section in sidebar', () => {
      const html = readFileSync(join(OUTPUT_DIR, 'javascript.html'), 'utf-8');
      expect(html).toContain('class="related"');
    });

    it('renders backlinks in sidebar', () => {
      // typescript is linked from both javascript and react
      const html = readFileSync(join(OUTPUT_DIR, 'typescript.html'), 'utf-8');
      expect(html).toContain('class="backlinks"');
      expect(html).toContain('javascript.html');
      expect(html).toContain('react.html');
    });

    it('renders edit link with GitHub config', () => {
      const html = readFileSync(join(OUTPUT_DIR, 'javascript.html'), 'utf-8');
      expect(html).toContain('https://github.com/example/sample-vault');
    });

    it('displays tags on page with links to tags page', () => {
      const html = readFileSync(join(OUTPUT_DIR, 'javascript.html'), 'utf-8');
      expect(html).toContain('class="page-tags"');
      expect(html).toContain('<a href="tags.html#tag-programming" class="page-tag">#programming</a>');
      expect(html).toContain('<a href="tags.html#tag-web" class="page-tag">#web</a>');
    });

    it('does not render tags div when page has no tags', () => {
      const html = readFileSync(join(OUTPUT_DIR, 'standalone.html'), 'utf-8');
      expect(html).not.toContain('class="page-tags"');
    });
  });

  describe('tags page', () => {
    it('generates tags.html', () => {
      expect(existsSync(join(OUTPUT_DIR, 'tags.html'))).toBe(true);
    });

    it('contains tags from frontmatter', () => {
      const html = readFileSync(join(OUTPUT_DIR, 'tags.html'), 'utf-8');
      expect(html).toContain('programming');
      expect(html).toContain('web');
      expect(html).toContain('frontend');
    });

    it('lists pages under each tag', () => {
      const html = readFileSync(join(OUTPUT_DIR, 'tags.html'), 'utf-8');
      expect(html).toContain('javascript.html');
      expect(html).toContain('react.html');
    });

    it('shows tag count', () => {
      const html = readFileSync(join(OUTPUT_DIR, 'tags.html'), 'utf-8');
      // programming tag has 3 pages (javascript, react, typescript)
      expect(html).toContain('(3)');
    });
  });

  describe('nav tags link', () => {
    it('page.html contains Tags link', () => {
      const html = readFileSync(join(OUTPUT_DIR, 'javascript.html'), 'utf-8');
      expect(html).toContain('href="tags.html"');
      expect(html).toContain('class="nav-tags"');
    });

    it('index.html contains Tags link', () => {
      const html = readFileSync(join(OUTPUT_DIR, 'index.html'), 'utf-8');
      expect(html).toContain('href="tags.html"');
      expect(html).toContain('class="nav-tags"');
    });
  });

  describe('index page', () => {
    it('lists all pages', () => {
      const html = readFileSync(join(OUTPUT_DIR, 'index.html'), 'utf-8');
      expect(html).toContain('javascript.html');
      expect(html).toContain('typescript.html');
      expect(html).toContain('react.html');
      expect(html).toContain('standalone.html');
    });

    it('includes graph data', () => {
      const html = readFileSync(join(OUTPUT_DIR, 'index.html'), 'utf-8');
      expect(html).toContain('"nodes"');
      expect(html).toContain('"links"');
    });
  });
});
