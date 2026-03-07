/**
 * Core build logic for generating a static website from an Obsidian vault.
 */
import type { PageInfo, SiteConfig } from './types.js';
export declare function loadConfig(source: string): SiteConfig;
export declare function scanVault(source: string, contentDirectory: string): Map<string, PageInfo>;
export interface BuildOptions {
    source: string;
    output?: string;
}
export declare function build(options: BuildOptions): void;
