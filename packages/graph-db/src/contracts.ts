import type { Clock, UUIDGenerator } from "@logseq-ts/platform";
import type { GraphValue, OperationId, TransactionInput, TransactionSource, UUID } from "@logseq-ts/domain";

export interface Datom {
  readonly entity: UUID;
  readonly attribute: string;
  readonly value: GraphValue;
  readonly txId: number;
  readonly added: boolean;
}

export interface TxReport {
  readonly txId: number;
  readonly operationId: OperationId;
  readonly revision: number;
  readonly datoms: readonly Datom[];
}

export type PullResult =
  | { readonly status: "absent"; readonly uuid: UUID }
  | { readonly status: "found"; readonly entity: { readonly uuid: UUID; readonly attributes: Readonly<Record<string, readonly GraphValue[]>> } };

export interface ListenerFailure { readonly operationId: OperationId; readonly listenerIndex: number; readonly message: string; }
export interface GraphMigration { readonly version: number; readonly name: string; apply(): void; }
export interface GraphDatabaseOptions { readonly path: string; readonly clock: Clock; readonly uuid: UUIDGenerator; }

export interface GraphDatabase {
  readonly revision: number;
  readonly schemaVersion: number;
  readonly listenerFailures: readonly ListenerFailure[];
  transact(input: unknown): Promise<TxReport>;
  pull(pattern: unknown, entity: unknown): Promise<PullResult>;
  subscribePostCommit(listener: (report: TxReport) => void | Promise<void>): () => void;
  applyMigrations(migrations: readonly GraphMigration[]): void;
  close(): Promise<void>;
}

export type { TransactionInput, TransactionSource };
