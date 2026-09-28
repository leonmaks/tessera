/** Public, database-independent surface exposed to a plugin. */
export type PluginBlock = Readonly<Record<string, unknown>>;

/** A public transaction fact. Storage engine identifiers are never exposed. */
export interface PluginDatom {
  readonly entity: string;
  readonly attribute: string;
  readonly value: unknown;
  readonly added: boolean;
}

export interface PluginGraphChangeEvent {
  readonly blocks: readonly PluginBlock[];
  readonly txData: readonly PluginDatom[];
  readonly txMeta?: Readonly<{
    operationId: string;
    revision: number;
    outlinerOp?: string;
  }>;
}

export type PluginCommandPlacement =
  | "palette"
  | "shortcut"
  | "slash"
  | "block-context-menu"
  | "highlight-context-menu"
  | "page-menu"
  | "simple";

export interface PluginCommandOptions {
  readonly label: string;
  readonly placement?: PluginCommandPlacement;
  readonly placements?: readonly PluginCommandPlacement[];
  readonly keybinding?: string | Readonly<{ binding: string | readonly string[]; mode?: "global" | "non-editing" | "editing" }>;
  readonly when?: string | readonly string[];
}

export interface PluginInsertBlockOptions {
  readonly before?: boolean;
  readonly sibling?: boolean;
  readonly start?: boolean;
  readonly end?: boolean;
  readonly customUUID?: string;
}

export interface PluginMoveBlockOptions {
  readonly before?: boolean;
  readonly sibling?: boolean;
  readonly children?: boolean;
}

export interface PluginDB {
  q<T = unknown>(dsl: string): Promise<T>;
  customQuery<T = unknown>(query: string): Promise<T>;
  datascriptQuery<T = unknown>(query: string, ...inputs: readonly unknown[]): Promise<T>;
  onChanged(handler: (event: PluginGraphChangeEvent) => void): () => void;
}

export interface PluginEditor {
  getCurrentBlock(): Promise<PluginBlock | null>;
  getBlock(uuid: string): Promise<PluginBlock | null>;
  insertBlock(target: string, content: string, options?: PluginInsertBlockOptions): Promise<PluginBlock | null>;
  updateBlock(uuid: string, content: string): Promise<PluginBlock | void>;
  removeBlock(uuid: string): Promise<void>;
  moveBlock(source: string, target: string, options?: PluginMoveBlockOptions): Promise<void>;
}

export interface PluginCommands {
  register(id: string, options: PluginCommandOptions, action: (...args: readonly unknown[]) => unknown): () => void;
  execute(id: string, ...args: readonly unknown[]): Promise<unknown>;
}

export interface TesseraPluginFacade {
  readonly DB: PluginDB;
  readonly Editor: PluginEditor;
  readonly Commands: PluginCommands;
}
