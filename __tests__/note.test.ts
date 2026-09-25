import { describe, it, expect } from 'vitest';
import { extractTitle, parseFrontmatter, extractInlineTags, parseNote } from '../src/note.js';

describe('extractTitle', () => {
  it('replaces hyphens with spaces', () => {
    expect(extractTitle('spring-boot')).toBe('spring boot');
  });

  it('returns as-is when no hyphens', () => {
    expect(extractTitle('react')).toBe('react');
  });
});

describe('parseFrontmatter', () => {
  it('returns whole text as body when there is no frontmatter', () => {
    const { frontmatter, body } = parseFrontmatter('# Hello\n\ntext');
    expect(frontmatter).toEqual({ tags: [] });
    expect(body).toBe('# Hello\n\ntext');
  });

  it('reads title and tags', () => {
    const raw = '---\ntitle: My Title\ntags:\n  - a\n  - b\n---\nbody';
    const { frontmatter, body } = parseFrontmatter(raw);
    expect(frontmatter).toEqual({ title: 'My Title', tags: ['a', 'b'] });
    expect(body).toBe('body');
  });

  it('keeps blank lines that follow the closing fence', () => {
    const { body } = parseFrontmatter('---\ntitle: T\n---\n\n\nbody');
    expect(body).toBe('\n\nbody');
  });

  it('handles frontmatter with nothing after it', () => {
    const { frontmatter, body } = parseFrontmatter('---\ntitle: T\n---');
    expect(frontmatter.title).toBe('T');
    expect(body).toBe('');
  });

  it('handles CRLF line endings', () => {
    const { frontmatter, body } = parseFrontmatter('---\r\ntitle: T\r\n---\r\nbody');
    expect(frontmatter.title).toBe('T');
    expect(body).toBe('body');
  });

  it('ignores non-string title and non-string tags', () => {
    const raw = '---\ntitle: 42\ntags:\n  - ok\n  - 7\n  - [nested]\n---\nbody';
    const { frontmatter } = parseFrontmatter(raw);
    expect(frontmatter.title).toBeUndefined();
    expect(frontmatter.tags).toEqual(['ok']);
  });

  it('treats a scalar tags value as no tags', () => {
    const { frontmatter } = parseFrontmatter('---\ntags: single\n---\nbody');
    expect(frontmatter.tags).toEqual([]);
  });

  it('does not treat a horizontal rule mid-document as frontmatter', () => {
    const raw = 'intro\n---\ntitle: nope\n---\n';
    const { frontmatter, body } = parseFrontmatter(raw);
    expect(frontmatter.title).toBeUndefined();
    expect(body).toBe(raw);
  });
});

describe('extractInlineTags', () => {
  it('extracts tags at line start and after whitespace', () => {
    expect(extractInlineTags('#alpha text #beta\n#gamma')).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('supports Korean tags', () => {
    expect(extractInlineTags('노트 #프로그래밍 #웹-개발')).toEqual(['프로그래밍', '웹-개발']);
  });

  it('deduplicates', () => {
    expect(extractInlineTags('#a #a\n#a')).toEqual(['a']);
  });

  it('skips markdown headings', () => {
    expect(extractInlineTags('# Heading\n## Sub #notatag\ntext #real')).toEqual(['real']);
  });

  it('skips fenced code blocks', () => {
    const body = 'before #x\n```\n#inside\n```\nafter #y';
    expect(extractInlineTags(body)).toEqual(['x', 'y']);
  });

  it('skips hashes inside wikilinks', () => {
    expect(extractInlineTags('see [[page#section]] and [[note|#alias]] #tag')).toEqual(['tag']);
  });

  it('ignores hashes that are not preceded by whitespace', () => {
    expect(extractInlineTags('a#b c#d #e')).toEqual(['e']);
  });

  it('ignores tags that start with a digit', () => {
    expect(extractInlineTags('#1 #2nd #ok')).toEqual(['ok']);
  });
});

describe('parseNote', () => {
  it('uses frontmatter title when present', () => {
    const note = parseNote('my-page', '---\ntitle: Custom\n---\nbody');
    expect(note.title).toBe('Custom');
  });

  it('falls back to the stem with hyphens replaced', () => {
    const note = parseNote('my-page', 'body');
    expect(note.title).toBe('my page');
  });

  it('merges frontmatter tags first, then inline tags, without duplicates', () => {
    const note = parseNote('n', '---\ntags: [web, dev]\n---\ntext #dev #extra');
    expect(note.tags).toEqual(['web', 'dev', 'extra']);
  });

  it('returns the body without frontmatter as content', () => {
    const note = parseNote('n', '---\ntitle: T\n---\nHello');
    expect(note.content).toBe('Hello');
  });
});
