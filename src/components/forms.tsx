import { useState, type FormEvent, type ReactNode } from 'react';
import { useStore } from '../lib/store';
import { brl, parseMoney, today } from '../lib/format';
import { suggestCategory } from '../lib/import';
import type { AccountKind, Bill, Budget, Goal, Kind, Recurrence, Transaction } from '../lib/types';
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

export function BillForm({ bill, initialKind = 'out', onDone }: { bill?: Bill; initialKind?: Kind; onDone: () => void }) {
  const { insert, update, remove, categories, accounts } = useStore();
  const [kind, setKind] = useState<Kind>(bill?.kind ?? initialKind);
  const [recurrence, setRecurrence] = useState<Recurrence>(bill?.recurrence ?? 'monthly');
  const [name, setName] = useState(bill?.name ?? '');
  const [amount, setAmount] = useState(bill ? bill.amount.toFixed(2).replace('.', ',') : '');
  const [day, setDay] = useState(bill?.due_day ? String(bill.due_day) : '');
  const [date, setDate] = useState(bill?.due_date ?? today());
  const [categoryId, setCategoryId] = useState<string | null>(bill ? bill.category_id ?? '' : null);
  const payers = kind === 'in' ? accounts.filter((a) => a.kind !== 'credit') : accounts;
  const [accountId, setAccountId] = useState(bill?.account_id ?? payers[0]?.id ?? '');
  const [settledNow, setSettledNow] = useState(true);
  const options = categories.filter((c) => c.kind === kind);
  const category = categoryId ?? suggestCategory(name, kind, categories) ?? '';
  const dayPassed = !bill && recurrence === 'monthly' && Number(day) > 0 && Number(day) < new Date().getDate();
  const verb = kind === 'in' ? 'recebido' : 'pago';

  async function submit(e: FormEvent) {
    e.preventDefault();
    const value = money(amount);
    if (!name.trim() || !(value > 0)) return;
    const values = {
      name: name.trim(),
      amount: value,
      kind,
      recurrence,
      due_day: recurrence === 'monthly' ? Number(day) : null,
      due_date: recurrence === 'once' ? date : null,
      category_id: category || null,
      account_id: accountId || null,
      ...(dayPassed && settledNow ? { last_paid_month: `${today().slice(0, 7)}-01` } : {}),
    };
    const ok = bill ? await update('bills', bill.id, values) : await insert('bills', values);
    if (ok) onDone();
  }

  return (
    <form className="stack" onSubmit={submit}>
      <div className="segmented wide" role="group" aria-label="Tipo">
        <button type="button" aria-pressed={kind === 'out'} onClick={() => setKind('out')}>A pagar</button>
        <button type="button" aria-pressed={kind === 'in'} onClick={() => setKind('in')}>A receber</button>
      </div>
      <Field label={kind === 'in' ? 'De onde vem' : 'O que é'}>
        <input className="field" autoFocus={!bill} required maxLength={60} placeholder={kind === 'in' ? 'Salário, aluguel recebido…' : 'Internet, aluguel, IPVA…'} value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Valor · R$">
        <input className="field num" required inputMode="decimal" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </Field>
      <div className="segmented wide" role="group" aria-label="Frequência">
        <button type="button" aria-pressed={recurrence === 'monthly'} onClick={() => setRecurrence('monthly')}>Todo mês</button>
        <button type="button" aria-pressed={recurrence === 'once'} onClick={() => setRecurrence('once')}>Uma vez</button>
      </div>
      {recurrence === 'monthly' ? (
        <DayInput label={kind === 'in' ? 'Cai todo dia' : 'Vence todo dia'} value={day} onChange={setDay} required />
      ) : (
        <Field label={kind === 'in' ? 'Data prevista' : 'Data de vencimento'}>
          <input className="field" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      )}
      {dayPassed && (
        <label className="check">
          <input type="checkbox" checked={settledNow} onChange={(e) => setSettledNow(e.target.checked)} />
          Este mês já foi {verb} (começa a contar no próximo)
        </label>
      )}
      <details className="more">
        <summary>
          {options.find((c) => c.id === category)?.name ?? 'Sem categoria'} · {accounts.find((a) => a.id === accountId)?.name ?? 'sem conta'}
        </summary>
        <div className="stack">
          <Field label="Categoria">
            <select className="field" value={category} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Sem categoria</option>
              {options.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label={kind === 'in' ? 'Entra em' : 'Paga com'}>
            <select className="field" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {payers.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </Field>
        </div>
      </details>
      <Submit>{bill ? 'Salvar alterações' : 'Salvar'}</Submit>
      {bill && (
        <button
          type="button"
          className="pill danger-text"
          onClick={() => {
            if (confirm(`Excluir "${bill.name}"? Os lançamentos já feitos continuam.`)) void remove('bills', bill.id).then(onDone);
          }}
        >
          <Icon name="trash" size={14} />Excluir
        </button>
      )}
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

export function TransactionForm({ tx, onDone }: { tx: Transaction; onDone: () => void }) {
  const { update, remove, removeMany, categories, accounts, transactions } = useStore();
  const [kind, setKind] = useState<Kind>(tx.kind);
  const [description, setDescription] = useState(tx.description);
  const [amount, setAmount] = useState(tx.amount.toFixed(2).replace('.', ','));
  const [date, setDate] = useState(tx.occurred_on);
  const [categoryId, setCategoryId] = useState(tx.category_id ?? '');
  const [accountId, setAccountId] = useState(tx.account_id ?? '');
  const siblings = tx.installment_group ? transactions.filter((t) => t.installment_group === tx.installment_group) : [];
  const future = siblings.filter((t) => t.occurred_on >= tx.occurred_on);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const value = money(amount);
    if (!description.trim() || !(value > 0)) return;
    const ok = await update('transactions', tx.id, {
      description: description.trim(),
      amount: value,
      kind,
      occurred_on: date,
      category_id: categoryId || null,
      account_id: accountId || null,
    });
    if (ok) onDone();
  }

  return (
    <form className="stack" onSubmit={submit}>
      <div className="segmented wide" role="group" aria-label="Tipo">
        <button type="button" aria-pressed={kind === 'out'} onClick={() => setKind('out')}>Saída</button>
        <button type="button" aria-pressed={kind === 'in'} onClick={() => setKind('in')}>Entrada</button>
      </div>
      <Field label="Descrição">
        <input className="field" required maxLength={140} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <div className="row">
        <Field label="Valor · R$">
          <input className="field num" required inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Data">
          <input className="field" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>
      <div className="row">
        <Field label="Categoria">
          <select className="field" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Sem categoria</option>
            {categories.filter((c) => c.kind === kind).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Conta">
          <select className="field" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="">Sem conta</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </Field>
      </div>
      {tx.installments ? (
        <span className="muted" style={{ fontSize: 12 }}>
          Parcela {tx.installment_no} de {tx.installments}. Alterar aqui muda só esta parcela.
        </span>
      ) : null}
      <Submit>Salvar alterações</Submit>
      <div className="chips">
        <button
          type="button"
          className="pill danger-text"
          onClick={() => {
            if (confirm(`Excluir "${tx.description}"?`)) void remove('transactions', tx.id).then(onDone);
          }}
        >
          <Icon name="trash" size={14} />
          {tx.installments ? 'Excluir esta parcela' : 'Excluir'}
        </button>
        {future.length > 1 && (
          <button
            type="button"
            className="pill danger-text"
            onClick={() => {
              if (confirm(`Excluir esta e as próximas ${future.length - 1} parcelas?`)) void removeMany('transactions', future.map((t) => t.id)).then(onDone);
            }}
          >
            Excluir esta e as próximas ({future.length})
          </button>
        )}
      </div>
    </form>
  );
}
