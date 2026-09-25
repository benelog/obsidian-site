/**
 * Site configuration: defaults merged with the vault's `site.yaml`.
 */
import type { SiteConfig } from './types.js';
export declare const CONFIG_FILE = "site.yaml";
export declare function defaultConfig(source: string): SiteConfig;
/**
 * Merge the YAML text of a `site.yaml` over the defaults. Keys present in the
 * YAML win; anything that is not a mapping is ignored.
 */
export declare function parseConfig(yamlText: string, defaults: SiteConfig): SiteConfig;
export declare function loadConfig(source: string): SiteConfig;
