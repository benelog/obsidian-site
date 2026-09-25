/**
 * Command-line argument parsing — pure.
 */

import { resolve } from 'path';

export interface CliArgs {
  /** First positional argument; empty string when none was given. */
  command: string;
  /** Absolute vault path (`--source`), defaulting to `cwd`. */
  source: string;
  /** `--output`, kept relative so it is resolved against the vault. */
  output?: string;
  /** `--port`; undefined when absent or not a number. */
  port?: number;
}

/**
 * Parse `argv` (without the node and script entries). Unknown flags are
 * ignored, and only the first positional argument becomes the command.
 */
export function parseArgs(argv: string[], cwd: string): CliArgs {
  let command = '';
  let source = cwd;
  let output: string | undefined;
  let port: number | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const hasValue = i + 1 < argv.length;

    if (arg === '--source' && hasValue) {
      source = resolve(cwd, argv[++i]);
    } else if (arg === '--output' && hasValue) {
      output = argv[++i];
    } else if (arg === '--port' && hasValue) {
      const parsed = parseInt(argv[++i], 10);
      port = Number.isNaN(parsed) ? undefined : parsed;
    } else if (!arg.startsWith('-') && !command) {
      command = arg;
    }
  }

  return { command, source, output, port };
}
