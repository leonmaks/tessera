export type UUID = string & { readonly __brand: "UUID" };
export type GraphId = UUID & { readonly __brandGraph: "GraphId" };
export type EntityId = number & { readonly __brand: "EntityId" };
export type Revision = number & { readonly __brand: "Revision" };
export type TransactionId = number & { readonly __brand: "TransactionId" };
export type OperationId = UUID & { readonly __brandOperation: "OperationId" };
export type OrderToken = string & { readonly __brand: "OrderToken" };

export interface EntityRef {
  readonly uuid: UUID;
}

export interface GraphNode {
  readonly id: EntityId;
  readonly uuid: UUID;
  readonly title: string;
  readonly parent?: UUID;
  readonly page?: UUID;
  readonly order?: OrderToken;
  readonly tags: readonly UUID[];
  readonly refs: readonly UUID[];
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly txId: TransactionId;
}

export type PropertyType =
  | "text"
  | "number"
  | "date"
  | "datetime"
  | "checkbox"
  | "url"
  | "node";

export type PropertyValue =
  | { readonly type: "text"; readonly value: string }
  | { readonly type: "number"; readonly value: number }
  | { readonly type: "date"; readonly value: string }
  | { readonly type: "datetime"; readonly value: string }
  | { readonly type: "checkbox"; readonly value: boolean }
  | { readonly type: "url"; readonly value: string }
  | { readonly type: "node"; readonly value: UUID };
