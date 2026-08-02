/**
 * In-memory mock data layer for the prototype.
 *
 * Mirrors just enough of a query-builder surface for the UI. There is no
 * database, no network and no validation — data lives in memory for the
 * lifetime of the page.
 */
import { MOCK_USER, seedTables, type Row } from "./data";

const tables = seedTables();

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeMock(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  listeners.forEach((l) => l());
}

export function tableRows(name: string): Row[] {
  tables[name] ??= [];
  return tables[name]!;
}

export function mockId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

const RELATIONS: Record<string, { key: string; table: string; column: string }[]> = {
  card_requests: [
    { key: "card_products", table: "card_products", column: "product_id" },
    { key: "fee_profiles", table: "fee_profiles", column: "fee_profile_id" },
    { key: "customers", table: "customers", column: "customer_id" },
  ],
  cards: [
    { key: "card_products", table: "card_products", column: "product_id" },
    { key: "fee_profiles", table: "fee_profiles", column: "fee_profile_id" },
    { key: "customers", table: "customers", column: "customer_id" },
  ],
};

function withRelations(table: string, row: Row): Row {
  const rels = RELATIONS[table];
  if (!rels) return { ...row };
  const out: Row = { ...row };
  for (const rel of rels) {
    const target = tableRows(rel.table).find((r) => r['id'] === row[rel.column]);
    out[rel.key] = target ? { ...target } : null;
  }
  return out;
}

type Filter = (row: Row) => boolean;

class MockQuery implements PromiseLike<{ data: any; error: null }> {
  private filters: Filter[] = [];
  private sorts: { column: string; asc: boolean }[] = [];
  private take: number | null = null;
  private mode: "select" | "insert" | "update" | "delete" = "select";
  private payload: Row | Row[] | null = null;
  private one = false;

  constructor(private table: string) {}

  select(_columns?: string) {
    if (this.mode === "select") this.mode = "select";
    return this;
  }
  insert(values: Row | Row[]) {
    this.mode = "insert";
    this.payload = values;
    return this;
  }
  update(values: Row) {
    this.mode = "update";
    this.payload = values;
    return this;
  }
  delete() {
    this.mode = "delete";
    return this;
  }
  eq(column: string, value: unknown) {
    this.filters.push((r) => r[column] === value);
    return this;
  }
  neq(column: string, value: unknown) {
    this.filters.push((r) => r[column] !== value);
    return this;
  }
  in(column: string, values: unknown[]) {
    this.filters.push((r) => values.includes(r[column]));
    return this;
  }
  is(column: string, value: unknown) {
    this.filters.push((r) => r[column] === value);
    return this;
  }
  ilike(column: string, pattern: string) {
    const needle = String(pattern).replace(/%/g, "").toLowerCase();
    this.filters.push((r) => String(r[column] ?? "").toLowerCase().includes(needle));
    return this;
  }
  gte(column: string, value: any) {
    this.filters.push((r) => r[column] >= value);
    return this;
  }
  lte(column: string, value: any) {
    this.filters.push((r) => r[column] <= value);
    return this;
  }
  or(expression: string) {
    const parts = expression.split(",").map((p) => p.trim());
    this.filters.push((r) =>
      parts.some((part) => {
        const [column, op, ...rest] = part.split(".");
        const value = rest.join(".").replace(/%/g, "").toLowerCase();
        const actual = String(r[column ?? ""] ?? "").toLowerCase();
        if (op === "ilike" || op === "like") return actual.includes(value);
        return actual === value;
      }),
    );
    return this;
  }
  order(column: string, opts?: { ascending?: boolean }) {
    this.sorts.push({ column, asc: opts?.ascending !== false });
    return this;
  }
  limit(count: number) {
    this.take = count;
    return this;
  }
  range(from: number, to: number) {
    this.take = to - from + 1;
    return this;
  }
  maybeSingle() {
    this.one = true;
    return this;
  }
  single() {
    this.one = true;
    return this;
  }

  private run() {
    const rows = tableRows(this.table);
    const matches = (row: Row) => this.filters.every((f) => f(row));
    const stamp = new Date().toISOString();

    if (this.mode === "insert") {
      const incoming = Array.isArray(this.payload) ? this.payload : [this.payload ?? {}];
      const created = incoming.map((row) => ({
        id: mockId(this.table.slice(0, 2)),
        created_at: stamp,
        updated_at: stamp,
        ...row,
      }));
      rows.unshift(...created);
      notify();
      return this.one ? created[0] ?? null : created;
    }

    if (this.mode === "update") {
      const updated: Row[] = [];
      rows.forEach((row, index) => {
        if (!matches(row)) return;
        rows[index] = { ...row, ...(this.payload as Row), updated_at: stamp };
        updated.push(rows[index]!);
      });
      notify();
      return this.one ? updated[0] ?? null : updated;
    }

    if (this.mode === "delete") {
      const removed = rows.filter(matches);
      const kept = rows.filter((row) => !matches(row));
      rows.length = 0;
      rows.push(...kept);
      notify();
      return this.one ? removed[0] ?? null : removed;
    }

    let result = rows.filter(matches).map((row) => withRelations(this.table, row));
    for (const sort of [...this.sorts].reverse()) {
      result = result.sort((a, b) => {
        const av = a[sort.column];
        const bv = b[sort.column];
        if (av === bv) return 0;
        if (av === null || av === undefined) return 1;
        if (bv === null || bv === undefined) return -1;
        const cmp = av > bv ? 1 : -1;
        return sort.asc ? cmp : -cmp;
      });
    }
    if (this.take !== null) result = result.slice(0, this.take);
    return this.one ? result[0] ?? null : result;
  }

  then<TResult1 = { data: any; error: null }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve({ data: this.run(), error: null }).then(onfulfilled, onrejected);
  }
}

const MOCK_SESSION = {
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  expires_in: 3600,
  token_type: "bearer",
  user: {
    id: MOCK_USER.id,
    email: MOCK_USER.email,
    user_metadata: { full_name: MOCK_USER.full_name },
  },
};

/** Drop-in stand-in for the removed database client. */
export const mockClient = {
  from: (table: string) => new MockQuery(table),
  auth: {
    getSession: async () => ({ data: { session: MOCK_SESSION }, error: null }),
    getUser: async () => ({ data: { user: MOCK_SESSION.user }, error: null }),
    signInWithPassword: async () => ({ data: { session: MOCK_SESSION }, error: null }),
    signUp: async () => ({ data: { session: MOCK_SESSION }, error: null }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
};

export const supabase = mockClient;
export { MOCK_USER };
