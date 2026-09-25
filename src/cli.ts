#!/usr/bin/env node

/**
 * CLI entry point for obsidian-site.
 *
 * Usage:
 *   obsidian-site build       [--source <path>] [--output <path>]
 *   obsidian-site serve       [--source <path>] [--output <path>] [--port <number>]
 *   obsidian-site init-theme  [--source <path>]
 */

import { parseArgs } from './args.js';
import { build, type BuildResult } from './build.js';
import { serve, DEFAULT_PORT } from './serve.js';
import { initTheme } from './theme.js';

function printUsage(): void {
  console.log(`Usage: obsidian-site <command> [options]

Commands:
  build              Build the static site
  serve (server)     Build and start a local preview server
  init-theme         Copy built-in layouts and styles to vault for customization

Options:
  --source <path>    Path to the Obsidian vault (default: current directory)
  --output <path>    Output directory (overrides site.yaml setting)
  --port <number>    Port for the preview server (default: ${DEFAULT_PORT})`);
}

function printBuildSummary(result: BuildResult): void {
  console.log(`Source: ${result.source}`);
  console.log(`Output: ${result.output}`);
  console.log(`Found ${result.pageCount} pages`);
  console.log(`Graph: ${result.nodeCount} nodes, ${result.edgeCount} edges`);
  console.log(`Generated ${result.pageCount} pages + index.html → ${result.output}`);
}

const args = parseArgs(process.argv.slice(2), process.cwd());

switch (args.command) {
  case 'build':
    printBuildSummary(build({ source: args.source, output: args.output }));
    break;
  case 'serve':
  case 'server': {
    const result = build({ source: args.source, output: args.output });
    printBuildSummary(result);
    serve({ output: result.output, port: args.port });
    break;
  }
  case 'init-theme':
    initTheme(args.source);
    console.log(`Theme files initialized in ${args.source}`);
    break;
  default:
    printUsage();
    process.exit(args.command ? 1 : 0);
}
