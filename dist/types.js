/**
 * `[[target]]` or `[[target|display]]`.
 * Global flag: use only with `String#matchAll` / `String#replace`, which do not
 * share `lastIndex` state. Never call `.exec` / `.test` on it directly.
 */
export const WIKILINK_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
