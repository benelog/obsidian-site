#!/usr/bin/env node
/**
 * CLI entry point for obsidian-site.
 *
 * Usage:
 *   obsidian-site build [--source <path>] [--output <path>]
 */
import { resolve } from 'path';
import { build } from './build.js';
function printUsage() {
    console.log(`Usage: obsidian-site build [options]

Options:
  --source <path>   Path to the Obsidian vault (default: current directory)
  --output <path>   Output directory (overrides site.yaml setting)`);
}
function parseArgs(argv) {
    const args = argv.slice(2);
    let command = '';
    let source = process.cwd();
    let output;
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--source' && i + 1 < args.length) {
            source = resolve(args[++i]);
        }
        else if (args[i] === '--output' && i + 1 < args.length) {
            output = args[++i];
        }
        else if (!args[i].startsWith('-') && !command) {
            command = args[i];
        }
    }
    return { command, source, output };
}
const args = parseArgs(process.argv);
if (args.command !== 'build') {
    printUsage();
    process.exit(args.command ? 1 : 0);
}
build({ source: args.source, output: args.output });
