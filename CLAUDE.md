# CLAUDE.md

## Project Overview

A CLI tool and GitHub Action that builds a static website from an Obsidian vault. Distributed as an npm package (`obsidian-site`) and a composite GitHub Action (`benelog/obsidian-site`).

## Repository Structure

```
src/
  cli.ts        — CLI entry point (arg parsing, delegates to build())
  build.ts      — Core build logic (loadConfig, scanVault, build)
  types.ts      — Shared types and constants (WIKILINK_RE, PageInfo, SiteConfig)
  graph.ts      — Graph/link analysis (extractWikilinks, buildGraph, buildBacklinks)
  render.ts     — HTML rendering (convertMarkdown, processWikilinks, buildPage, buildIndex)
  serve.ts      — Local development server for previewing the built site
__tests__/      — Test files (*.test.ts)
layouts/        — HTML templates (page.html, index.html, tags.html) with {placeholder} syntax
styles/         — CSS (style.css)
dist/           — Compiled JS output (gitignored)
action.yml      — GitHub Action definition (composite, runs dist/cli.js)
```

## Key Design Decisions

- **Vault-agnostic**: The tool has no dependency on any specific vault. Vault path is passed via `--source` CLI arg or action input.
- **PACKAGE_DIR**: `build.ts` resolves `layouts/` and `styles/` relative to its own location (`import.meta.url`), so templates are always found whether run from source or installed via npm.
- **Types in types.ts**: `WIKILINK_RE`, `PageInfo`, `SiteConfig`, `GitHubConfig` live in `types.ts` to avoid circular imports (both `graph.ts` and `render.ts` depend on them).
- **Composite action**: `action.yml` runs `npm ci` in its own directory then invokes `dist/cli.js`. No separate bundling step needed.

## Build & Test

```bash
npm run build        # tsc → dist/
npm test             # vitest run
```

## Publishing Checklist

- `npm run build` must succeed before publish (`prepublishOnly` hook runs `tsc`)
- For GitHub Action releases, tag the commit (e.g., `v0.1.0`) and update the major version tag (`v0`)

## Git Conventions

- Do not use conventional commit prefixes (e.g., `feat:`, `fix:`, `chore:`). Start commit messages with a plain description.

## Conventions

- Content directory supports nested folders — all `.md` files are scanned recursively
- Filename = page title (hyphens replaced with spaces)
- `## Related` section in notes is parsed out and rendered in the sidebar
- Backlinks are auto-generated (reverse wikilink index)
- Headings downgraded by one level during render (template uses filename as `<h1>`)
