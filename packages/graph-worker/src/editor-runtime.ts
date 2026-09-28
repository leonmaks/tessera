import { randomUUID } from 'node:crypto';
import { createGraphDatabase } from '@tessera-ts/graph-db';
import { createOutliner, semanticReferencesAttribute } from '@tessera-ts/outliner';
import { asUUID, editorRequestSchema, editorSnapshotSchema } from '@tessera-ts/domain';
import type { EditorReply, EditorSnapshot } from '@tessera-ts/domain';
import { executePageCreate } from './portable-page-runtime.js';

/** Called only in the graph worker in production. Tests may instantiate isolated databases. */
export function createEditorRuntime(path: string) {
  const uuid = { next: randomUUID };
  const db = createGraphDatabase({ path, uuid, clock: { now: Date.now } });
  let operationId = '';
  const outliner = createOutliner({ uuid, graph: {
    scan: pattern => db.scan(pattern),
    transact: input => {
      if (!input || typeof input !== 'object') throw new Error('Invalid transaction');
      return db.transact({ ...input, operationId });
    }
  } });
  let tail: Promise<unknown> = Promise.resolve();
  const completed = new Map<string, { fingerprint: string; focus?: string; offset?: number }>();
  function serial<T>(action: () => Promise<T>): Promise<T> {
    const next = tail.then(action); tail = next.catch(() => undefined); return next;
  }
  async function snapshot(): Promise<EditorSnapshot> {
    const state = await outliner.snapshot();
    return editorSnapshotSchema.parse({ revision: db.revision, pages: state.pages(), blocks: state.blocks(), ...outliner.history() });
  }
  return {
    read: () => serial(snapshot),
    backlinks: (kind: 'page' | 'block', target: string) => serial(async () => {
      const sources = await db.scan([semanticReferencesAttribute]);
      return Object.freeze(sources.flatMap(source => {
        const raw = source.attributes[semanticReferencesAttribute]?.[0];
        if (typeof raw !== 'string') return [];
        try {
          const value = JSON.parse(raw) as { pages?: unknown; blocks?: unknown };
          const values = kind === 'page' ? value.pages : value.blocks;
          return Array.isArray(values) && values.includes(target) ? [source.uuid] : [];
        } catch { return []; }
      }).sort());
    }),
    close: () => serial(() => db.close()),
    execute: (raw: unknown): Promise<EditorReply> => serial(async () => {
      const request = editorRequestSchema.parse(raw);
      const fingerprint = JSON.stringify(request);
      const previous = completed.get(request.operationId);
      if (previous) {
        if (previous.fingerprint !== fingerprint) throw new Error('OPERATION_CONFLICT');
        return { snapshot: await snapshot(), ...(previous.focus ? { focus: previous.focus } : {}), ...(previous.offset !== undefined ? { offset: previous.offset } : {}) };
      }
      if (request.revision !== db.revision) throw new Error('STALE: граф изменился в другой вкладке. Повторите сохранение.');
      operationId = request.operationId;
      const command = request.command;
      let focus: string | undefined;
      let offset: number | undefined;
      switch (command.kind) {
        case 'page.create': {
          focus = (await executePageCreate(command.title, {
            pages: async () => (await outliner.snapshot()).pages().map(page => ({ uuid: page.uuid, content: page.content })),
            createPage: async title => { const page = await outliner.createPage(title); return { uuid: page.uuid, content: title }; }
          })).focus;
          break;
        }
        case 'page.rename': {
          const duplicate = (await outliner.snapshot()).pages().some(p => p.uuid !== command.uuid && p.content.toLocaleLowerCase() === command.title.toLocaleLowerCase());
          if (duplicate) throw new Error('Страница с таким названием уже существует');
          await outliner.renamePage(asUUID(command.uuid), command.title); focus = command.uuid; break;
        }
        case 'block.insert': focus = (await outliner.insertBlock({ content: command.content, position: { kind: 'last-child', parent: asUUID(command.parent) } })).uuid; offset = command.content.length; break;
        case 'block.update': await outliner.updateBlock(asUUID(command.uuid), command.content); break;
        case 'block.split': focus = (await outliner.splitBlock({ uuid: asUUID(command.uuid), offset: command.offset })).right; offset = 0; break;
        case 'block.merge': {
          const state = await outliner.snapshot();
          const block = state.block(asUUID(command.uuid));
          const siblings = state.children(block.parent);
          const index = siblings.findIndex(b => b.uuid === block.uuid);
          if (index === 0) { focus = block.uuid; offset = 0; break; }
          offset = siblings[index - 1]!.content.length;
          focus = (await outliner.mergeWithPrevious(block.uuid)).survivor; break;
        }
        case 'block.delete': await outliner.deleteBlocks(command.uuids.map(id => asUUID(id))); break;
        case 'block.indent': await outliner.indent(command.uuids.map(id => asUUID(id))); focus = command.uuids[0]; break;
        case 'block.outdent': await outliner.outdent(command.uuids.map(id => asUUID(id))); focus = command.uuids[0]; break;
        case 'block.move': await outliner.moveBlocks(command.uuids.map(id => asUUID(id)), command.placement === 'inside' ? { kind: 'last-child', parent: asUUID(command.target) } : { kind: command.placement, block: asUUID(command.target) }); focus = command.uuids[0]; break;
        case 'history.undo': await outliner.undo(); break;
        case 'history.redo': await outliner.redo(); break;
      }
      const metadata = { ...(focus ? { focus } : {}), ...(offset !== undefined ? { offset } : {}) };
      completed.set(request.operationId, { fingerprint, ...metadata });
      return { snapshot: await snapshot(), ...metadata };
    })
  };
}
