# CLAUDE.md

## Project Overview

A CLI tool and GitHub Action that builds a static website from an Obsidian vault. Distributed as an npm package (`obsidian-site`) and a composite GitHub Action (`benelog/obsidian-site`).

## Repository Structure

```
src/
  cli.ts        — CLI entry point (thin dispatcher; prints build summary)
  args.ts       — parseArgs (pure)
  build.ts      — Orchestration: scanVault → buildSiteModel → renderSite → writeSite; returns BuildResult
  config.ts     — site.yaml defaults and parsing (parseConfig, loadConfig)
  note.ts       — Single-note parsing (parseFrontmatter, extractInlineTags, parseNote, extractTitle)
  site.ts       — SiteModel (pages, backlinks, graph, config) and in-memory renderSite
  theme.ts      — PACKAGE_DIR, LAYOUT_FILES, loadTemplates/loadStyles with _layouts/_styles overrides, initTheme
  types.ts      — Shared types and constants (WIKILINK_RE, PageInfo, SiteConfig)
  graph.ts      — Graph/link analysis (extractWikilinks, buildGraph, buildLocalGraph, buildBacklinks)
  render.ts     — HTML rendering (renderTemplate, buildPage, buildIndex, buildTagsPage, renderPageGraph)
  serve.ts      — Static preview server (resolveStaticFile is pure and tested)
__tests__/      — Test files (*.test.ts) plus shared helpers.ts
layouts/        — HTML templates (page.html, page-graph.html, index.html, tags.html) with {placeholder} syntax
styles/         — CSS (style.css)
dist/           — Compiled JS output (committed; the GitHub Action runs it directly from the tagged commit)
action.yml      — GitHub Action definition (composite, runs dist/cli.js)
```

## Key Design Decisions

- **Vault-agnostic**: The tool has no dependency on any specific vault. Vault path is passed via `--source` CLI arg or action input.
- **PACKAGE_DIR**: `theme.ts` resolves `layouts/` and `styles/` relative to its own location (`import.meta.url`), so templates are always found whether run from source or installed via npm.
- **Types in types.ts**: `WIKILINK_RE`, `PageInfo`, `SiteConfig`, `GitHubConfig` live in `types.ts` to avoid circular imports (both `graph.ts` and `render.ts` depend on them).
- **Pure core**: `note.ts`, `graph.ts`, `render.ts`, `site.ts`, `args.ts` never touch the filesystem. I/O lives in `build.ts`, `config.ts`, `theme.ts`, `serve.ts`, `cli.ts`.
- **Composite action**: `action.yml` runs `npm ci` in its own directory then invokes `dist/cli.js`. No separate bundling step needed.

## Build & Test

```bash
npm run build        # tsc → dist/
npm test             # vitest run
npm run typecheck    # tsc over src/ and __tests__/ (tests are not type-checked by vitest)
```

## Publishing Checklist

- `npm run build` must succeed before publish (`prepublishOnly` hook runs `tsc`)
- For GitHub Action releases, tag the commit (e.g., `v0.1.0`) and update the major version tag (`v0`)

## Git Conventions

- Do not use conventional commit prefixes (e.g., `feat:`, `fix:`, `chore:`). Start commit messages with a plain description.

## Conventions

- Content directory supports nested folders — all `.md` files are scanned recursively
- Filename = page title (hyphens replaced with spaces)
- Sidebar "Related" lists every wikilink in the note; a trailing `## Related` section is stripped from the body so the links are not shown twice
- Backlinks are auto-generated (reverse wikilink index)
- Headings downgraded by one level during render (template uses filename as `<h1>`)
