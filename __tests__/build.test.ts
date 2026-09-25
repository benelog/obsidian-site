import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync, writeFileSync, existsSync, rmSync, mkdirSync, mkdtempSync, cpSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { build, type BuildResult } from '../src/build.js';

const FIXTURE_DIR = join(import.meta.dirname, 'fixtures', 'sample-vault');

/** Copy the sample vault into a fresh temp directory so tests never share state. */
function makeVault(): string {
  const dir = mkdtempSync(join(tmpdir(), 'obsidian-site-'));
  cpSync(FIXTURE_DIR, dir, { recursive: true });
  return dir;
}

function readOutput(result: BuildResult, name: string): string {
  return readFileSync(join(result.output, name), 'utf-8');
}

describe('build integration', () => {
  let vault: string;
  let result: BuildResult;

  beforeAll(() => {
    vault = makeVault();
    result = build({ source: vault });
  });

  afterAll(() => {
    rmSync(vault, { recursive: true, force: true });
  });

  it('writes output under the configured output directory', () => {
    expect(result.output).toBe(join(vault, 'public'));
  });

  it('reports counts', () => {
    expect(result.pageCount).toBe(6);
    expect(result.nodeCount).toBe(6);
    expect(result.edgeCount).toBeGreaterThan(0);
  });

  it('generates HTML files for each markdown page', () => {
    for (const name of ['javascript', 'typescript', 'react', 'standalone']) {
      expect(existsSync(join(result.output, `${name}.html`))).toBe(true);
    }
  });

  it('generates index.html and tags.html', () => {
    expect(existsSync(join(result.output, 'index.html'))).toBe(true);
    expect(existsSync(join(result.output, 'tags.html'))).toBe(true);
  });

  it('copies style.css', () => {
    expect(existsSync(join(result.output, 'style.css'))).toBe(true);
  });

  describe('site config', () => {
    it('applies site title and subtitle from site.yaml', () => {
      const html = readOutput(result, 'index.html');
      expect(html).toContain('Sample Site');
      expect(html).toContain('A test site for integration testing');
    });
  });

  describe('page rendering', () => {
    it('uses frontmatter title as page heading', () => {
      expect(readOutput(result, 'javascript.html')).toContain('<h1>JavaScript</h1>');
    });

    it('uses filename as title when no frontmatter title', () => {
      expect(readOutput(result, 'standalone.html')).toContain('<h1>standalone</h1>');
    });

    it('renders wikilinks as anchor tags', () => {
      const html = readOutput(result, 'javascript.html');
      expect(html).toContain('<a href="typescript.html" class="wikilink">');
      expect(html).toContain('<a href="react.html" class="wikilink">');
    });

    it('renders broken wikilinks as spans', () => {
      expect(readOutput(result, 'react.html')).toContain('<span class="broken-link">missing page</span>');
    });

    it('renders Related section in sidebar', () => {
      expect(readOutput(result, 'javascript.html')).toContain('class="related"');
    });

    it('renders backlinks in sidebar', () => {
      // typescript is linked from both javascript and react
      const html = readOutput(result, 'typescript.html');
      expect(html).toContain('class="backlinks"');
      expect(html).toContain('javascript.html');
      expect(html).toContain('react.html');
    });

    it('renders edit link with GitHub config', () => {
      expect(readOutput(result, 'javascript.html')).toContain('https://github.com/example/sample-vault');
    });

    it('displays tags on page with links to tags page', () => {
      const html = readOutput(result, 'javascript.html');
      expect(html).toContain('class="page-tags"');
      expect(html).toContain('<a href="tags.html#tag-programming" class="page-tag">#programming</a>');
      expect(html).toContain('<a href="tags.html#tag-web" class="page-tag">#web</a>');
    });

    it('does not render tags div when page has no tags', () => {
      expect(readOutput(result, 'standalone.html')).not.toContain('class="page-tags"');
    });
  });

  describe('tags page', () => {
    it('contains tags from frontmatter', () => {
      const html = readOutput(result, 'tags.html');
      expect(html).toContain('programming');
      expect(html).toContain('web');
      expect(html).toContain('frontend');
    });

    it('lists pages under each tag', () => {
      const html = readOutput(result, 'tags.html');
      expect(html).toContain('javascript.html');
      expect(html).toContain('react.html');
    });

    it('shows tag count', () => {
      // programming tag has 3 pages (javascript, react, typescript)
      expect(readOutput(result, 'tags.html')).toContain('(3)');
    });
  });

  describe('nav tags link', () => {
    it('page.html and index.html contain Tags link', () => {
      for (const name of ['javascript.html', 'index.html']) {
        const html = readOutput(result, name);
        expect(html).toContain('href="tags.html"');
        expect(html).toContain('class="nav-tags"');
      }
    });
  });

  describe('index page', () => {
    it('lists all pages', () => {
      const html = readOutput(result, 'index.html');
      for (const name of ['javascript', 'typescript', 'react', 'standalone']) {
        expect(html).toContain(`${name}.html`);
      }
    });

    it('includes graph data', () => {
      const html = readOutput(result, 'index.html');
      expect(html).toContain('"nodes"');
      expect(html).toContain('"links"');
    });
  });
});

describe('output override', () => {
  let vault: string;

  beforeAll(() => {
    vault = makeVault();
  });

  afterAll(() => {
    rmSync(vault, { recursive: true, force: true });
  });

  it('writes to --output instead of site.yaml output-directory', () => {
    const result = build({ source: vault, output: 'dist-site' });
    expect(result.output).toBe(join(vault, 'dist-site'));
    expect(existsSync(join(vault, 'dist-site', 'index.html'))).toBe(true);
    expect(existsSync(join(vault, 'public'))).toBe(false);
  });
});

describe('custom theme override', () => {
  let vault: string;

  beforeAll(() => {
    vault = makeVault();
  });

  afterAll(() => {
    rmSync(vault, { recursive: true, force: true });
  });

  it('uses custom page.html from _layouts/ and built-in templates for the rest', () => {
    const layoutsDir = join(vault, '_layouts');
    mkdirSync(layoutsDir, { recursive: true });
    writeFileSync(join(layoutsDir, 'page.html'), '<html><body>CUSTOM-PAGE {content}</body></html>');
    const result = build({ source: vault });

    expect(readOutput(result, 'javascript.html')).toContain('CUSTOM-PAGE');
    const index = readOutput(result, 'index.html');
    expect(index).not.toContain('CUSTOM-PAGE');
    expect(index).toContain('Sample Site');
  });

  it('copies custom CSS files from _styles/ instead of built-in, ignoring non-CSS', () => {
    const stylesDir = join(vault, '_styles');
    mkdirSync(stylesDir, { recursive: true });
    writeFileSync(join(stylesDir, 'style.css'), '/* custom style */');
    writeFileSync(join(stylesDir, 'extra.css'), '/* extra style */');
    writeFileSync(join(stylesDir, 'readme.txt'), 'not css');
    const result = build({ source: vault });

    expect(readOutput(result, 'style.css')).toBe('/* custom style */');
    expect(readOutput(result, 'extra.css')).toBe('/* extra style */');
    expect(existsSync(join(result.output, 'readme.txt'))).toBe(false);
  });
});
