import type { GraphEntityProjection } from "@tessera-ts/graph-db";
import { createQueryEngine, type Fact, type QueryLimits } from "@tessera-ts/query-engine";
import { z } from "zod";
import type { GraphWorker } from "./contracts.js";

const simpleInput = z.strictObject({ query: z.string().trim().min(1) });
const datalogInput = z.strictObject({ query: z.string().trim().min(1), inputs: z.array(z.unknown()).default([]) });
const pullInput = z.strictObject({ entity: z.string().trim().min(1), attributes: z.array(z.string().trim().min(1)).min(1) });

export interface AuthoritativeQueryReadPort {
  scan(pattern: unknown): Promise<readonly GraphEntityProjection[]>;
}

export interface AuthoritativeQueryService {
  query<T = unknown>(name: string, input: unknown): Promise<T>;
}

/** Builds every query from a fresh immutable scan of worker-owned graph authority. */
export function createAuthoritativeQueryService(read: AuthoritativeQueryReadPort, limits?: Partial<QueryLimits>): AuthoritativeQueryService {
  return Object.freeze({
    async query<T>(name: string, raw: unknown): Promise<T> {
      const source = facts(await read.scan(["*"]));
      const engine = limits === undefined ? createQueryEngine({ facts: source }) : createQueryEngine({ facts: source, limits });
      if (name === "query.simple") { const input = simpleInput.parse(raw); return engine.simple<T>(input.query); }
      if (name === "query.datalog") { const input = datalogInput.parse(raw); return engine.datalog<T>(input.query, ...input.inputs); }
      if (name === "query.custom") { const input = datalogInput.parse(raw); return engine.custom<T>(input.query, ...input.inputs); }
      if (name === "query.pull") { const input = pullInput.parse(raw); return engine.pull(input.entity, input.attributes) as Promise<T>; }
      throw new Error("UNKNOWN_QUERY");
    }
  });
}

/** Query-only plugin capabilities; mutation capabilities remain separate semantic commands. */
export function createWorkerQueryCapabilities(worker: Pick<GraphWorker, "query">) {
  return Object.freeze({
    q: <T = unknown>(query: string) => worker.query<T>("query.simple", { query }),
    customQuery: <T = unknown>(query: string, ...inputs: readonly unknown[]) => worker.query<T>("query.custom", { query, inputs }),
    datascriptQuery: <T = unknown>(query: string, ...inputs: readonly unknown[]) => worker.query<T>("query.datalog", { query, inputs })
  });
}

function facts(entities: readonly GraphEntityProjection[]): readonly Fact[] {
  return entities.flatMap(entity => Object.entries(entity.attributes).flatMap(([attribute, values]) => values.map(value => ({ entity: entity.uuid, attribute, value: normalize(value) }))));
}

function normalize(value: unknown): unknown {
  return value && typeof value === "object" && "type" in value && "uuid" in value && (value as { type?: unknown }).type === "entity"
    ? String((value as { uuid: unknown }).uuid)
    : value;
}
