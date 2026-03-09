#!/usr/bin/env node

/**
 * CLI entry point for obsidian-site.
 *
 * Usage:
 *   obsidian-site build  [--source <path>] [--output <path>]
 *   obsidian-site serve  [--source <path>] [--output <path>] [--port <number>]
 */

import { resolve, join } from 'path';
import { mkdirSync, copyFileSync } from 'fs';
import { build, PACKAGE_DIR } from './build.js';
import { serve } from './serve.js';

function printUsage(): void {
  console.log(`Usage: obsidian-site <command> [options]

Commands:
  build              Build the static site
  serve (server)     Build and start a local preview server
  init-theme         Copy built-in layouts and styles to vault for customization

Options:
  --source <path>    Path to the Obsidian vault (default: current directory)
  --output <path>    Output directory (overrides site.yaml setting)
  --port <number>    Port for the preview server (default: 8000)`);
}

function parseArgs(argv: string[]): { command: string; source: string; output?: string; port?: number } {
  const args = argv.slice(2);
  let command = '';
  let source = process.cwd();
  let output: string | undefined;
  let port: number | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--source' && i + 1 < args.length) {
      source = resolve(args[++i]);
    } else if (args[i] === '--output' && i + 1 < args.length) {
      output = args[++i];
    } else if (args[i] === '--port' && i + 1 < args.length) {
      port = parseInt(args[++i], 10);
    } else if (!args[i].startsWith('-') && !command) {
      command = args[i];
    }
  }

  return { command, source, output, port };
}

const args = parseArgs(process.argv);

switch (args.command) {
  case 'build':
    build({ source: args.source, output: args.output });
    break;
  case 'serve':
  case 'server':
    serve({ source: args.source, output: args.output, port: args.port });
    break;
  case 'init-theme': {
    const dest = args.source;
    const layoutsDir = join(dest, '_layouts');
    const stylesDir = join(dest, '_styles');
    mkdirSync(layoutsDir, { recursive: true });
    mkdirSync(stylesDir, { recursive: true });
    for (const f of ['page.html', 'index.html', 'tags.html']) {
      copyFileSync(join(PACKAGE_DIR, 'layouts', f), join(layoutsDir, f));
    }
    copyFileSync(join(PACKAGE_DIR, 'styles', 'style.css'), join(stylesDir, 'style.css'));
    console.log(`Theme files initialized in ${dest}`);
    break;
  }
  default:
    printUsage();
    process.exit(args.command ? 1 : 0);
}
