/**
 * Command-line argument parsing — pure.
 */
import { resolve } from 'path';
/**
 * Parse `argv` (without the node and script entries). Unknown flags are
 * ignored, and only the first positional argument becomes the command.
 */
export function parseArgs(argv, cwd) {
    let command = '';
    let source = cwd;
    let output;
    let port;
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        const hasValue = i + 1 < argv.length;
        if (arg === '--source' && hasValue) {
            source = resolve(cwd, argv[++i]);
        }
        else if (arg === '--output' && hasValue) {
            output = argv[++i];
        }
        else if (arg === '--port' && hasValue) {
            const parsed = parseInt(argv[++i], 10);
            port = Number.isNaN(parsed) ? undefined : parsed;
        }
        else if (!arg.startsWith('-') && !command) {
            command = arg;
        }
    }
    return { command, source, output, port };
}
