import type {
  ChildMembership,
  CommandEnvelope,
  GraphId,
  GraphNode,
  OperationId,
  Revision,
  UUID
} from "@tessera-ts/domain";

export type ResourceKey =
  | `block:${string}`
  | `children:${string}`
  | `page:${string}`
  | `property:${string}`
  | `query:${string}`
  | `resource:${string}`;

export interface BlockReplacement {
  readonly uuid: UUID;
  readonly txId: number;
  readonly value: GraphNode;
}

export interface DeletedResource {
  readonly uuid: UUID;
  readonly revision: Revision;
  readonly previousEntityId?: number;
}

export interface ChildrenPatch {
  readonly parent: UUID;
  readonly baseRev: Revision;
  readonly rev: Revision;
  readonly remove: readonly UUID[];
  readonly upsert: readonly ChildMembership[];
}

export interface RenderDelta {
  readonly graphId: GraphId;
  readonly rev: Revision;
  readonly operationId?: OperationId;
  readonly blocks: readonly BlockReplacement[];
  readonly deleted: readonly DeletedResource[];
  readonly children: readonly ChildrenPatch[];
  readonly affectedResources: readonly ResourceKey[];
}

export interface CommandResult<T = unknown> {
  readonly operationId: OperationId;
  readonly transactionId: number;
  readonly revision: Revision;
  readonly result: T;
  readonly delta?: RenderDelta;
}

export interface GraphWorker {
  execute<T>(command: CommandEnvelope): Promise<CommandResult<T>>;
  query<T>(name: string, input: unknown): Promise<T>;
  subscribe(listener: (delta: RenderDelta) => void): () => void;
}
