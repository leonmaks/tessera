import type { GraphId, OperationId, OrderToken, Revision, UUID } from "./types.js";

export type InsertPosition =
  | { readonly kind: "before"; readonly block: UUID }
  | { readonly kind: "after"; readonly block: UUID }
  | { readonly kind: "first-child"; readonly parent: UUID }
  | { readonly kind: "last-child"; readonly parent: UUID };

export type GraphCommand =
  | {
      readonly kind: "block.insert";
      readonly content: string;
      readonly position: InsertPosition;
    }
  | {
      readonly kind: "block.update";
      readonly uuid: UUID;
      readonly content: string;
    }
  | {
      readonly kind: "block.delete";
      readonly uuid: UUID;
    }
  | {
      readonly kind: "block.move";
      readonly uuid: UUID;
      readonly position: InsertPosition;
    }
  | {
      readonly kind: "property.set";
      readonly entity: UUID;
      readonly property: UUID;
      readonly value: unknown;
    }
  | {
      readonly kind: "tag.add";
      readonly entity: UUID;
      readonly tag: UUID;
    }
  | {
      readonly kind: "task.status.set";
      readonly task: UUID;
      readonly status: UUID;
    };

export interface CommandEnvelope<C extends GraphCommand = GraphCommand> {
  readonly commandId: OperationId;
  readonly graphId: GraphId;
  readonly expectedRevision?: Revision;
  readonly actor: {
    readonly kind: "user" | "plugin" | "sync" | "cli" | "system";
    readonly id?: string;
  };
  readonly command: C;
}

export interface ChildMembership {
  readonly uuid: UUID;
  readonly order: OrderToken;
}
