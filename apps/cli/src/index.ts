import type { GraphDaemon } from "@tessera-ts/desktop-cli-runtime";

/** Thin client: it can invoke only daemon-provided semantic commands. */
export function createCliClient(daemon: Pick<GraphDaemon, "invoke" | "backup" | "shutdown">) {
  return Object.freeze({ invoke: (command: unknown) => daemon.invoke(command), backup: () => daemon.backup(), shutdown: () => daemon.shutdown() });
}
