/**
 * Command-line argument parsing — pure.
 */
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
export declare function parseArgs(argv: string[], cwd: string): CliArgs;
