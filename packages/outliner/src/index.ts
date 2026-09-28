import { EntityNotFoundError, OutlinerCycleError, asUUID } from "@tessera-ts/domain";
import { createParser } from "@tessera-ts/parser";
import { extractReferences } from "@tessera-ts/references";
import type { GraphValue, InsertPosition, UUID } from "@tessera-ts/domain";

const kindAttribute = ":outliner/kind";
const contentAttribute = ":outliner/content";
const parentAttribute = ":outliner/parent";
const pageAttribute = ":outliner/page";
const orderAttribute = ":outliner/order";
const deletedAttribute = ":outliner/deleted";
export const semanticReferencesAttribute = ":references/semantic-json";
const outlinerPattern = [kindAttribute, contentAttribute, parentAttribute, pageAttribute, orderAttribute, deletedAttribute, semanticReferencesAttribute];

export interface InsertBlockInput { readonly content: string; readonly position: InsertPosition; }
export interface SplitBlockInput { readonly uuid: UUID; readonly offset: number; }
export interface OutlinerGraph {
  transact(input: unknown): Promise<unknown>;
  scan(pattern: unknown): Promise<readonly { readonly uuid: UUID; readonly attributes: Readonly<Record<string, readonly GraphValue[]>> }[]>;
}
export interface OutlinerOptions { readonly graph: OutlinerGraph; readonly uuid: { next(): string }; }

export interface OutlinerPage { readonly uuid: UUID; readonly kind: "page"; readonly content: string; }
export interface OutlinerBlock { readonly uuid: UUID; readonly kind: "block"; readonly content: string; readonly parent: UUID; readonly page: UUID; readonly order: string; }
export type OutlinerNode = OutlinerPage | OutlinerBlock;
export interface OutlinerSnapshot {
  pages(): readonly OutlinerPage[];
  node(uuid: UUID): OutlinerNode | undefined;
  block(uuid: UUID): OutlinerBlock;
  children(parent: UUID): readonly OutlinerBlock[];
  blocks(): readonly OutlinerBlock[];
}
export interface OutlinerService {
  renamePage(uuid: UUID, content: string): Promise<void>;
  deleteBlocks(uuids: readonly UUID[]): Promise<void>;
  history(): { canUndo: boolean; canRedo: boolean };
  createPage(content: string): Promise<{ uuid: UUID }>;
  insertBlock(input: InsertBlockInput): Promise<{ uuid: UUID }>;
  updateBlock(uuid: UUID, content: string): Promise<void>;
  deleteBlock(uuid: UUID): Promise<void>;
  moveBlock(uuid: UUID, position: InsertPosition): Promise<void>;
  moveBlocks(uuids: readonly UUID[], position: InsertPosition): Promise<void>;
  indent(uuids: readonly UUID[]): Promise<void>;
  outdent(uuids: readonly UUID[]): Promise<void>;
  splitBlock(input: SplitBlockInput): Promise<{ left: UUID; right: UUID }>;
  mergeWithPrevious(uuid: UUID): Promise<{ survivor: UUID }>;
  undo(): Promise<void>;
  redo(): Promise<void>;
  snapshot(): Promise<OutlinerSnapshot>;
}

interface StoredNode { uuid: UUID; kind: "page" | "block"; content: string; parent?: UUID | undefined; page?: UUID | undefined; order?: string | undefined; deleted: boolean; }
type State = Map<UUID, StoredNode>;
interface HistoryEntry { readonly before: State; readonly after: State; }

class Snapshot implements OutlinerSnapshot {
  private readonly visible: ReadonlyMap<UUID, OutlinerNode>;
  constructor(state: State) {
    const visible = new Map<UUID, OutlinerNode>();
    for (const stored of state.values()) if (!stored.deleted) {
      const node: OutlinerNode = stored.kind === "page"
        ? freeze({ uuid: stored.uuid, kind: "page", content: stored.content })
        : freeze({ uuid: stored.uuid, kind: "block", content: stored.content, parent: required(stored.parent, "parent"), page: required(stored.page, "page"), order: required(stored.order, "order") });
      visible.set(node.uuid, node);
    }
    this.visible = visible;
    Object.freeze(this);
  }
  node(uuid: UUID): OutlinerNode | undefined { return this.visible.get(uuid); }
  pages(): readonly OutlinerPage[] { return freeze([...this.visible.values()].filter((node): node is OutlinerPage => node.kind === 'page').sort((a, b) => a.content.localeCompare(b.content))); }
  block(uuid: UUID): OutlinerBlock { const node = this.node(uuid); if (!node || node.kind !== "block") throw new EntityNotFoundError(`Live block not found: ${uuid}`); return node; }
  children(parent: UUID): readonly OutlinerBlock[] { return freeze([...this.visible.values()].filter((node): node is OutlinerBlock => node.kind === "block" && node.parent === parent).sort(compareBlocks)); }
  blocks(): readonly OutlinerBlock[] { return freeze([...this.visible.values()].filter((node): node is OutlinerBlock => node.kind === "block").sort((a, b) => a.uuid.localeCompare(b.uuid))); }
}

class GraphOutliner implements OutlinerService {
  private readonly undoStack: HistoryEntry[] = [];
  private readonly redoStack: HistoryEntry[] = [];
  constructor(private readonly options: OutlinerOptions) {}
  history() { return { canUndo: this.undoStack.length > 0, canRedo: this.redoStack.length > 0 }; }
  async renamePage(uuid: UUID, content: string): Promise<void> { await this.mutate(state => { const page = this.liveNode(state, uuid); if (page.kind !== 'page') throw new Error('Not a page'); page.content = content; }); }
  async deleteBlocks(uuids: readonly UUID[]): Promise<void> { await this.mutate(state => { const roots = this.roots(state, uuids); const parents = new Set(roots.map(uuid => this.liveBlock(state, uuid).parent)); for (const uuid of roots) for (const node of this.descendants(state, uuid)) node.deleted = true; for (const parent of parents) this.assignChildren(state, parent, this.children(state, parent)); }); }
  async createPage(content: string): Promise<{ uuid: UUID }> { const uuid = this.nextUuid(); await this.mutate(state => { state.set(uuid, { uuid, kind: "page", content, deleted: false }); }); return { uuid }; }
  async insertBlock(input: InsertBlockInput): Promise<{ uuid: UUID }> {
    const uuid = this.nextUuid();
    await this.mutate(state => { const placement = this.placement(state, input.position, new Set()); state.set(uuid, { uuid, kind: "block", content: input.content, parent: placement.parent, page: placement.page, order: "", deleted: false }); placement.children.splice(placement.index, 0, uuid); this.assignChildren(state, placement.parent, placement.children); });
    return { uuid };
  }
  async updateBlock(uuid: UUID, content: string): Promise<void> { await this.mutate(state => { this.liveBlock(state, uuid).content = content; }); }
  async deleteBlock(uuid: UUID): Promise<void> { await this.mutate(state => { const root = this.liveBlock(state, uuid); const parent = root.parent; for (const descendant of this.descendants(state, uuid)) descendant.deleted = true; this.assignChildren(state, parent, this.children(state, parent).filter(child => child !== uuid)); }); }
  async moveBlock(uuid: UUID, position: InsertPosition): Promise<void> { await this.moveBlocks([uuid], position); }
  async moveBlocks(uuids: readonly UUID[], position: InsertPosition): Promise<void> { await this.mutate(state => this.move(state, uuids, position)); }
  async indent(uuids: readonly UUID[]): Promise<void> { await this.mutate(state => { const roots = this.roots(state, uuids); if (roots.length === 0) return; const first = this.liveBlock(state, roots[0]!); const siblings = this.children(state, first.parent); const index = siblings.indexOf(first.uuid); if (index > 0) this.move(state, roots, { kind: "last-child", parent: siblings[index - 1]! }); }); }
  async outdent(uuids: readonly UUID[]): Promise<void> { await this.mutate(state => { const roots = this.roots(state, uuids); if (roots.length === 0) return; const parentNode = this.liveNode(state, this.liveBlock(state, roots[0]!).parent); if (parentNode.kind === "page") return; this.move(state, roots, { kind: "after", block: parentNode.uuid }); }); }
  async splitBlock(input: SplitBlockInput): Promise<{ left: UUID; right: UUID }> {
    const right = this.nextUuid();
    await this.mutate(state => { const left = this.liveBlock(state, input.uuid); if (!Number.isInteger(input.offset) || input.offset < 0 || input.offset > left.content.length) throw new Error("Split offset is outside block content"); const initial = left.content; left.content = initial.slice(0, input.offset); state.set(right, { uuid: right, kind: "block", content: initial.slice(input.offset), parent: left.parent, page: left.page, order: "", deleted: false }); const children = this.children(state, left.parent); children.splice(children.indexOf(left.uuid) + 1, 0, right); this.assignChildren(state, left.parent, children); });
    return { left: input.uuid, right };
  }
  async mergeWithPrevious(uuid: UUID): Promise<{ survivor: UUID }> {
    let survivor: UUID | undefined;
    await this.mutate(state => { const current = this.liveBlock(state, uuid); const siblings = this.children(state, current.parent); const index = siblings.indexOf(uuid); if (index <= 0) throw new Error("Block has no previous sibling to merge with"); const previous = this.liveBlock(state, siblings[index - 1]!); previous.content += current.content; const movedChildren = this.children(state, current.uuid); const previousChildren = this.children(state, previous.uuid); for (const child of movedChildren) this.liveBlock(state, child).parent = previous.uuid; this.assignChildren(state, previous.uuid, [...previousChildren, ...movedChildren]); current.deleted = true; siblings.splice(index, 1); this.assignChildren(state, current.parent, siblings); survivor = previous.uuid; });
    return { survivor: survivor! };
  }
  async undo(): Promise<void> { const entry = this.undoStack.pop(); if (!entry) return; await this.write(entry.before); this.redoStack.push(entry); }
  async redo(): Promise<void> { const entry = this.redoStack.pop(); if (!entry) return; await this.write(entry.after); this.undoStack.push(entry); }
  async snapshot(): Promise<OutlinerSnapshot> { return new Snapshot(await this.read()); }

  private async mutate(change: (state: State) => void): Promise<void> { const before = await this.read(); const after = cloneState(before); change(after); await this.write(after, before); this.undoStack.push({ before, after: cloneState(after) }); this.redoStack.length = 0; }
  private async write(target: State, knownCurrent?: State): Promise<void> {
    const current = knownCurrent ?? await this.read(); const assertions: unknown[] = [];
    for (const uuid of [...new Set([...current.keys(), ...target.keys()])].sort()) {
      const before = current.get(uuid); const after = target.get(uuid);
      if (!after) { if (before && !before.deleted) assertions.push({ kind: "fact.replace", entity: uuid, attribute: deletedAttribute, value: true }); continue; }
      if (!before) assertions.push({ kind: "entity.create", uuid });
      for (const [attribute, value] of attributes(after)) { const old = before ? attributeValue(before, attribute) : undefined; if (old === undefined) assertions.push({ kind: "fact.set", entity: uuid, attribute, value }); else if (!sameValue(old, value)) assertions.push({ kind: "fact.replace", entity: uuid, attribute, value }); }
    }
    if (assertions.length > 0) await this.options.graph.transact({ operationId: this.nextUuid(), source: "editor", assertions });
  }
  private async read(): Promise<State> {
    const state: State = new Map();
    for (const entity of await this.options.graph.scan(outlinerPattern)) {
      const kind = firstString(entity.attributes[kindAttribute]); if (kind !== "page" && kind !== "block") continue;
      const uuid = asUUID(entity.uuid); state.set(uuid, { uuid, kind, content: firstString(entity.attributes[contentAttribute]) ?? "", parent: reference(entity.attributes[parentAttribute]), page: reference(entity.attributes[pageAttribute]), order: firstString(entity.attributes[orderAttribute]), deleted: entity.attributes[deletedAttribute]?.[0] === true });
    }
    return state;
  }
  private move(state: State, uuids: readonly UUID[], position: InsertPosition): void {
    const roots = this.roots(state, uuids); if (roots.length === 0) return; const rootSet = new Set(roots); const placement = this.placement(state, position, rootSet);
    for (const root of roots) if (root === placement.parent || this.descendants(state, root).some(node => node.uuid === placement.parent)) throw new OutlinerCycleError(`Cannot move ${root} under its descendant`);
    const sourceParents = new Set(roots.map(root => this.liveBlock(state, root).parent)); for (const parent of sourceParents) this.assignChildren(state, parent, this.children(state, parent).filter(child => !rootSet.has(child)));
    const destination = this.children(state, placement.parent).filter(child => !rootSet.has(child)); destination.splice(placement.index, 0, ...roots);
    for (const root of roots) for (const node of this.descendants(state, root)) { node.page = placement.page; if (node.uuid === root) node.parent = placement.parent; }
    this.assignChildren(state, placement.parent, destination);
  }
  private placement(state: State, position: InsertPosition, excluded: ReadonlySet<UUID>): { readonly parent: UUID; readonly page: UUID; readonly children: UUID[]; readonly index: number } {
    if (position.kind === "before" || position.kind === "after") { const anchor = this.liveBlock(state, position.block); if (excluded.has(anchor.uuid)) throw new Error("A moved block cannot be its own anchor"); const children = this.children(state, anchor.parent).filter(child => !excluded.has(child)); const index = children.indexOf(anchor.uuid); return { parent: anchor.parent, page: anchor.page, children, index: position.kind === "before" ? index : index + 1 }; }
    const parent = this.liveNode(state, position.parent); const children = this.children(state, parent.uuid).filter(child => !excluded.has(child)); return { parent: parent.uuid, page: parent.kind === "page" ? parent.uuid : parent.page!, children, index: position.kind === "first-child" ? 0 : children.length };
  }
  private roots(state: State, uuids: readonly UUID[]): UUID[] { const unique = [...new Set(uuids)]; for (const uuid of unique) this.liveBlock(state, uuid); const selected = new Set(unique); return unique.filter(uuid => !this.ancestors(state, uuid).some(parent => selected.has(parent))).sort((a, b) => compareBlocks(this.liveBlock(state, a), this.liveBlock(state, b))); }
  private ancestors(state: State, uuid: UUID): UUID[] { const result: UUID[] = []; let current = this.liveBlock(state, uuid); while (true) { result.push(current.parent); const parent = this.liveNode(state, current.parent); if (parent.kind === "page") return result; current = this.liveBlock(state, parent.uuid); } }
  private descendants(state: State, uuid: UUID): StoredNode[] { const root = this.liveNode(state, uuid); const result = [root]; for (const child of this.children(state, uuid)) result.push(...this.descendants(state, child)); return result; }
  private children(state: State, parent: UUID): UUID[] { return [...state.values()].filter(node => !node.deleted && node.kind === "block" && node.parent === parent).sort((a, b) => compareBlocks(a as OutlinerBlock, b as OutlinerBlock)).map(node => node.uuid); }
  private assignChildren(state: State, parent: UUID, children: readonly UUID[]): void { children.forEach((uuid, index) => { const child = this.liveBlock(state, uuid); child.parent = parent; child.order = String(index).padStart(12, "0"); }); }
  private liveNode(state: State, uuid: UUID): StoredNode { const node = state.get(uuid); if (!node || node.deleted) throw new EntityNotFoundError(`Live outliner node not found: ${uuid}`); return node; }
  private liveBlock(state: State, uuid: UUID): StoredNode & { kind: "block"; parent: UUID; page: UUID; order: string } { const node = this.liveNode(state, uuid); if (node.kind !== "block" || !node.parent || !node.page || node.order === undefined) throw new EntityNotFoundError(`Live block not found: ${uuid}`); return node as StoredNode & { kind: "block"; parent: UUID; page: UUID; order: string }; }
  private nextUuid(): UUID { return asUUID(this.options.uuid.next()); }
}

function attributes(node: StoredNode): readonly [string, GraphValue][] {
  const values: [string, GraphValue][] = [[kindAttribute, node.kind], [contentAttribute, node.content], [deletedAttribute, node.deleted]];
  if (node.kind === "block") values.push(
    [parentAttribute, { type: "entity", uuid: required(node.parent, "parent") }],
    [pageAttribute, { type: "entity", uuid: required(node.page, "page") }],
    [orderAttribute, required(node.order, "order")],
    [semanticReferencesAttribute, semanticReferences(node.content)]
  );
  return values;
}
function semanticReferences(content: string): string {
  const block = createParser().parseMarkdown(`- ${content}`).blocks[0];
  return JSON.stringify(extractReferences(block?.inline ?? []));
}
function attributeValue(node: StoredNode, attribute: string): GraphValue | undefined { return new Map(attributes(node)).get(attribute); }
function reference(values: readonly GraphValue[] | undefined): UUID | undefined { const value = values?.[0]; return typeof value === "object" && value !== null && value.type === "entity" ? value.uuid : undefined; }
function firstString(values: readonly GraphValue[] | undefined): string | undefined { const value = values?.[0]; return typeof value === "string" ? value : undefined; }
function sameValue(left: GraphValue, right: GraphValue): boolean { return JSON.stringify(left) === JSON.stringify(right); }
function cloneState(state: State): State { return new Map([...state].map(([uuid, node]) => [uuid, { ...node }])); }
function required<T>(value: T | undefined, label: string): T { if (value === undefined) throw new Error(`Outliner node is missing ${label}`); return value; }
function compareBlocks(left: Pick<OutlinerBlock, "order" | "uuid">, right: Pick<OutlinerBlock, "order" | "uuid">): number { return left.order.localeCompare(right.order) || left.uuid.localeCompare(right.uuid); }
function freeze<T>(value: T): T { if (value && typeof value === "object" && !Object.isFrozen(value)) { for (const child of Object.values(value as Record<string, unknown>)) freeze(child); Object.freeze(value); } return value; }
export function createOutliner(options: OutlinerOptions): OutlinerService { return new GraphOutliner(options); }
