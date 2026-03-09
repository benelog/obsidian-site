/**
 * Local development server for previewing the built site.
 */
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname, resolve } from 'path';
import { build, loadConfig } from './build.js';
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};
export function serve(options) {
    build(options);
    const source = resolve(options.source);
    const config = loadConfig(source);
    if (options.output) {
        config['output-directory'] = options.output;
    }
    const output = resolve(source, config['output-directory']);
    const port = options.port ?? 8000;
    const server = createServer((req, res) => {
        let urlPath = req.url ?? '/';
        urlPath = urlPath.split('?')[0];
        if (urlPath === '/') {
            urlPath = '/index.html';
        }
        const filePath = join(output, urlPath);
        if (!existsSync(filePath) || !statSync(filePath).isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
            return;
        }
        const ext = extname(filePath);
        const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';
        const content = readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
    server.listen(port, () => {
        console.log(`\nServing at http://localhost:${port}/`);
        console.log('Press Ctrl+C to stop.');
    });
}
