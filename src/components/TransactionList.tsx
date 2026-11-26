import { useStore } from '../lib/store';
import { brl, shortDate } from '../lib/format';
import type { Transaction } from '../lib/types';
import { Avatar, Icon } from './ui';

export function TransactionList({ items, empty = 'Nenhuma transação ainda.', deletable = false }: { items: Transaction[]; empty?: string; deletable?: boolean }) {
  const { categories, accounts, remove } = useStore();
  if (items.length === 0) return <p className="empty">{empty}</p>;

  return (
    <ul className="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {items.map((t) => {
        const category = categories.find((c) => c.id === t.category_id)?.name ?? 'Sem categoria';
        const account = accounts.find((a) => a.id === t.account_id)?.name;
        return (
          <li key={t.id} className="list-row">
            <Avatar label={category} />
            <div className="body">
              <span className="title">{t.description}</span>
              <span className="sub">
                {category} · {shortDate(t.occurred_on)}
                {account ? ` · ${account}` : ''}
              </span>
            </div>
            <span className={`amount ${t.kind}`}>
              {t.kind === 'in' ? '+ ' : '− '}
              {brl(t.amount)}
            </span>
            {deletable && (
              <button
                type="button"
                className="icon-btn danger"
                aria-label={`Excluir ${t.description}`}
                onClick={() => {
                  if (confirm(`Excluir "${t.description}"?`)) void remove('transactions', t.id);
                }}
              >
                <Icon name="trash" size={16} />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
