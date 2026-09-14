import type {
  EntityId,
  OperationId,
  Revision,
  TransactionId,
  UUID
} from "@logseq-ts/domain";

export interface Datom {
  readonly e: EntityId;
  readonly a: string;
  readonly v: unknown;
  readonly tx: TransactionId;
  readonly added: boolean;
}

export interface TxReport {
  readonly txId: TransactionId;
  readonly operationId: OperationId;
  readonly revision: Revision;
  readonly datoms: readonly Datom[];
}

export interface GraphDatabase {
  readonly revision: Revision;
  transact(input: TransactionInput): Promise<TxReport>;
  pull(pattern: unknown, entity: UUID | EntityId): Promise<unknown>;
  query(query: unknown, inputs?: readonly unknown[]): Promise<unknown>;
}

export interface TransactionInput {
  readonly operationId: OperationId;
  readonly source: "editor" | "plugin" | "sync" | "cli" | "import" | "system";
  readonly assertions: readonly unknown[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}
