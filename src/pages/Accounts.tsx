import { useState, type FormEvent } from 'react';
import { useStore } from '../lib/store';
import { accountBalance, billStatus, invoiceTotal } from '../lib/calc';
import { brl, parseMoney, shortDate, shortMonth, today } from '../lib/format';
import { Field, Icon, Money, Panel, Progress } from '../components/ui';
import type { AccountKind, Bill } from '../lib/types';

const kindLabel: Record<AccountKind, string> = {
  checking: 'Conta corrente',
  savings: 'Poupança',
  cash: 'Dinheiro',
  credit: 'Cartão de crédito',
};

function NewAccount() {
  const { insert } = useStore();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<AccountKind>('checking');
  const [limit, setLimit] = useState('');
  const [opening, setOpening] = useState('');
  const [closing, setClosing] = useState('');
  const [due, setDue] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const credit = kind === 'credit';
    const ok = await insert('accounts', {
      name: name.trim(),
      kind,
      opening_balance: !credit && opening ? parseMoney(opening) || 0 : 0,
      credit_limit: credit && limit ? parseMoney(limit) : null,
      closing_day: credit && closing ? Number(closing) : null,
      due_day: credit && due ? Number(due) : null,
    });
    if (ok) {
      setName('');
      setLimit('');
      setOpening('');
      setClosing('');
      setDue('');
    }
  }

  return (
    <Panel title="Nova conta ou cartão">
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="Nome">
          <input className="field" maxLength={60} placeholder="Nubank, Itaú, Carteira…" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Tipo">
          <select className="field" value={kind} onChange={(e) => setKind(e.target.value as AccountKind)}>
            {Object.entries(kindLabel).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>
        {kind !== 'credit' && (
          <Field label="Saldo atual · R$">
            <input className="field num" inputMode="decimal" placeholder="0,00" value={opening} onChange={(e) => setOpening(e.target.value)} />
          </Field>
        )}
        {kind === 'credit' && (
          <div className="row">
            <Field label="Limite · R$">
              <input className="field num" inputMode="decimal" value={limit} onChange={(e) => setLimit(e.target.value)} />
            </Field>
            <Field label="Fecha dia">
              <input className="field num" type="number" min={1} max={31} required value={closing} onChange={(e) => setClosing(e.target.value)} />
            </Field>
            <Field label="Vence dia">
              <input className="field num" type="number" min={1} max={31} required value={due} onChange={(e) => setDue(e.target.value)} />
            </Field>
          </div>
        )}
        <button className="btn-primary" type="submit"><Icon name="plus" size={14} />Adicionar</button>
      </form>
    </Panel>
  );
}

function BillRow({ bill }: { bill: Bill }) {
  const { insert, update, remove } = useStore();
  const status = billStatus(bill);

  async function pay() {
    const ok = await insert('transactions', {
      description: bill.name,
      amount: bill.amount,
      kind: 'out',
      category_id: bill.category_id,
      account_id: bill.account_id,
      occurred_on: today(),
    });
    if (ok) await update('bills', bill.id, { last_paid_month: `${today().slice(0, 7)}-01` });
  }

  return (
    <li className="list-row bill-row">
      <div className="glass-2 date-badge">
        <span className="num" style={{ fontSize: 14, fontWeight: 600, lineHeight: 1 }}>{status.next.slice(8, 10)}</span>
        <span className="mono" style={{ fontSize: 9 }}>{shortMonth(status.next.slice(0, 7))}</span>
      </div>
      <div className="body">
        <span className="title">{bill.name}</span>
        <span className="sub">
          Todo dia {bill.due_day} ·{' '}
          {status.paid ? 'paga este mês' : status.overdue ? <span style={{ color: 'var(--shu)' }}>atrasada</span> : `vence em ${status.daysLeft} dia${status.daysLeft === 1 ? '' : 's'}`}
        </span>
      </div>
      <span className="amount out">{brl(bill.amount)}</span>
      <div className="bill-actions">
        {!status.paid && (
          <button type="button" className="pill" onClick={() => void pay()} title="Registra a saída e marca como paga">
            <Icon name="check" size={14} />Paguei
          </button>
        )}
        <button
          type="button"
          className="icon-btn danger"
          aria-label={`Excluir conta ${bill.name}`}
          onClick={() => {
            if (confirm(`Excluir a conta "${bill.name}"?`)) void remove('bills', bill.id);
          }}
        >
          <Icon name="trash" size={15} />
        </button>
      </div>
    </li>
  );
}

function NewBill() {
  const { insert, categories, accounts } = useStore();
  const out = categories.filter((c) => c.kind === 'out');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    const value = parseMoney(amount);
    if (!name.trim() || !(value > 0) || !dueDay) return;
    const ok = await insert('bills', {
      name: name.trim(),
      amount: value,
      due_day: Number(dueDay),
      category_id: categoryId || null,
      account_id: accountId || accounts[0]?.id || null,
    });
    if (ok) {
      setName('');
      setAmount('');
      setDueDay('');
    }
  }

  return (
    <form onSubmit={submit} className="glass-2" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="row">
        <Field label="Conta a pagar" className="grow">
          <input className="field" maxLength={60} placeholder="Internet, energia, aluguel…" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Valor · R$">
          <input className="field num" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Dia do vencimento">
          <input className="field num" type="number" min={1} max={31} value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
        </Field>
      </div>
      <div className="row">
        <Field label="Categoria">
          <select className="field" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Sem categoria</option>
            {out.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Paga com">
          <select className="field" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </Field>
        <button className="btn-primary shrink" type="submit"><Icon name="plus" size={14} />Adicionar</button>
      </div>
    </form>
  );
}

export function Accounts() {
  const { accounts, transactions, bills, remove } = useStore();
  const cards = accounts.filter((a) => a.kind === 'credit');
  const banks = accounts.filter((a) => a.kind !== 'credit');

  return (
    <div className="columns">
      <div className="main">
        <Panel title="Contas a pagar" action={<span className="mono">mensais</span>}>
          <NewBill />
          {bills.length === 0 ? (
            <p className="empty">Cadastre as contas fixas do mês para receber o lembrete aqui e na visão geral.</p>
          ) : (
            <ul className="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {bills.map((b) => (
                <BillRow key={b.id} bill={b} />
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Cartões">
          {cards.length === 0 && <p className="empty">Nenhum cartão cadastrado.</p>}
          <div className="grid-cards">
            {cards.map((card) => {
              const invoice = invoiceTotal(card, transactions);
              const pct = card.credit_limit ? (invoice.total / card.credit_limit) * 100 : 0;
              return (
                <div key={card.id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="credit-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="mono" style={{ color: 'var(--ink-2)' }}>{card.name}</span>
                      <button
                        type="button"
                        className="icon-btn danger"
                        aria-label={`Excluir cartão ${card.name}`}
                        onClick={() => {
                          if (confirm(`Excluir o cartão "${card.name}"? As transações ficam, sem conta.`)) void remove('accounts', card.id);
                        }}
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span className="muted" style={{ fontSize: 12 }}>
                        Fatura {shortDate(invoice.start)} a {shortDate(invoice.end)} · vence {shortDate(invoice.due)}
                      </span>
                      <span className="num" style={{ fontSize: 24 }}><Money value={invoice.total} /></span>
                    </div>
                  </div>
                  {card.credit_limit ? (
                    <>
                      <Progress value={pct} over={pct > 100} label={`Uso do limite de ${card.name}`} />
                      <span className="muted" style={{ fontSize: 12 }}>{Math.round(pct)}% do limite de {brl(card.credit_limit)}</span>
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <aside className="rail">
        <Panel title="Contas">
          <ul className="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {banks.map((a) => (
              <li key={a.id} className="list-row">
                <div className="body">
                  <span className="title">{a.name}</span>
                  <span className="sub">{kindLabel[a.kind]}</span>
                </div>
                <span className="amount in"><Money value={accountBalance(a, transactions)} /></span>
                <button
                  type="button"
                  className="icon-btn danger"
                  aria-label={`Excluir conta ${a.name}`}
                  onClick={() => {
                    if (confirm(`Excluir "${a.name}"? As transações ficam, sem conta.`)) void remove('accounts', a.id);
                  }}
                >
                  <Icon name="trash" size={15} />
                </button>
              </li>
            ))}
          </ul>
          <span className="muted" style={{ fontSize: 12 }}>Saldo = saldo informado ao criar a conta + tudo o que foi lançado nela.</span>
        </Panel>
        <NewAccount />
      </aside>
    </div>
  );
}
