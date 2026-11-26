import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useStore } from '../lib/store';
import { brl, parseMoney, today } from '../lib/format';
import { suggestCategory } from '../lib/import';
import type { Kind } from '../lib/types';
import { Field, Icon } from './ui';

export function QuickAdd() {
  const { categories, accounts, insert } = useStore();
  const [kind, setKind] = useState<Kind>('out');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(today());
  const [hint, setHint] = useState('Escolha se é saída ou entrada e lance.');
  const [busy, setBusy] = useState(false);
  const [touchedCategory, setTouchedCategory] = useState(false);

  const options = useMemo(() => categories.filter((c) => c.kind === kind), [categories, kind]);

  useEffect(() => {
    if (!options.some((c) => c.id === categoryId)) setCategoryId(options[0]?.id ?? '');
  }, [options, categoryId]);

  useEffect(() => {
    if (!accountId && accounts[0]) setAccountId(accounts[0].id);
  }, [accounts, accountId]);

  function changeDescription(value: string) {
    setDescription(value);
    if (touchedCategory) return;
    const guess = suggestCategory(value, kind, categories);
    if (guess) setCategoryId(guess);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const value = parseMoney(amount);
    if (!description.trim() || !(value > 0)) {
      setHint('Preencha a descrição e um valor maior que zero.');
      return;
    }
    setBusy(true);
    const ok = await insert('transactions', {
      description: description.trim(),
      amount: Math.round(value * 100) / 100,
      kind,
      category_id: categoryId || null,
      account_id: accountId || null,
      occurred_on: date,
    });
    setBusy(false);
    if (ok) {
      setHint(`Lançado: ${description.trim()} — ${brl(value)}`);
      setDescription('');
      setAmount('');
      setTouchedCategory(false);
    }
  }

  return (
    <form className="glass-2" onSubmit={submit} style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12, borderRadius: 18, background: 'var(--field)' }}>
      <div className="row">
        <Field label="Descrição" className="grow">
          <input className="field" type="text" placeholder="Ex.: Mercado da semana" maxLength={140} value={description} onChange={(e) => changeDescription(e.target.value)} />
        </Field>
        <Field label="Valor · R$">
          <input className="field num" type="text" inputMode="decimal" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Data">
          <input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </Field>
      </div>
      <div className="row">
        <Field label="Categoria">
          <select
            className="field"
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setTouchedCategory(true);
            }}
          >
            {options.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Conta">
          <select className="field" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </Field>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <button type="button" className="pill toggle" aria-pressed={kind === 'out'} onClick={() => setKind('out')}>Saída</button>
        <button type="button" className="pill toggle" aria-pressed={kind === 'in'} onClick={() => setKind('in')}>Entrada</button>
        <span className="muted" role="status" style={{ fontSize: 12, flexGrow: 1 }}>{hint}</span>
        <button type="submit" className="btn-primary" disabled={busy}>
          <Icon name="plus" size={14} strokeWidth={2.2} />
          Lançar
        </button>
      </div>
    </form>
  );
}
