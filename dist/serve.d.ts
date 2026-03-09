/**
 * Local development server for previewing the built site.
 */
import { type BuildOptions } from './build.js';
export interface ServeOptions extends BuildOptions {
    port?: number;
}
export declare function serve(options: ServeOptions): void;
