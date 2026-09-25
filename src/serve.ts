/**
 * Local development server for previewing a built site directory.
 */

import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { extname, resolve, sep } from 'path';

const MIME_TYPES: Record<string, string> = {
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

export const DEFAULT_PORT = 8000;

export interface ServeOptions {
  /** Directory to serve. */
  output: string;
  port?: number;
}

export interface StaticFile {
  path: string;
  contentType: string;
}

/**
 * Map a request URL to a file inside `root`, or null when the URL does not
 * name a regular file within it. `/` serves `index.html`; the query string is
 * ignored and percent-encoding is decoded.
 */
export function resolveStaticFile(root: string, url: string): StaticFile | null {
  let urlPath = url.split('?')[0];
  try {
    urlPath = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  if (urlPath === '/') urlPath = '/index.html';

  const rootDir = resolve(root);
  const filePath = resolve(rootDir, `.${urlPath}`);
  if (!filePath.startsWith(rootDir + sep)) return null;
  if (!existsSync(filePath) || !statSync(filePath).isFile()) return null;

  return {
    path: filePath,
    contentType: MIME_TYPES[extname(filePath)] ?? 'application/octet-stream',
  };
}

export function serve(options: ServeOptions): void {
  const port = options.port ?? DEFAULT_PORT;

  const server = createServer((req, res) => {
    const file = resolveStaticFile(options.output, req.url ?? '/');
    if (!file) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': file.contentType });
    res.end(readFileSync(file.path));
  });

  server.listen(port, () => {
    console.log(`\nServing at http://localhost:${port}/`);
    console.log('Press Ctrl+C to stop.');
  });
}
