import type { ChildMembership, GraphId, GraphNode, Revision, UUID } from "@tessera-ts/domain";
export * from './editor-client.js';
export * from './browser-client.js';

export interface RenderDeltaInput {
  readonly graphId: GraphId;
  readonly rev: Revision;
  readonly blocks: readonly { readonly uuid: UUID; readonly value: GraphNode }[];
  readonly deleted: readonly { readonly uuid: UUID }[];
  readonly children: readonly { readonly parent: UUID; readonly baseRev: Revision; readonly rev: Revision; readonly remove: readonly UUID[]; readonly upsert: readonly ChildMembership[] }[];
  readonly affectedResources: readonly string[];
}
export interface ChildrenResource { readonly revision: Revision; readonly members: readonly ChildMembership[]; readonly stale: boolean; }
export interface RendererSnapshot { readonly revision: Revision; readonly blocks: Readonly<Record<string, GraphNode>>; readonly children: Readonly<Record<string, ChildrenResource>>; }
export interface RendererStore { snapshot(): RendererSnapshot; subscribe(listener: () => void): () => void; apply(delta: RenderDeltaInput): void; seedChildren(parent: UUID, members: readonly ChildMembership[], revision: number): void; }

export function createRendererStore(options: { readonly reloadChildren?: (parent: UUID) => void } = {}): RendererStore {
  let state = freeze<RendererSnapshot>({ revision: 0 as Revision, blocks: {}, children: {} });
  const listeners = new Set<() => void>();
  const publish = () => { for (const listener of listeners) listener(); };
  return {
    snapshot: () => state,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    apply(delta) {
      if (delta.rev <= state.revision) return;
      const blocks: Record<string, GraphNode> = { ...state.blocks };
      for (const replacement of delta.blocks) blocks[replacement.uuid] = replacement.value;
      for (const tombstone of delta.deleted) delete blocks[tombstone.uuid];
      const children: Record<string, ChildrenResource> = { ...state.children };
      for (const patch of delta.children) {
        const cached = children[patch.parent];
        if (!cached || cached.revision !== patch.baseRev) {
          children[patch.parent] = freeze({ revision: patch.rev, members: cached?.members ?? [], stale: true });
          options.reloadChildren?.(patch.parent);
          continue;
        }
        const byUuid = new Map(cached.members.map(member => [member.uuid, member]));
        for (const uuid of patch.remove) byUuid.delete(uuid);
        for (const member of patch.upsert) byUuid.set(member.uuid, member);
        children[patch.parent] = freeze({ revision: patch.rev, members: [...byUuid.values()].sort((a, b) => a.order.localeCompare(b.order)), stale: false });
      }
      state = freeze({ revision: delta.rev, blocks, children });
      publish();
    },
    seedChildren(parent, members, revision) {
      state = freeze({ ...state, children: { ...state.children, [parent]: freeze({ revision: revision as Revision, members: [...members].sort((a, b) => a.order.localeCompare(b.order)), stale: false }) } });
      publish();
    }
  };
}
function freeze<T>(value: T): T { if (value && typeof value === "object" && !Object.isFrozen(value)) { for (const child of Object.values(value as Record<string, unknown>)) freeze(child); Object.freeze(value); } return value; }
