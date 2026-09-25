/**
 * Build orchestration: scan the vault, render in memory, write to disk.
 */
import { type SiteFiles } from './site.js';
import type { PageInfo, SiteConfig } from './types.js';
export interface BuildOptions {
    source: string;
    /** Overrides `output-directory` from site.yaml. */
    output?: string;
}
export interface BuildResult {
    source: string;
    output: string;
    config: SiteConfig;
    pageCount: number;
    nodeCount: number;
    edgeCount: number;
}
/**
 * Read every `.md` under the content directory (or the vault root if the
 * content directory does not exist), keyed by filename stem.
 */
export declare function scanVault(source: string, contentDirectory: string): Map<string, PageInfo>;
export declare function writeSite(files: SiteFiles, output: string): void;
export declare function build(options: BuildOptions): BuildResult;
