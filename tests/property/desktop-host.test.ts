import { expect, it } from 'vitest';
import fc from 'fast-check';
import { join, relative, isAbsolute } from 'node:path';
import { tmpdir } from 'node:os';
import { assetPath } from '../../packages/desktop-cli-runtime/src/editor-host.js';
it('arbitrary asset names never resolve outside the asset root', () => {
  const root = join(tmpdir(), 'assets');
  fc.assert(fc.property(fc.string(), input => {
    let resolved: string;
    try { resolved = assetPath(root, input); } catch { return; }
    const rel = relative(root, resolved);
    expect(isAbsolute(rel) || rel.startsWith('..')).toBe(false);
  }), { numRuns: 500 });
});
