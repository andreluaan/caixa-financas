import { useRef, useState } from 'react';
import { useStore } from '../lib/store';
import { brl, shortDate } from '../lib/format';
import type { Transaction } from '../lib/types';
import { Avatar, Sheet } from './ui';
import { TransactionForm } from './forms';

export function TransactionList({ items, empty = 'Nenhuma transação ainda.' }: { items: Transaction[]; empty?: string }) {
  const { categories, accounts } = useStore();
  const [editing, setEditing] = useState<Transaction | null>(null);
  const shown = useRef(editing);
  if (editing) shown.current = editing;

  if (items.length === 0) return <p className="empty">{empty}</p>;

  return (
    <>
      <ul className="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {items.map((t) => {
          const category = categories.find((c) => c.id === t.category_id)?.name ?? 'Sem categoria';
          const account = accounts.find((a) => a.id === t.account_id)?.name;
          return (
            <li key={t.id} className="list-row">
              <button type="button" className="row-button tx-row" onClick={() => setEditing(t)} aria-label={`Editar ${t.description}`}>
                <Avatar label={category} />
                <span className="body">
                  <span className="title">{t.description}</span>
                  <span className="sub">
                    {category} · {shortDate(t.occurred_on)}
                    {account ? ` · ${account}` : ''}
                  </span>
                </span>
                <span className={`amount ${t.kind}`}>
                  {t.kind === 'in' ? '+ ' : '− '}
                  {brl(t.amount)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <Sheet open={editing !== null} onClose={() => setEditing(null)} title="Editar lançamento">
        {shown.current && <TransactionForm tx={shown.current} onDone={() => setEditing(null)} />}
      </Sheet>
    </>
  );
}
