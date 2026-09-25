/**
 * Theme resolution: HTML layouts and CSS come from the package by default,
 * and a vault can override them with `_layouts/` and `_styles/` directories.
 */
/** Root of the installed package, where `layouts/` and `styles/` live. */
export declare const PACKAGE_DIR: string;
export declare const LAYOUT_FILES: readonly ["page.html", "index.html", "tags.html"];
export type LayoutName = (typeof LAYOUT_FILES)[number];
export type Templates = Record<LayoutName, string>;
export declare const BUILTIN_STYLE = "style.css";
/** Vault-relative directories that override the built-in theme. */
export declare const USER_LAYOUTS_DIR = "_layouts";
export declare const USER_STYLES_DIR = "_styles";
/** Load every layout, preferring the vault's `_layouts/` copy file by file. */
export declare function loadTemplates(source: string): Templates;
/**
 * CSS files to ship with the site, keyed by output filename.
 * If the vault has a `_styles/` directory, every `.css` in it replaces the
 * built-in stylesheet entirely.
 */
export declare function loadStyles(source: string): Map<string, string>;
