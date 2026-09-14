export type ServerPosition = number;

export type ClientMessage =
  | { readonly type: "hello" }
  | { readonly type: "ping" }
  | { readonly type: "presence"; readonly editingBlockUuid?: string }
  | { readonly type: "pull"; readonly since: ServerPosition }
  | {
      readonly type: "tx/batch";
      readonly tBefore: ServerPosition;
      readonly txs: readonly string[];
      readonly clientRevision?: number;
    };

export type ServerMessage =
  | { readonly type: "hello"; readonly t: ServerPosition; readonly checksum?: string }
  | { readonly type: "pong" }
  | { readonly type: "pull/ok"; readonly t: ServerPosition; readonly txs: readonly string[]; readonly checksum?: string }
  | { readonly type: "tx/batch/ok"; readonly t: ServerPosition }
  | { readonly type: "tx/reject"; readonly currentT: ServerPosition; readonly reason: "stale" | "invalid" }
  | { readonly type: "changed"; readonly t: ServerPosition }
  | { readonly type: "presence"; readonly userId: string; readonly editingBlockUuid?: string }
  | { readonly type: "error"; readonly code: string; readonly message: string };
