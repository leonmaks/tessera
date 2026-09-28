import type {
  TesseraPluginFacade,
  PluginBlock,
  PluginCommandOptions,
  PluginDatom,
  PluginEditor,
  PluginGraphChangeEvent,
  PluginInsertBlockOptions,
  PluginMoveBlockOptions
} from "@tessera-ts/plugin-sdk";

export type {
  TesseraPluginFacade,
  PluginBlock,
  PluginCommandOptions,
  PluginDatom,
  PluginEditor,
  PluginGraphChangeEvent,
  PluginInsertBlockOptions,
  PluginMoveBlockOptions
} from "@tessera-ts/plugin-sdk";

export interface PluginCapabilityGateway {
  q<T = unknown>(dsl: string): Promise<T>;
  customQuery<T = unknown>(query: string): Promise<T>;
  datascriptQuery<T = unknown>(query: string, ...inputs: readonly unknown[]): Promise<T>;
  getCurrentBlock(): Promise<PluginBlock | null>;
  getBlock(uuid: string): Promise<PluginBlock | null>;
  insertBlock(target: string, content: string, options?: PluginInsertBlockOptions): Promise<PluginBlock | null>;
  updateBlock(uuid: string, content: string): Promise<PluginBlock | void>;
  removeBlock(uuid: string): Promise<void>;
  moveBlock(source: string, target: string, options?: PluginMoveBlockOptions): Promise<void>;
  subscribeChanges(listener: (event: PluginGraphChangeEvent) => void | Promise<void>): () => void;
}

export interface PluginListenerFailure {
  readonly event: PluginGraphChangeEvent;
  readonly error: unknown;
}

export interface CreatePluginHostOptions {
  readonly capabilities: PluginCapabilityGateway;
  readonly onListenerError?: (failure: PluginListenerFailure) => void;
}

export interface PluginHost {
  readonly facade: TesseraPluginFacade;
  dispose(): void;
}

export class PluginCommandCollisionError extends Error {
  constructor(id: string) {
    super(`A plugin command is already registered with id "${id}".`);
    this.name = "PluginCommandCollisionError";
  }
}

function requireNonBlankString(value: string, name: string): void {
  if (typeof value !== "string" || value.trim().length === 0) throw new TypeError(`${name} must be a non-blank string.`);
}

function requireHandler(value: unknown): asserts value is (...args: readonly unknown[]) => unknown {
  if (typeof value !== "function") throw new TypeError("Plugin command action must be a function.");
}

/**
 * Builds a plugin facade from semantic ports. It has no persistence dependency;
 * changes arrive only after the graph authority commits them.
 */
export function createPluginHost(options: CreatePluginHostOptions): PluginHost {
  const { capabilities, onListenerError } = options;
  const changeHandlers = new Set<(event: PluginGraphChangeEvent) => void>();
  const commands = new Map<string, (...args: readonly unknown[]) => unknown>();

  const unsubscribeChanges = capabilities.subscribeChanges(async event => {
    for (const handler of [...changeHandlers]) {
      try {
        await handler(event);
      } catch (error: unknown) {
        onListenerError?.({ event, error });
      }
    }
  });

  const facade: TesseraPluginFacade = Object.freeze({
    DB: Object.freeze({
      q: <T>(dsl: string) => { requireNonBlankString(dsl, "DSL query"); return capabilities.q<T>(dsl); },
      customQuery: <T>(query: string) => { requireNonBlankString(query, "Custom query"); return capabilities.customQuery<T>(query); },
      datascriptQuery: <T>(query: string, ...inputs: readonly unknown[]) => { requireNonBlankString(query, "Datalog query"); return capabilities.datascriptQuery<T>(query, ...inputs); },
      onChanged: (handler: (event: PluginGraphChangeEvent) => void) => {
        requireHandler(handler);
        changeHandlers.add(handler);
        return () => { changeHandlers.delete(handler); };
      }
    }),
    Editor: Object.freeze({
      getCurrentBlock: () => capabilities.getCurrentBlock(),
      getBlock: (uuid: string) => { requireNonBlankString(uuid, "Block UUID"); return capabilities.getBlock(uuid); },
      insertBlock: (target: string, content: string, editorOptions?: PluginInsertBlockOptions) => {
        requireNonBlankString(target, "Target block UUID"); requireNonBlankString(content, "Block content");
        return editorOptions === undefined ? capabilities.insertBlock(target, content) : capabilities.insertBlock(target, content, editorOptions);
      },
      updateBlock: (uuid: string, content: string) => { requireNonBlankString(uuid, "Block UUID"); requireNonBlankString(content, "Block content"); return capabilities.updateBlock(uuid, content); },
      removeBlock: (uuid: string) => { requireNonBlankString(uuid, "Block UUID"); return capabilities.removeBlock(uuid); },
      moveBlock: (source: string, target: string, editorOptions?: PluginMoveBlockOptions) => {
        requireNonBlankString(source, "Source block UUID"); requireNonBlankString(target, "Target block UUID");
        return editorOptions === undefined ? capabilities.moveBlock(source, target) : capabilities.moveBlock(source, target, editorOptions);
      }
    } satisfies PluginEditor),
    Commands: Object.freeze({
      register: (id: string, commandOptions: PluginCommandOptions, action: (...args: readonly unknown[]) => unknown) => {
        requireNonBlankString(id, "Plugin command id");
        requireNonBlankString(commandOptions.label, "Plugin command label");
        requireHandler(action);
        if (commands.has(id)) throw new PluginCommandCollisionError(id);
        commands.set(id, action);
        return () => { if (commands.get(id) === action) commands.delete(id); };
      },
      async execute(id: string, ...args: readonly unknown[]): Promise<unknown> {
        requireNonBlankString(id, "Plugin command id");
        const action = commands.get(id);
        if (action === undefined) throw new Error(`No plugin command is registered with id "${id}".`);
        return await action(...args);
      }
    })
  });

  return Object.freeze({ facade, dispose: unsubscribeChanges });
}
