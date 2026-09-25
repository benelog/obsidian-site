/**
 * Site configuration: defaults merged with the vault's `site.yaml`.
 */
import { readFileSync, existsSync } from 'fs';
import { basename, join } from 'path';
import { parse as parseYaml } from 'yaml';
export const CONFIG_FILE = 'site.yaml';
export function defaultConfig(source) {
    return {
        title: basename(source),
        subtitle: '',
        lang: 'en',
        'content-directory': 'content',
        'output-directory': 'public',
    };
}
/**
 * Merge the YAML text of a `site.yaml` over the defaults. Keys present in the
 * YAML win; anything that is not a mapping is ignored.
 */
export function parseConfig(yamlText, defaults) {
    const data = parseYaml(yamlText);
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        return { ...defaults };
    }
    return { ...defaults, ...data };
}
export function loadConfig(source) {
    const defaults = defaultConfig(source);
    const configPath = join(source, CONFIG_FILE);
    if (!existsSync(configPath))
        return defaults;
    return parseConfig(readFileSync(configPath, 'utf-8'), defaults);
}
