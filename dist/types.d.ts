/**
 * `[[target]]` or `[[target|display]]`.
 * Global flag: use only with `String#matchAll` / `String#replace`, which do not
 * share `lastIndex` state. Never call `.exec` / `.test` on it directly.
 */
export declare const WIKILINK_RE: RegExp;
export interface PageInfo {
    path: string;
    title: string;
    content: string;
    tags: string[];
}
export interface GitHubConfig {
    'repository-url': string;
    'content-branch'?: string;
}
export interface SiteConfig {
    title: string;
    subtitle: string;
    lang: string;
    'content-directory': string;
    'output-directory': string;
    gitHub?: GitHubConfig;
}
