import { useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { brl, currentMonth, lastMonths, longMonth, monthKey, normalize } from '../lib/format';
import { QuickAdd } from '../components/QuickAdd';
import { TransactionList } from '../components/TransactionList';
import { AddButton, Icon, Panel, Sheet } from '../components/ui';
import type { Kind } from '../lib/types';

export function Transactions() {
  const { transactions } = useStore();
  const [month, setMonth] = useState(currentMonth());
  const [kind, setKind] = useState<Kind | 'all'>('all');
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);

  const months = useMemo(() => {
    const set = new Set(lastMonths(12));
    transactions.forEach((t) => set.add(monthKey(t.occurred_on)));
    return [...set].sort().reverse();
  }, [transactions]);

  const items = transactions.filter(
    (t) =>
      (month === 'all' || monthKey(t.occurred_on) === month) &&
      (kind === 'all' || t.kind === kind) &&
      (!search || normalize(t.description).includes(normalize(search))),
  );
  const net = items.reduce((sum, t) => sum + (t.kind === 'in' ? t.amount : -t.amount), 0);

  return (
    <>
      <Panel
        title="Transações"
        action={
          <div className="chips">
            <a className="pill" href="#/import">
              <Icon name="upload" size={14} />
              Importar
            </a>
            <AddButton label="Lançar" onClick={() => setAdding(true)} />
          </div>
        }
      >
        <div className="filters">
          <select className="field" aria-label="Mês" value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="all">Todos os meses</option>
            {months.map((m) => (
              <option key={m} value={m}>{longMonth(m)} {m.slice(0, 4)}</option>
            ))}
          </select>
          <input className="field" type="search" aria-label="Buscar" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar…" />
          <div className="segmented" role="group" aria-label="Tipo">
            {([['all', 'Todas'], ['in', 'Entradas'], ['out', 'Saídas']] as const).map(([id, label]) => (
              <button key={id} type="button" aria-pressed={kind === id} onClick={() => setKind(id)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <span className="muted num" style={{ fontSize: 13 }}>
          {items.length} {items.length === 1 ? 'lançamento' : 'lançamentos'} · saldo {brl(net)}
        </span>
        <TransactionList items={items} empty="Nada encontrado." />
      </Panel>

      <Sheet open={adding} onClose={() => setAdding(false)} title="Novo lançamento">
        <QuickAdd onDone={() => setAdding(false)} />
      </Sheet>
    </>
  );
}
