import { useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { brl, currentMonth, lastMonths, longMonth, monthKey, normalize } from '../lib/format';
import { QuickAdd } from '../components/QuickAdd';
import { TransactionList } from '../components/TransactionList';
import { Field, Panel } from '../components/ui';
import type { Kind } from '../lib/types';

export function Transactions() {
  const { transactions, categories } = useStore();
  const [month, setMonth] = useState(currentMonth());
  const [kind, setKind] = useState<Kind | 'all'>('all');
  const [categoryId, setCategoryId] = useState('');
  const [search, setSearch] = useState('');

  const months = useMemo(() => {
    const set = new Set(lastMonths(12));
    transactions.forEach((t) => set.add(monthKey(t.occurred_on)));
    return [...set].sort().reverse();
  }, [transactions]);

  const items = transactions.filter(
    (t) =>
      (month === 'all' || monthKey(t.occurred_on) === month) &&
      (kind === 'all' || t.kind === kind) &&
      (!categoryId || t.category_id === categoryId) &&
      (!search || normalize(t.description).includes(normalize(search))),
  );
  const net = items.reduce((sum, t) => sum + (t.kind === 'in' ? t.amount : -t.amount), 0);

  return (
    <div className="content" style={{ flex: 'initial' }}>
      <Panel title="Novo lançamento">
        <QuickAdd />
      </Panel>
      <Panel title="Transações" action={<span className="mono">{items.length} itens · saldo {brl(net)}</span>}>
        <div className="row">
          <Field label="Mês">
            <select className="field" value={month} onChange={(e) => setMonth(e.target.value)}>
              <option value="all">Todos</option>
              {months.map((m) => (
                <option key={m} value={m}>{longMonth(m)} {m.slice(0, 4)}</option>
              ))}
            </select>
          </Field>
          <Field label="Tipo">
            <select className="field" value={kind} onChange={(e) => setKind(e.target.value as Kind | 'all')}>
              <option value="all">Todos</option>
              <option value="in">Entradas</option>
              <option value="out">Saídas</option>
            </select>
          </Field>
          <Field label="Categoria">
            <select className="field" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Todas</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Buscar" className="grow">
            <input className="field" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Descrição" />
          </Field>
        </div>
        <TransactionList items={items} deletable empty="Nada encontrado com esses filtros." />
      </Panel>
    </div>
  );
}
