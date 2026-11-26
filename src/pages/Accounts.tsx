import { useState } from 'react';
import { useStore } from '../lib/store';
import { accountBalance, billStatus, invoiceTotal } from '../lib/calc';
import { brl, shortDate, shortMonth, today } from '../lib/format';
import { AddButton, Icon, Money, Panel, Progress, Sheet } from '../components/ui';
import { kindLabel, NewAccountForm, NewBillForm } from '../components/forms';
import type { AccountKind, Bill } from '../lib/types';

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

export function Accounts() {
  const { accounts, transactions, bills, remove } = useStore();
  const cards = accounts.filter((a) => a.kind === 'credit');
  const banks = accounts.filter((a) => a.kind !== 'credit');
  const [sheet, setSheet] = useState<null | 'bill' | 'account'>(null);
  const [kind, setKind] = useState<AccountKind>('checking');
  const close = () => setSheet(null);
  const newAccount = (k: AccountKind) => {
    setKind(k);
    setSheet('account');
  };

  return (
    <div className="columns">
      <div className="main">
        <Panel title="Contas a pagar" action={<AddButton label="Nova" onClick={() => setSheet('bill')} />}>
          {bills.length === 0 ? (
            <p className="empty">Cadastre as contas fixas do mês para ser lembrado delas.</p>
          ) : (
            <ul className="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {bills.map((b) => (
                <BillRow key={b.id} bill={b} />
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Cartões" action={<AddButton label="Novo" onClick={() => newAccount('credit')} />}>
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
                      <span className="muted" style={{ fontSize: 12 }}>Fatura atual · vence {shortDate(invoice.due)}</span>
                      <span className="num" style={{ fontSize: 24 }}><Money value={invoice.total} /></span>
                    </div>
                  </div>
                  {card.credit_limit ? (
                    <>
                      <Progress value={pct} over={pct > 100} label={`Uso do limite de ${card.name}`} />
                      <span className="muted" style={{ fontSize: 12 }}>{Math.round(pct)}% de {brl(card.credit_limit)}</span>
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <aside className="rail">
        <Panel title="Contas" action={<AddButton label="Nova" onClick={() => newAccount('checking')} />}>
          {banks.length === 0 && <p className="empty">Nenhuma conta cadastrada.</p>}
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
        </Panel>
      </aside>

      <Sheet open={sheet === 'bill'} onClose={close} title="Nova conta a pagar">
        <NewBillForm onDone={close} />
      </Sheet>
      <Sheet open={sheet === 'account'} onClose={close} title="Nova conta ou cartão">
        <NewAccountForm initialKind={kind} onDone={close} />
      </Sheet>
    </div>
  );
}
