export interface Clock {
  now(): number;
}

/** Finite replay ports never fall back to environment time or randomness. */
export class SequenceClock implements Clock {
  private readonly values: readonly number[];
  private cursor = 0;

  constructor(values: readonly number[]) {
    if (values.some(value => !Number.isFinite(value))) throw new Error("Invalid clock value");
    this.values = [...values];
  }

  now(): number {
    const value = this.values[this.cursor];
    if (value === undefined) throw new Error("Clock sequence exhausted");
    this.cursor++;
    return value;
  }
}

export class SequenceUUIDGenerator implements UUIDGenerator {
  private readonly values: readonly string[];
  private cursor = 0;

  constructor(values: readonly string[]) {
    if (values.some(value => !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))) {
      throw new Error("Invalid UUID value");
    }
    this.values = [...values];
  }

  next(): string {
    const value = this.values[this.cursor];
    if (value === undefined) throw new Error("UUID sequence exhausted");
    this.cursor++;
    return value;
  }
}

export interface UUIDGenerator {
  next(): string;
}

export interface KeyValueStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface PlatformAdapter {
  readonly clock: Clock;
  readonly uuid: UUIDGenerator;
  readonly kv: KeyValueStore;
}
