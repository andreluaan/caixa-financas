import { useState, type FormEvent, type ReactNode } from 'react';
import { useStore } from '../lib/store';
import { brl, parseMoney } from '../lib/format';
import { suggestCategory } from '../lib/import';
import type { AccountKind, Budget, Goal } from '../lib/types';
import { Field, Icon, type IconName } from './ui';

const money = (value: string) => Math.round(parseMoney(value) * 100) / 100;

function Submit({ children, busy }: { children: ReactNode; busy?: boolean }) {
  return (
    <button className="btn-primary" type="submit" disabled={busy}>
      <Icon name="check" size={15} strokeWidth={2.2} />
      {children}
    </button>
  );
}

function DayInput({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <Field label={label}>
      <input className="field num" type="number" inputMode="numeric" min={1} max={31} placeholder="1–31" required={required} value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export function NewBillForm({ onDone }: { onDone: () => void }) {
  const { insert, categories, accounts } = useStore();
  const out = categories.filter((c) => c.kind === 'out');
  const payers = accounts.filter((a) => a.kind !== 'credit').concat(accounts.filter((a) => a.kind === 'credit'));
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [day, setDay] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState(payers[0]?.id ?? '');
  const guessed = suggestCategory(name, 'out', categories);
  const category = categoryId ?? guessed ?? '';

  async function submit(e: FormEvent) {
    e.preventDefault();
    const value = money(amount);
    if (!name.trim() || !(value > 0) || !day) return;
    const ok = await insert('bills', {
      name: name.trim(),
      amount: value,
      due_day: Number(day),
      category_id: category || null,
      account_id: accountId || null,
    });
    if (ok) onDone();
  }

  return (
    <form className="stack" onSubmit={submit}>
      <Field label="O que é">
        <input className="field" autoFocus required maxLength={60} placeholder="Internet, aluguel, academia…" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <div className="row">
        <Field label="Valor · R$">
          <input className="field num" required inputMode="decimal" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <DayInput label="Vence todo dia" value={day} onChange={setDay} required />
      </div>
      <details className="more">
        <summary>
          {out.find((c) => c.id === category)?.name ?? 'Sem categoria'} · {accounts.find((a) => a.id === accountId)?.name ?? 'sem conta'}
        </summary>
        <div className="stack">
          <Field label="Categoria">
            <select className="field" value={category} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Sem categoria</option>
              {out.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Paga com">
            <select className="field" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {payers.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </Field>
        </div>
      </details>
      <Submit>Salvar conta</Submit>
    </form>
  );
}

const kinds: { id: AccountKind; label: string; icon: IconName; placeholder: string }[] = [
  { id: 'checking', label: 'Conta no banco', icon: 'bank', placeholder: 'Nubank, Itaú…' },
  { id: 'credit', label: 'Cartão de crédito', icon: 'card', placeholder: 'Cartão Nubank…' },
  { id: 'savings', label: 'Poupança', icon: 'piggy', placeholder: 'Poupança Caixa…' },
  { id: 'cash', label: 'Dinheiro', icon: 'wallet', placeholder: 'Carteira' },
];

export const kindLabel: Record<AccountKind, string> = {
  checking: 'Conta no banco',
  credit: 'Cartão de crédito',
  savings: 'Poupança',
  cash: 'Dinheiro',
};

export function NewAccountForm({ onDone, initialKind = 'checking' }: { onDone: () => void; initialKind?: AccountKind }) {
  const { insert } = useStore();
  const [kind, setKind] = useState<AccountKind>(initialKind);
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [limit, setLimit] = useState('');
  const [closing, setClosing] = useState('');
  const [due, setDue] = useState('');
  const credit = kind === 'credit';
  const current = kinds.find((k) => k.id === kind)!;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const ok = await insert('accounts', {
      name: name.trim() || current.placeholder.replace('…', '').split(',')[0],
      kind,
      opening_balance: credit ? 0 : money(balance) || 0,
      credit_limit: credit && limit ? money(limit) : null,
      closing_day: credit ? Number(closing) : null,
      due_day: credit ? Number(due) : null,
    });
    if (ok) onDone();
  }

  return (
    <form className="stack" onSubmit={submit}>
      <div className="choices" role="group" aria-label="Tipo">
        {kinds.map((k) => (
          <button key={k.id} type="button" className="choice" aria-pressed={kind === k.id} onClick={() => setKind(k.id)}>
            <Icon name={k.icon} size={20} />
            {k.label}
          </button>
        ))}
      </div>
      <Field label="Nome">
        <input className="field" maxLength={60} placeholder={current.placeholder} value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      {credit ? (
        <>
          <div className="row">
            <DayInput label="Fecha dia" value={closing} onChange={setClosing} required />
            <DayInput label="Vence dia" value={due} onChange={setDue} required />
          </div>
          <Field label="Limite · R$ (opcional)">
            <input className="field num" inputMode="decimal" placeholder="0,00" value={limit} onChange={(e) => setLimit(e.target.value)} />
          </Field>
        </>
      ) : (
        <Field label="Quanto tem hoje · R$">
          <input className="field num" inputMode="decimal" placeholder="0,00" value={balance} onChange={(e) => setBalance(e.target.value)} />
        </Field>
      )}
      <Submit>Adicionar {credit ? 'cartão' : 'conta'}</Submit>
    </form>
  );
}

export function GoalForm({ onDone }: { onDone: () => void }) {
  const { insert } = useStore();
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    const value = money(target);
    if (!name.trim() || !(value > 0)) return;
    if (await insert('goals', { name: name.trim(), target: value, deadline: deadline || null })) onDone();
  }

  return (
    <form className="stack" onSubmit={submit}>
      <Field label="Para quê">
        <input className="field" autoFocus required maxLength={60} placeholder="Reserva de emergência" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Quanto quer juntar · R$">
        <input className="field num" required inputMode="decimal" placeholder="0,00" value={target} onChange={(e) => setTarget(e.target.value)} />
      </Field>
      <details className="more">
        <summary>Prazo (opcional)</summary>
        <div className="stack">
          <input className="field" type="date" aria-label="Prazo" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
      </details>
      <Submit>Criar meta</Submit>
    </form>
  );
}

export function GoalMoveForm({ goal, onDone }: { goal: Goal; onDone: () => void }) {
  const { update, remove } = useStore();
  const [amount, setAmount] = useState('');

  async function move(sign: 1 | -1) {
    const value = money(amount);
    if (!(value > 0)) return;
    const saved = Math.max(0, Math.round((goal.saved + sign * value) * 100) / 100);
    if (await update('goals', goal.id, { saved })) onDone();
  }

  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        void move(1);
      }}
    >
      <span className="muted" style={{ fontSize: 13 }}>
        Guardado: {brl(goal.saved)} de {brl(goal.target)}
      </span>
      <Field label="Valor · R$">
        <input className="field num" autoFocus inputMode="decimal" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </Field>
      <div className="row">
        <button className="btn-primary" type="submit"><Icon name="plus" size={15} strokeWidth={2.2} />Guardar</button>
        <button className="pill" type="button" onClick={() => void move(-1)}>Retirar</button>
      </div>
      <button
        type="button"
        className="pill danger-text"
        onClick={() => {
          if (confirm(`Excluir a meta "${goal.name}"?`)) void remove('goals', goal.id).then(onDone);
        }}
      >
        <Icon name="trash" size={14} />Excluir meta
      </button>
    </form>
  );
}

export function BudgetForm({ budget, onDone }: { budget?: Budget; onDone: () => void }) {
  const { insert, insertOne, update, remove, budgets, categories } = useStore();
  const free = categories.filter((c) => c.kind === 'out' && !budgets.some((b) => b.category_id === c.id));
  const [categoryId, setCategoryId] = useState(budget?.category_id ?? free[0]?.id ?? 'new');
  const [limit, setLimit] = useState(budget ? budget.monthly_limit.toFixed(2).replace('.', ',') : '');
  const [newName, setNewName] = useState('');
  const [keywords, setKeywords] = useState('');
  const creating = !budget && categoryId === 'new';

  async function submit(e: FormEvent) {
    e.preventDefault();
    const value = money(limit);
    if (!(value > 0)) return;
    if (budget) {
      if (await update('budgets', budget.id, { monthly_limit: value })) onDone();
      return;
    }
    let category = categoryId;
    if (creating) {
      if (!newName.trim()) return;
      const words = keywords.split(',').map((w) => w.trim()).filter(Boolean);
      const created = await insertOne('categories', { name: newName.trim(), kind: 'out', keywords: words });
      if (!created) return;
      category = created;
    }
    if (await insert('budgets', { category_id: category, monthly_limit: value })) onDone();
  }

  return (
    <form className="stack" onSubmit={submit}>
      {!budget && (
        <Field label="Categoria">
          <select className="field" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {free.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
            <option value="new">+ Nova categoria…</option>
          </select>
        </Field>
      )}
      {creating && (
        <>
          <Field label="Nome da categoria">
            <input className="field" required maxLength={40} placeholder="Pet" value={newName} onChange={(e) => setNewName(e.target.value)} />
          </Field>
          <Field label="Palavras que identificam (opcional)">
            <input className="field" placeholder="pet shop, ração" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
          </Field>
        </>
      )}
      <Field label="Limite por mês · R$">
        <input className="field num" autoFocus={!!budget} required inputMode="decimal" placeholder="0,00" value={limit} onChange={(e) => setLimit(e.target.value)} />
      </Field>
      <Submit>{budget ? 'Salvar limite' : 'Criar limite'}</Submit>
      {budget && (
        <button type="button" className="pill danger-text" onClick={() => void remove('budgets', budget.id).then(onDone)}>
          <Icon name="trash" size={14} />Remover limite
        </button>
      )}
    </form>
  );
}
