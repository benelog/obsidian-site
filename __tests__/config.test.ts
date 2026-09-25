import { describe, it, expect } from 'vitest';
import { defaultConfig, parseConfig } from '../src/config.js';

describe('defaultConfig', () => {
  it('uses the vault directory name as the title', () => {
    const config = defaultConfig('/tmp/my-vault');
    expect(config.title).toBe('my-vault');
    expect(config['content-directory']).toBe('content');
    expect(config['output-directory']).toBe('public');
    expect(config.lang).toBe('en');
  });
});

describe('parseConfig', () => {
  const defaults = defaultConfig('/tmp/vault');

  it('overrides defaults with values from YAML', () => {
    const config = parseConfig('title: Custom\nlang: ko\n', defaults);
    expect(config.title).toBe('Custom');
    expect(config.lang).toBe('ko');
    expect(config['content-directory']).toBe('content');
  });

  it('reads nested gitHub config', () => {
    const config = parseConfig('gitHub:\n  repository-url: https://github.com/x/y\n', defaults);
    expect(config.gitHub?.['repository-url']).toBe('https://github.com/x/y');
  });

  it('returns defaults for empty or non-mapping YAML', () => {
    expect(parseConfig('', defaults)).toEqual(defaults);
    expect(parseConfig('- a\n- b\n', defaults)).toEqual(defaults);
    expect(parseConfig('just a string', defaults)).toEqual(defaults);
  });

  it('does not mutate the defaults', () => {
    parseConfig('title: Changed', defaults);
    expect(defaults.title).toBe('vault');
  });
});
