/**
 * Theme resolution: HTML layouts and CSS come from the package by default,
 * and a vault can override them with `_layouts/` and `_styles/` directories.
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { resolve, join, extname } from 'path';
import { fileURLToPath } from 'url';
/** Root of the installed package, where `layouts/` and `styles/` live. */
export const PACKAGE_DIR = resolve(fileURLToPath(import.meta.url), '..', '..');
export const LAYOUT_FILES = ['page.html', 'index.html', 'tags.html'];
export const BUILTIN_STYLE = 'style.css';
/** Vault-relative directories that override the built-in theme. */
export const USER_LAYOUTS_DIR = '_layouts';
export const USER_STYLES_DIR = '_styles';
function resolveTemplate(source, name) {
    const userPath = join(source, USER_LAYOUTS_DIR, name);
    const builtinPath = join(PACKAGE_DIR, 'layouts', name);
    return readFileSync(existsSync(userPath) ? userPath : builtinPath, 'utf-8');
}
/** Load every layout, preferring the vault's `_layouts/` copy file by file. */
export function loadTemplates(source) {
    const templates = {};
    for (const name of LAYOUT_FILES) {
        templates[name] = resolveTemplate(source, name);
    }
    return templates;
}
/**
 * CSS files to ship with the site, keyed by output filename.
 * If the vault has a `_styles/` directory, every `.css` in it replaces the
 * built-in stylesheet entirely.
 */
export function loadStyles(source) {
    const styles = new Map();
    const userDir = join(source, USER_STYLES_DIR);
    if (existsSync(userDir)) {
        for (const file of readdirSync(userDir)) {
            if (extname(file) === '.css') {
                styles.set(file, readFileSync(join(userDir, file), 'utf-8'));
            }
        }
    }
    else {
        styles.set(BUILTIN_STYLE, readFileSync(join(PACKAGE_DIR, 'styles', BUILTIN_STYLE), 'utf-8'));
    }
    return styles;
}
