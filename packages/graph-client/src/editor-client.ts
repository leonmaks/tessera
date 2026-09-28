import { editorReplySchema, editorRequestSchema } from '@tessera-ts/domain';
import type { EditorCommand, EditorReply, EditorSnapshot } from '@tessera-ts/domain';
export type { EditorCommand, EditorReply, EditorSnapshot } from '@tessera-ts/domain';

export function createEditorClient() {
  let state: EditorSnapshot = freeze({ revision: 0, pages: [], blocks: [], canUndo: false, canRedo: false });
  const listeners = new Set<() => void>();
  let tail: Promise<unknown> = Promise.resolve();
  function serial<T>(action: () => Promise<T>) { const result = tail.then(action); tail = result.catch(() => undefined); return result; }
  async function request(payload: unknown): Promise<EditorReply> {
    const response = await fetch('/local/editor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const raw: unknown = await response.json();
    if (!response.ok) throw new Error(raw && typeof raw === 'object' && 'error' in raw ? String(raw.error) : 'Сервер недоступен');
    const reply = editorReplySchema.parse(raw);
    if (reply.snapshot.revision >= state.revision) { state = freeze(reply.snapshot); for (const listener of listeners) listener(); }
    return reply;
  }
  return {
    snapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    reload: () => serial(() => request(null)),
    execute: (command: EditorCommand) => serial(async () => {
      const payload = editorRequestSchema.parse({ operationId: crypto.randomUUID(), revision: state.revision, command });
      try { return await request(payload); }
      catch (error) { try { await request(null); } catch { /* retain last confirmed snapshot */ } throw error; }
    })
  };
}
function freeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
