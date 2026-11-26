import { useState } from 'react';
import { useStore } from '../lib/store';
import { accountBalance, installmentPlans, invoiceTotal } from '../lib/calc';
import { brl, shortDate } from '../lib/format';
import { AddButton, Icon, Money, Panel, Progress, Sheet } from '../components/ui';
import { kindLabel, NewAccountForm } from '../components/forms';
import type { AccountKind } from '../lib/types';

export function Accounts() {
  const { accounts, transactions, remove, removeMany } = useStore();
  const plans = installmentPlans(transactions);
  const cards = accounts.filter((a) => a.kind === 'credit');
  const banks = accounts.filter((a) => a.kind !== 'credit');
  const [sheet, setSheet] = useState<null | 'account'>(null);
  const [kind, setKind] = useState<AccountKind>('checking');
  const close = () => setSheet(null);
  const newAccount = (k: AccountKind) => {
    setKind(k);
    setSheet('account');
  };

  return (
    <div className="columns">
      <div className="main">
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
        <Panel title="Compras parceladas">
          {plans.length === 0 ? (
            <p className="empty">Nenhuma parcela em aberto. Ao lançar uma saída, escolha "Parcelado".</p>
          ) : (
            <ul className="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {plans.map((p) => (
                <li key={p.group} className="list-row">
                  <div className="body">
                    <span className="title">{p.name}</span>
                    <span className="sub">
                      {p.installments - p.remaining}/{p.installments} pagas · {p.remaining}× {brl(p.each)} · próxima {p.next ? shortDate(p.next) : '—'}
                      {p.accountId ? ` · ${accounts.find((a) => a.id === p.accountId)?.name ?? ''}` : ''}
                    </span>
                  </div>
                  <span className="amount out">{brl(p.remainingAmount)}</span>
                  <button
                    type="button"
                    className="icon-btn danger"
                    aria-label={`Cancelar parcelas restantes de ${p.name}`}
                    onClick={() => {
                      if (confirm(`Apagar as ${p.remaining} parcelas futuras de "${p.name}"? As já pagas ficam.`))
                        void removeMany('transactions', p.futureIds);
                    }}
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
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

      <Sheet open={sheet === 'account'} onClose={close} title="Nova conta ou cartão">
        <NewAccountForm initialKind={kind} onDone={close} />
      </Sheet>
    </div>
  );
}
