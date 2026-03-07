# obsidian-site

A static site generator for [Obsidian](https://obsidian.md/) vaults. Converts your Markdown notes into a browsable website with an interactive link graph, wikilink navigation, and auto-generated backlinks.

## Quick Start

### Using the CLI

```bash
npx github:benelog/obsidian-site build --source /path/to/vault
```

Or install globally:

```bash
npm install -g github:benelog/obsidian-site
obsidian-site build --source /path/to/vault
```

This reads your vault, generates HTML pages, and writes them to `public/` (or the directory specified in `site.yaml`).

### Using the GitHub Action

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deploy.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: benelog/obsidian-site@v1
      - uses: actions/upload-pages-artifact@v3
        with:
          path: public
      - id: deploy
        uses: actions/deploy-pages@v4
```

#### Action Inputs

| Input    | Default | Description                              |
|----------|---------|------------------------------------------|
| `source` | `.`     | Path to the Obsidian vault               |
| `output` |         | Output directory (overrides `site.yaml`) |

## Configuration

Create a `site.yaml` in your vault root:

```yaml
title: My Notes
subtitle: A collection of dev notes
lang: en
content-directory: content
output-directory: public
gitHub:
  repository-url: https://github.com/user/repo
  content-branch: main
```

| Key                 | Default              | Description                                          |
|---------------------|----------------------|------------------------------------------------------|
| `title`             | Directory name       | Site title shown in navigation                       |
| `subtitle`          | (empty)              | Subtitle shown on the index page                     |
| `lang`              | `en`                 | HTML `lang` attribute                                |
| `content-directory` | `content`            | Directory containing `.md` files (relative to vault) |
| `output-directory`  | `public`             | Build output directory (relative to vault)           |
| `gitHub`            |                      | GitHub integration settings                          |

Setting `gitHub.repository-url` and `gitHub.content-branch` adds an "Edit" link to each page that points to the source file on GitHub.

## CLI Reference

```
obsidian-site build [options]

Options:
  --source <path>   Path to the Obsidian vault (default: current directory)
  --output <path>   Output directory (overrides site.yaml setting)
```

## How It Works

### Notes

- All `.md` files in the content directory become pages
- The filename becomes the page title (`spring-boot` -> "spring boot")
- Headings are downgraded by one level (`#` -> `##`, `##` -> `###`) since the filename is rendered as `<h1>`

### Wikilinks

- `[[target]]` links to `target.html` with display text derived from the filename
- `[[target|custom text]]` links to `target.html` with the specified display text
- Links to non-existent pages are rendered as strikethrough text

### Related & Backlinks

- A `## Related` section in your note is extracted and rendered in the sidebar
- Backlinks (pages that link to the current page) are automatically generated in the sidebar

### Index Page

The index page includes:
- An interactive D3.js graph visualization of all note connections
- A searchable list of all pages

## Local Preview

```bash
npx github:benelog/obsidian-site build --source /path/to/vault
python3 -m http.server 8000 -d /path/to/vault/public
```

## Template Repository

Use [obsidian-site-template](https://github.com/benelog/obsidian-site-template) to create a new site from scratch with a pre-configured GitHub Actions workflow.

## License

MIT
