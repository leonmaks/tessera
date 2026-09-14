import type { InsertPosition, UUID } from "@logseq-ts/domain";

export interface InsertBlockInput {
  readonly content: string;
  readonly position: InsertPosition;
}

export interface SplitBlockInput {
  readonly uuid: UUID;
  readonly offset: number;
}

export interface OutlinerService {
  insertBlock(input: InsertBlockInput): Promise<{ uuid: UUID }>;
  updateBlock(uuid: UUID, content: string): Promise<void>;
  deleteBlock(uuid: UUID): Promise<void>;
  moveBlock(uuid: UUID, position: InsertPosition): Promise<void>;
  indent(uuids: readonly UUID[]): Promise<void>;
  outdent(uuids: readonly UUID[]): Promise<void>;
  splitBlock(input: SplitBlockInput): Promise<{ left: UUID; right: UUID }>;
  mergeWithPrevious(uuid: UUID): Promise<{ survivor: UUID }>;
  undo(): Promise<void>;
  redo(): Promise<void>;
}
