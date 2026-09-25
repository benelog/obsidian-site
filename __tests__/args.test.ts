import { describe, it, expect } from 'vitest';
import { resolve } from 'path';
import { parseArgs } from '../src/args.js';

const CWD = '/work/vault';

describe('parseArgs', () => {
  it('defaults to no command and the current directory as source', () => {
    expect(parseArgs([], CWD)).toEqual({ command: '', source: CWD, output: undefined, port: undefined });
  });

  it('takes the first positional argument as the command', () => {
    expect(parseArgs(['build', 'extra'], CWD).command).toBe('build');
  });

  it('resolves --source against cwd', () => {
    expect(parseArgs(['build', '--source', 'notes'], CWD).source).toBe(resolve(CWD, 'notes'));
    expect(parseArgs(['build', '--source', '/abs/notes'], CWD).source).toBe('/abs/notes');
  });

  it('keeps --output as given', () => {
    expect(parseArgs(['build', '--output', 'dist'], CWD).output).toBe('dist');
  });

  it('parses --port as a number', () => {
    expect(parseArgs(['serve', '--port', '3000'], CWD).port).toBe(3000);
  });

  it('ignores a non-numeric --port', () => {
    expect(parseArgs(['serve', '--port', 'abc'], CWD).port).toBeUndefined();
  });

  it('ignores a flag with no value', () => {
    const args = parseArgs(['build', '--source'], CWD);
    expect(args.command).toBe('build');
    expect(args.source).toBe(CWD);
  });

  it('ignores unknown flags', () => {
    expect(parseArgs(['--verbose', 'build'], CWD).command).toBe('build');
  });

  it('accepts flags before the command', () => {
    const args = parseArgs(['--source', 'v', 'serve', '--port', '1'], CWD);
    expect(args).toEqual({ command: 'serve', source: resolve(CWD, 'v'), output: undefined, port: 1 });
  });
});
