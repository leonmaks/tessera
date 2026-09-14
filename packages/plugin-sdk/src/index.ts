export interface PluginDB {
  q<T = unknown>(dsl: string): Promise<T>;
  customQuery<T = unknown>(query: string): Promise<T>;
  datascriptQuery<T = unknown>(query: string, ...inputs: readonly unknown[]): Promise<T>;
  onChanged(handler: (event: PluginGraphChangeEvent) => void): () => void;
}

export interface PluginGraphChangeEvent {
  readonly blocks: readonly unknown[];
  readonly txData: readonly [number, string, unknown, number, boolean][];
  readonly txMeta?: Readonly<Record<string, unknown>>;
}

export interface PluginEditor {
  getCurrentBlock(): Promise<unknown | null>;
  getBlock(uuid: string): Promise<unknown | null>;
  insertBlock(target: string, content: string, options?: unknown): Promise<unknown>;
  updateBlock(uuid: string, content: string): Promise<unknown>;
  removeBlock(uuid: string): Promise<void>;
  moveBlock(source: string, target: string, options?: unknown): Promise<void>;
}

export interface PluginCommands {
  register(id: string, options: unknown, action: (...args: unknown[]) => unknown): () => void;
  execute(id: string, ...args: unknown[]): Promise<unknown>;
}

export interface LogseqPluginFacade {
  readonly DB: PluginDB;
  readonly Editor: PluginEditor;
  readonly Commands: PluginCommands;
}
