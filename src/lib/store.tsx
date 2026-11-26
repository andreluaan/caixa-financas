import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from './supabase';
import { demoData, isDemo, newId } from './demo';
import type { Account, Bill, Budget, Category, Goal, NewTransaction, Transaction } from './types';

interface Data {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  bills: Bill[];
}

const empty: Data = { accounts: [], categories: [], transactions: [], budgets: [], goals: [], bills: [] };

const moneyFields = ['amount', 'opening_balance', 'credit_limit', 'monthly_limit', 'target', 'saved'];

function coerce<T>(rows: unknown[] | null): T[] {
  return (rows ?? []).map((row) => {
    const copy = { ...(row as Record<string, unknown>) };
    for (const field of moneyFields) {
      if (copy[field] != null) copy[field] = Number(copy[field]);
    }
    return copy as T;
  });
}

type Table = keyof Data;

interface Store extends Data {
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  insert: <T extends Table>(table: T, values: Record<string, unknown> | Record<string, unknown>[]) => Promise<boolean>;
  insertOne: (table: Table, values: Record<string, unknown>) => Promise<string | null>;
  update: (table: Table, id: string, values: Record<string, unknown>) => Promise<boolean>;
  remove: (table: Table, id: string) => Promise<boolean>;
  removeMany: (table: Table, ids: string[]) => Promise<boolean>;
  addTransactions: (rows: NewTransaction[]) => Promise<{ inserted: number; skipped: number } | null>;
  clearError: () => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [accounts, categories, transactions, budgets, goals, bills] = await Promise.all([
      supabase.from('accounts').select('*').order('created_at'),
      supabase.from('categories').select('*').order('name'),
      supabase.from('transactions').select('*').order('occurred_on', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('budgets').select('*'),
      supabase.from('goals').select('*').order('created_at'),
      supabase.from('bills').select('*').order('due_day'),
    ]);
    const failed = [accounts, categories, transactions, budgets, goals, bills].find((r) => r.error);
    if (failed?.error) setError(failed.error.message);
    setData({
      accounts: coerce<Account>(accounts.data),
      categories: coerce<Category>(categories.data),
      transactions: coerce<Transaction>(transactions.data),
      budgets: coerce<Budget>(budgets.data),
      goals: coerce<Goal>(goals.data),
      bills: coerce<Bill>(bills.data),
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isDemo) {
      setData(demoData());
      setLoading(false);
      return;
    }
    void reload();
  }, [reload]);

  const run = useCallback(
    async (query: PromiseLike<{ error: { message: string } | null }>) => {
      const { error: err } = await query;
      if (err) {
        setError(err.message);
        return false;
      }
      await reload();
      return true;
    },
    [reload],
  );

  const store = useMemo<Store>(
    () => (isDemo ? demoStore(data, setData, error, setError) : {
      ...data,
      loading,
      error,
      reload,
      clearError: () => setError(null),
      insert: (table, values) => run(supabase.from(table).insert(values)),
      insertOne: async (table, values) => {
        const { data: row, error: err } = await supabase.from(table).insert(values).select('id').single();
        if (err) {
          setError(err.message);
          return null;
        }
        await reload();
        return (row as { id: string }).id;
      },
      update: (table, id, values) => run(supabase.from(table).update(values).eq('id', id)),
      remove: (table, id) => run(supabase.from(table).delete().eq('id', id)),
      removeMany: (table, ids) => run(supabase.from(table).delete().in('id', ids)),
      addTransactions: async (rows) => {
        const withKey = rows.filter((r) => r.import_key);
        const { data: inserted, error: err } = await supabase
          .from('transactions')
          .upsert(rows, { onConflict: 'user_id,import_key', ignoreDuplicates: true })
          .select('id');
        if (err) {
          setError(err.message);
          return null;
        }
        await reload();
        const count = inserted?.length ?? 0;
        return { inserted: count, skipped: Math.max(0, withKey.length - count) };
      },
    }),
    [data, loading, error, reload, run],
  );

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

// In-memory version used by `npm run demo`; nothing leaves the browser tab.
function demoStore(
  data: Data,
  setData: (update: (d: Data) => Data) => void,
  error: string | null,
  setError: (e: string | null) => void,
): Store {
  const sortTx = (rows: Transaction[]) =>
    [...rows].sort((a, b) => b.occurred_on.localeCompare(a.occurred_on));
  const patch = (table: Table, change: (rows: unknown[]) => unknown[]) =>
    setData((d) => {
      const rows = change(d[table] as unknown[]);
      return { ...d, [table]: table === 'transactions' ? sortTx(rows as Transaction[]) : rows };
    });
  return {
    ...data,
    loading: false,
    error,
    clearError: () => setError(null),
    reload: async () => {},
    insert: async (table, values) => {
      const list = (Array.isArray(values) ? values : [values]).map((v) => ({ id: newId(), import_key: null, ...v }));
      patch(table, (rows) => [...rows, ...list]);
      return true;
    },
    insertOne: async (table, values) => {
      const id = newId();
      setData((d) => ({ ...d, [table]: [...(d[table] as unknown[]), { id, ...values }] }));
      return id;
    },
    update: async (table, id, values) => {
      patch(table, (rows) => (rows as { id: string }[]).map((r) => (r.id === id ? { ...r, ...values } : r)));
      return true;
    },
    remove: async (table, id) => {
      patch(table, (rows) => (rows as { id: string }[]).filter((r) => r.id !== id));
      return true;
    },
    removeMany: async (table, ids) => {
      const drop = new Set(ids);
      patch(table, (rows) => (rows as { id: string }[]).filter((r) => !drop.has(r.id)));
      return true;
    },
    addTransactions: async (rows) => {
      const keys = new Set(data.transactions.map((t) => t.import_key));
      const fresh = rows.filter((r) => !r.import_key || !keys.has(r.import_key));
      patch('transactions', (rows) => [...rows, ...fresh.map((r) => ({ ...r, id: newId(), import_key: r.import_key ?? null }))]);
      return { inserted: fresh.length, skipped: rows.length - fresh.length };
    },
  };
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}
