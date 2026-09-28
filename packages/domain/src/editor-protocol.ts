import { z } from 'zod';

const uuid = z.uuid();
const content = z.string().max(200_000);
const selection = z.array(uuid).min(1).max(1000);
export const editorCommandSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('page.create'), title: z.string().trim().min(1).max(300) }),
  z.strictObject({ kind: z.literal('page.rename'), uuid, title: z.string().trim().min(1).max(300) }),
  z.strictObject({ kind: z.literal('block.insert'), parent: uuid, content }),
  z.strictObject({ kind: z.literal('block.update'), uuid, content }),
  z.strictObject({ kind: z.literal('block.split'), uuid, offset: z.number().int().nonnegative() }),
  z.strictObject({ kind: z.literal('block.merge'), uuid }),
  z.strictObject({ kind: z.literal('block.delete'), uuids: selection }),
  z.strictObject({ kind: z.literal('block.indent'), uuids: selection }),
  z.strictObject({ kind: z.literal('block.outdent'), uuids: selection }),
  z.strictObject({ kind: z.literal('block.move'), uuids: selection, target: uuid, placement: z.enum(['before', 'after', 'inside']) }),
  z.strictObject({ kind: z.literal('history.undo') }),
  z.strictObject({ kind: z.literal('history.redo') })
]);
export const editorRequestSchema = z.strictObject({ operationId: uuid, revision: z.number().int().nonnegative(), command: editorCommandSchema });
export type EditorCommand = z.infer<typeof editorCommandSchema>;
export const editorSnapshotSchema = z.strictObject({
  revision: z.number().int().nonnegative(),
  pages: z.array(z.strictObject({ uuid, kind: z.literal('page'), content })),
  blocks: z.array(z.strictObject({ uuid, kind: z.literal('block'), content, parent: uuid, page: uuid, order: z.string() })),
  canUndo: z.boolean(), canRedo: z.boolean()
});
export type EditorSnapshot = z.infer<typeof editorSnapshotSchema>;
export const editorReplySchema = z.strictObject({ snapshot: editorSnapshotSchema, focus: uuid.optional(), offset: z.number().int().nonnegative().optional() });
export type EditorReply = z.infer<typeof editorReplySchema>;
