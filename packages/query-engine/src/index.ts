export interface Fact { readonly entity: string; readonly attribute: string; readonly value: unknown; }
export interface QueryLimits { readonly timeoutMs: number; readonly maxResults: number; readonly maxIntermediateRows: number; }
export interface QueryEngine { simple<T = unknown>(dsl: string): Promise<T>; datalog<T = unknown>(query: string, ...inputs: readonly unknown[]): Promise<T>; custom<T = unknown>(query: string, ...inputs: readonly unknown[]): Promise<T>; pull(entity: string, attributes: readonly string[]): Promise<Readonly<Record<string, readonly unknown[]>>>; }
type Clause = readonly unknown[];
interface Datalog { readonly find: readonly unknown[]; readonly in?: readonly unknown[]; readonly where: readonly Clause[]; readonly rules?: Readonly<Record<string, readonly Clause[]>>; }
type Row = Map<string, unknown>;
interface State { steps: number; readonly deadline: number; readonly inputs: readonly unknown[]; readonly rules: Readonly<Record<string, readonly Clause[]>>; }

export function createQueryEngine(options: { readonly facts: readonly Fact[]; readonly limits?: Partial<QueryLimits> }): QueryEngine { return new Engine(options.facts, { timeoutMs: 100, maxResults: 1000, maxIntermediateRows: 10000, ...options.limits }); }
class Engine implements QueryEngine {
  constructor(private readonly facts: readonly Fact[], private readonly limits: QueryLimits) {}
  async simple<T>(dsl: string): Promise<T> { const found = /^\(task\s+([^)]*)\)$/.exec(dsl.trim()); if (!found) throw new Error("Unsupported simple query"); const statuses = new Set(found[1]!.trim().split(/\s+/).filter(Boolean)); return this.limit(this.facts.filter(fact => fact.attribute === ":task/status" && typeof fact.value === "string" && statuses.has(fact.value)).map(fact => fact.entity).sort()) as T; }
  async datalog<T>(query: string, ...inputs: readonly unknown[]): Promise<T> {
    const parsed = parseDatalog(query);
    if (!Array.isArray(parsed.find) || !Array.isArray(parsed.where)) throw new Error("Invalid Datalog query");
    const state: State = { steps: 0, deadline: Date.now() + this.limits.timeoutMs, inputs, rules: parsed.rules ?? {} };
    const source = this.evaluate(parsed.where, [inputRow(parsed.in, inputs)], state);
    const aggregates = parsed.find.map(aggregate);
    if (aggregates.some(Boolean)) return this.limit([parsed.find.map((term, index) => aggregates[index] ? applyAggregate(aggregates[index]!, source) : source[0]?.get(term as string))]) as T;
    return this.limit(dedupe(source.map(row => parsed.find.map(term => this.project(term, row))).sort(compare))) as T;
  }
  async custom<T>(query: string, ...inputs: readonly unknown[]): Promise<T> { return this.datalog<T>(query, ...inputs); }
  async pull(entity: string, attributes: readonly string[]): Promise<Readonly<Record<string, readonly unknown[]>>> { return this.pullSync(entity, attributes); }
  private evaluate(clauses: readonly Clause[], initial: Row[], state: State): Row[] { let rows = initial; for (const clause of clauses) rows = this.clause(clause, rows, state); return rows; }
  private clause(clause: Clause, rows: Row[], state: State): Row[] {
    this.tick(state); const op = clause[0];
    if (op === "and") return rows.flatMap(row => this.evaluate(assertClauses(clause.slice(1)), [new Map(row)], state));
    if (op === "or") return rows.flatMap(row => clause.slice(1).flatMap(branch => this.evaluate(branchClauses(branch), [new Map(row)], state)));
    if (op === "or-join") return rows.flatMap(row => clause.slice(2).flatMap(branch => this.evaluate(branchClauses(branch), [new Map(row)], state)));
    if (op === "not" || op === "not-join") { const branches = op === "not" ? clause.slice(1) : clause.slice(2); return rows.filter(row => !this.evaluate(assertClauses(branches), [new Map(row)], state).length); }
    if (op === "pred") return rows.filter(row => predicate(clause[1], clause.slice(2).map(term => resolve(term, row, state.inputs))));
    if (op === "rule") { const name = clause[1]; if (typeof name !== "string" || !state.rules[name]) throw new Error("Unknown Datalog rule"); return rows.flatMap(row => state.rules[name]!.flatMap(branch => this.evaluate(branchClauses(branch), [new Map(row)], state))); }
    if (clause.length !== 3) throw new Error("Invalid Datalog clause");
    const next: Row[] = []; for (const row of rows) for (const fact of this.facts) { this.tick(state); const candidate = new Map(row); if (match(candidate, clause[0], fact.entity, state.inputs) && match(candidate, clause[1], fact.attribute, state.inputs) && match(candidate, clause[2], fact.value, state.inputs)) next.push(candidate); } return next;
  }
  private project(term: unknown, row: Row): unknown { return Array.isArray(term) && term[0] === "pull" ? this.pullSync(String(resolve(term[1], row, [])), term.slice(2).map(String)) : resolve(term, row, []); }
  private pullSync(entity: string, attributes: readonly string[]): Readonly<Record<string, readonly unknown[]>> { const output: Record<string, unknown[]> = {}; for (const fact of this.facts) if (fact.entity === entity && attributes.includes(fact.attribute)) (output[fact.attribute] ??= []).push(fact.value); for (const values of Object.values(output)) values.sort(compareValue); return freeze(output); }
  private tick(state: State): void { if (++state.steps > this.limits.maxIntermediateRows) throw new Error("QUERY_LIMIT intermediate rows"); if (Date.now() > state.deadline) throw new Error("QUERY_LIMIT timeout"); }
  private limit<T>(rows: readonly T[]): readonly T[] { if (rows.length > this.limits.maxResults) throw new Error("QUERY_LIMIT results"); return freeze([...rows]); }
}
function assertClauses(value: readonly unknown[]): Clause[] { if (value.some(item => !Array.isArray(item))) throw new Error("Invalid Datalog clause"); return value as Clause[]; }
function branchClauses(value: unknown): Clause[] { return Array.isArray(value) && Array.isArray(value[0]) ? assertClauses(value) : [value as Clause]; }
function match(row: Row, term: unknown, value: unknown, inputs: readonly unknown[]): boolean { if (typeof term === "string" && term.startsWith("?")) { if (!row.has(term)) { row.set(term, value); return true; } return same(row.get(term), value); } return typeof term === "string" && term.startsWith("$") ? same(inputs[Number(term.slice(1))], value) : same(term, value); }
function resolve(term: unknown, row: Row, inputs: readonly unknown[]): unknown { return typeof term === "string" && term.startsWith("?") ? row.get(term) : typeof term === "string" && term.startsWith("$") ? inputs[Number(term.slice(1))] : term; }
function predicate(name: unknown, values: readonly unknown[]): boolean { if (name === "=") return same(values[0], values[1]); if (name === "!=") return !same(values[0], values[1]); if (name === "includes?") return typeof values[0] === "string" && typeof values[1] === "string" && values[0].includes(values[1]); throw new Error("Unsupported Datalog predicate"); }
function aggregate(term: unknown): readonly ["count" | "count-distinct", unknown] | undefined { return Array.isArray(term) && (term[0] === "count" || term[0] === "count-distinct") && term.length === 2 ? term as ["count" | "count-distinct", unknown] : undefined; }
function applyAggregate(term: readonly ["count" | "count-distinct", unknown], rows: readonly Row[]): number { const values = rows.map(row => resolve(term[1], row, [])); return term[0] === "count" ? values.length : new Set(values.map(value => JSON.stringify(value))).size; }
function inputRow(specification: readonly unknown[] | undefined, inputs: readonly unknown[]): Row { const row: Row = new Map(); if (specification === undefined) return row; let index = 0; for (const term of specification) { if (term === "$" || term === "%") continue; if (typeof term === "string" && term.startsWith("?")) row.set(term, inputs[index++]); else index++; } return row; }

interface EdnCollection { readonly kind: "vector" | "list"; readonly items: readonly EdnValue[]; }
type EdnValue = string | number | boolean | null | EdnCollection;
function parseDatalog(query: string): Datalog {
  const trimmed = query.trim();
  if (trimmed.startsWith("{")) { try { return JSON.parse(trimmed) as Datalog; } catch { throw new Error("Unsupported Datalog syntax"); } }
  const tokens = tokenize(trimmed); let index = 0;
  const read = (): EdnValue => {
    const token = tokens[index++]; if (token === undefined) throw new Error("Unsupported Datalog syntax");
    if (token === "[" || token === "(") { const close = token === "[" ? "]" : ")"; const items: EdnValue[] = []; while (tokens[index] !== close) { if (index >= tokens.length) throw new Error("Unsupported Datalog syntax"); items.push(read()); } index++; return { kind: token === "[" ? "vector" : "list", items }; }
    if (token === "]" || token === ")") throw new Error("Unsupported Datalog syntax");
    if (token.startsWith('"')) { try { return JSON.parse(token) as string; } catch { throw new Error("Unsupported Datalog syntax"); } }
    if (token === "nil") return null; if (token === "true") return true; if (token === "false") return false;
    const numeric = Number(token); return token !== "" && Number.isFinite(numeric) ? numeric : token;
  };
  const root = read(); if (index !== tokens.length || !collection(root, "vector")) throw new Error("Unsupported Datalog syntax");
  const sections = new Map<string, EdnValue[]>(); let section: string | undefined;
  for (const item of root.items) { if (typeof item === "string" && [":find", ":in", ":where"].includes(item)) { section = item; sections.set(item, []); } else { if (section === undefined) throw new Error("Invalid Datalog query"); sections.get(section)!.push(item); } }
  const find = sections.get(":find"); const where = sections.get(":where"); if (!find || !where) throw new Error("Invalid Datalog query");
  const input = sections.get(":in");
  return input === undefined ? { find: find.map(findTerm), where: where.map(whereClause) } : { find: find.map(findTerm), in: input.map(scalar), where: where.map(whereClause) };
}
function tokenize(source: string): string[] { const tokens: string[] = []; for (let index = 0; index < source.length;) { const char = source[index]!; if (/\s|,/.test(char)) { index++; continue; } if ("[]()".includes(char)) { tokens.push(char); index++; continue; } if (char === '"') { let end = index + 1; for (; end < source.length; end++) { if (source[end] === "\\") { end++; continue; } if (source[end] === '"') { end++; break; } } if (source[end - 1] !== '"') throw new Error("Unsupported Datalog syntax"); tokens.push(source.slice(index, end)); index = end; continue; } let end = index + 1; while (end < source.length && !/[\s,\[\]()]/.test(source[end]!)) end++; tokens.push(source.slice(index, end)); index = end; } return tokens; }
function collection(value: EdnValue, kind?: EdnCollection["kind"]): value is EdnCollection { return typeof value === "object" && value !== null && "kind" in value && (kind === undefined || value.kind === kind); }
function scalar(value: EdnValue): unknown { if (collection(value)) throw new Error("Invalid Datalog term"); return value; }
function findTerm(value: EdnValue): unknown { if (!collection(value)) return value; if (value.kind !== "list" || value.items.length < 2) throw new Error("Invalid Datalog find expression"); const [operation, subject, pattern] = value.items; if (operation === "pull" && pattern !== undefined && collection(pattern, "vector")) return [operation, scalar(subject!), ...pattern.items.map(scalar)]; if ((operation === "count" || operation === "count-distinct") && value.items.length === 2) return [operation, scalar(subject!)]; throw new Error("Invalid Datalog find expression"); }
function whereClause(value: EdnValue): Clause { if (!collection(value)) throw new Error("Invalid Datalog clause"); const first = value.items[0]; const expression = value.kind === "vector" && value.items.length === 1 && first !== undefined && collection(first, "list") ? first : value; if (expression.kind === "vector") return expression.items.map(scalar); const [operation, ...arguments_] = expression.items; if (typeof operation !== "string") throw new Error("Invalid Datalog clause"); if (["=", "!=", "includes?"].includes(operation)) return ["pred", operation, ...arguments_.map(scalar)]; if (["and", "or", "not", "or-join", "not-join"].includes(operation)) return [operation, ...arguments_.map(item => collection(item, "vector") ? whereClause(item) : collection(item, "list") ? whereClause(item) : scalar(item))]; return ["rule", operation, ...arguments_.map(scalar)]; }
function dedupe(rows: readonly unknown[][]): unknown[][] { const unique = new Map<string, unknown[]>(); for (const row of rows) unique.set(JSON.stringify(row), row); return [...unique.values()]; }
function same(a: unknown, b: unknown): boolean { return JSON.stringify(a) === JSON.stringify(b); }
function compare(a: readonly unknown[], b: readonly unknown[]): number { return JSON.stringify(a).localeCompare(JSON.stringify(b)); }
function compareValue(a: unknown, b: unknown): number { return JSON.stringify(a).localeCompare(JSON.stringify(b)); }
function freeze<T>(value: T): T { if (value && typeof value === "object" && !Object.isFrozen(value)) { for (const child of Object.values(value as Record<string, unknown>)) freeze(child); Object.freeze(value); } return value; }
