import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { expect, it } from 'vitest';
import { createEditorRuntime } from '../../packages/graph-worker/src/editor-runtime.js';

it('persists real pages and block text across reopening and rejects stale/raw commands', async () => {
  const path = join(mkdtempSync(join(tmpdir(), 'tessera-editor-')), 'graph.sqlite');
  let runtime = createEditorRuntime(path);
  let state = await runtime.read();
  const run = async (command: unknown) => {
    const reply = await runtime.execute({ operationId: randomUUID(), revision: state.revision, command });
    state = reply.snapshot; return reply;
  };
  try {
    const page = (await run({ kind: 'page.create', title: 'Notes' })).focus!;
    const a = (await run({ kind: 'block.insert', parent: page, content: 'Hello world' })).focus!;
    const right = (await run({ kind: 'block.split', uuid: a, offset: 6 })).focus!;
    expect(state.blocks.map(b => b.content)).toEqual(expect.arrayContaining(['Hello ', 'world']));
    await run({ kind: 'block.indent', uuids: [right] });
    expect(state.blocks.find(b => b.uuid === right)?.parent).toBe(a);
    const committed = state.revision;
    await expect(runtime.execute({ operationId: randomUUID(), revision: committed - 1, command: { kind: 'block.update', uuid: a, content: 'lost' } })).rejects.toThrow('STALE');
    await expect(runtime.execute({ operationId: randomUUID(), revision: committed, command: { kind: 'raw.datom' } })).rejects.toThrow();
    await runtime.close(); runtime = createEditorRuntime(path);
    state = await runtime.read();
    expect(state.pages.find(p => p.uuid === page)?.content).toBe('Notes');
    expect(state.blocks.find(b => b.uuid === right)).toMatchObject({ content: 'world', parent: a });
    expect(state.revision).toBe(committed);
  } finally { await runtime.close(); }
});

it('materializes semantic backlinks in the same committed block update', async () => {
  const runtime = createEditorRuntime(':memory:');
  try {
    const page = await runtime.execute({ operationId: randomUUID(), revision: 0, command: { kind: 'page.create', title: 'References' } });
    const block = await runtime.execute({ operationId: randomUUID(), revision: page.snapshot.revision, command: { kind: 'block.insert', parent: page.focus!, content: 'See [[Architecture]]' } });
    expect(await runtime.backlinks('page', 'Architecture')).toEqual([block.focus]);
    await runtime.execute({ operationId: randomUUID(), revision: block.snapshot.revision, command: { kind: 'block.update', uuid: block.focus!, content: '`[[Architecture]]`' } });
    expect(await runtime.backlinks('page', 'Architecture')).toEqual([]);
  } finally { await runtime.close(); }
});

it('serializes competing commands, preserves operation identity, and supports session history', async () => {
  const runtime = createEditorRuntime(':memory:');
  try {
    const command = { kind: 'page.create', title: 'Page' };
    const request = { operationId: randomUUID(), revision: 0, command };
    const results = await Promise.allSettled([runtime.execute(request), runtime.execute({ ...request, operationId: randomUUID() })]);
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    const replay = await runtime.execute(request);
    expect(replay.snapshot.pages).toHaveLength(1);
    await expect(runtime.execute({ ...request, command: { ...command, title: 'Different' } })).rejects.toThrow('OPERATION_CONFLICT');
    const undo = await runtime.execute({ operationId: randomUUID(), revision: replay.snapshot.revision, command: { kind: 'history.undo' } });
    expect(undo.snapshot.pages).toHaveLength(0);
    const redo = await runtime.execute({ operationId: randomUUID(), revision: undo.snapshot.revision, command: { kind: 'history.redo' } });
    expect(redo.snapshot.pages).toHaveLength(1);
  } finally { await runtime.close(); }
});

it('renames pages, moves complete subtrees and deletes multi-selection atomically with undo', async () => {
  const runtime = createEditorRuntime(':memory:');
  const run = async (command: unknown) => runtime.execute({ operationId: randomUUID(), revision: (await runtime.read()).revision, command });
  try {
    const source = (await run({ kind: 'page.create', title: 'Source' })).focus!;
    const destination = (await run({ kind: 'page.create', title: 'Destination' })).focus!;
    await run({ kind: 'page.rename', uuid: source, title: 'Renamed' });
    expect((await runtime.read()).pages.find(p => p.uuid === source)?.content).toBe('Renamed');
    await expect(run({ kind: 'page.rename', uuid: source, title: 'destination' })).rejects.toThrow('уже существует');
    const parent = (await run({ kind: 'block.insert', parent: source, content: 'Parent' })).focus!;
    const child = (await run({ kind: 'block.insert', parent, content: 'Child' })).focus!;
    const sibling = (await run({ kind: 'block.insert', parent: source, content: 'Sibling' })).focus!;
    const move = await run({ kind: 'block.move', uuids: [parent], target: destination, placement: 'inside' });
    expect(move.snapshot.blocks.find(b => b.uuid === child)).toMatchObject({ parent, page: destination });
    await expect(run({ kind: 'block.move', uuids: [parent], target: child, placement: 'inside' })).rejects.toThrow();
    const deleted = await run({ kind: 'block.delete', uuids: [parent, child, sibling] });
    expect(deleted.snapshot.revision).toBe(move.snapshot.revision + 1);
    expect(deleted.snapshot.blocks).toHaveLength(0);
    const undone = await run({ kind: 'history.undo' });
    expect(undone.snapshot.blocks).toEqual(move.snapshot.blocks);
  } finally { await runtime.close(); }
});
