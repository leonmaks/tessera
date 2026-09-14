export interface QueryEngine {
  simple<T = unknown>(dsl: string): Promise<T>;
  datalog<T = unknown>(query: string, ...inputs: readonly unknown[]): Promise<T>;
  custom<T = unknown>(query: string, ...inputs: readonly unknown[]): Promise<T>;
}

export interface QueryLimits {
  readonly timeoutMs: number;
  readonly maxResults: number;
  readonly maxIntermediateRows: number;
}
