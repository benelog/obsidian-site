/**
 * Local development server for previewing a built site directory.
 */
export declare const DEFAULT_PORT = 8000;
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
export declare function resolveStaticFile(root: string, url: string): StaticFile | null;
export declare function serve(options: ServeOptions): void;
