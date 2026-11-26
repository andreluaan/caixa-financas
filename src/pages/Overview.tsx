import { useStore } from '../lib/store';
import { billStatus, budgetUsage, invoiceTotal, monthTotals, spendingByMonth } from '../lib/calc';
import { brl, currentMonth, longMonth, shortDate, shortMonth } from '../lib/format';
import { QuickAdd } from '../components/QuickAdd';
import { TransactionList } from '../components/TransactionList';
import { Money, Panel, Progress } from '../components/ui';
import type { Route } from '../App';

export function Overview({ go }: { go: (r: Route) => void }) {
  const { transactions, budgets, categories, bills, accounts } = useStore();
  const month = currentMonth();
  const totals = monthTotals(transactions, month);
  const savedPct = totals.income ? Math.round((totals.balance / totals.income) * 100) : 0;
  const history = spendingByMonth(transactions);
  const max = Math.max(1, ...history.map((h) => h.total));
  const attention = budgetUsage(budgets, categories, transactions, month).filter((u) => u.pct >= 80).slice(0, 3);
  const upcoming = bills
    .filter((b) => b.active)
    .map((b) => ({ bill: b, status: billStatus(b) }))
    .filter((x) => !x.status.paid)
    .sort((a, b) => a.status.daysLeft - b.status.daysLeft)
    .slice(0, 3);
  const card = accounts.find((a) => a.kind === 'credit');
  const invoice = card ? invoiceTotal(card, transactions) : null;
  const recent = transactions.slice(0, 6);

  return (
    <div className="columns">
      <div className="main">
        <section className="glass panel" style={{ gap: 18 }}>
          <div className="panel-head">
            <span className="glass-2 mono" style={{ padding: '7px 12px', borderRadius: 999, color: 'var(--ink-2)' }}>
              {shortMonth(month)} · {month.slice(0, 4)}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h1 className="hero-title">
              Para onde vai{' '}
              <br />
              seu dinheiro hoje<span className="dot">.</span>
            </h1>
            <div className="cut" />
          </div>
          <QuickAdd />
          <div className="kpis">
            <div className="glass-2 kpi">
              <span className="mono">Saldo do mês</span>
              <span className="value num"><Money value={totals.balance} /></span>
              <span className="muted" style={{ fontSize: 12 }}>
                {totals.income === 0 ? 'Nenhuma entrada ainda' : totals.balance >= 0 ? `Você guardou ${savedPct}% do que entrou` : 'Gastou mais do que entrou'}
              </span>
            </div>
            <div className="glass-2 kpi">
              <span className="mono">Entradas</span>
              <span className="value num"><Money value={totals.income} /></span>
              <span className="muted" style={{ fontSize: 12 }}>{totals.inCount} lançamento{totals.inCount === 1 ? '' : 's'}</span>
            </div>
            <div className="glass-2 kpi">
              <span className="mono">Saídas</span>
              <span className="value num"><Money value={totals.expense} /></span>
              <span className="muted" style={{ fontSize: 12 }}>{totals.outCount} lançamento{totals.outCount === 1 ? '' : 's'}</span>
            </div>
          </div>
        </section>

        <Panel title="Últimos lançamentos" action={<button type="button" className="pill" onClick={() => go('transactions')}>Ver todos</button>}>
          <TransactionList items={recent} empty="Nada lançado ainda. Comece pelo campo acima ou importe um extrato." />
        </Panel>

        {attention.length > 0 && (
          <Panel title="Perto do limite" action={<button type="button" className="pill" onClick={() => go('budgets')}>Orçamentos</button>}>
            {attention.map((u) => (
              <div key={u.budget.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, fontSize: 13 }}>
                  <span>{u.name}</span>
                  <span className="muted num">
                    {brl(u.used)} de {brl(u.budget.monthly_limit)}
                  </span>
                </div>
                <Progress value={u.pct} over={u.over} label={`Orçamento de ${u.name}`} />
              </div>
            ))}
          </Panel>
        )}
      </div>

      <aside className="rail">
        <Panel title="Gasto mensal" action={<span className="mono">6 meses</span>}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="num" style={{ fontSize: 34, fontWeight: 300, letterSpacing: '-0.03em' }}><Money value={totals.expense} /></span>
            <span className="muted" style={{ fontSize: 12 }}>em {longMonth(month)}</span>
          </div>
          <div className="bars" role="img" aria-label={`Gasto mensal: ${history.map((h) => `${shortMonth(h.month)} ${brl(h.total)}`).join(', ')}`}>
            {history.map((h, i) => (
              <div key={h.month} className="col">
                <div className={`bar ${i === history.length - 1 ? 'now' : ''}`} style={{ height: `${(h.total / max) * 88}px`, ['--i' as string]: i }} />
                <span className="mono" style={{ fontSize: 10 }}>{shortMonth(h.month)}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Próximas contas" action={<button type="button" className="pill" onClick={() => go('accounts')}>Ver todas</button>}>
          {upcoming.length === 0 ? (
            <p className="empty">Nada pendente este mês.</p>
          ) : (
            <ul className="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {upcoming.map(({ bill, status }) => (
                <li key={bill.id} className="list-row" style={{ padding: '9px 0' }}>
                  <div className="glass-2 date-badge">
                    <span className="num" style={{ fontSize: 14, fontWeight: 600, lineHeight: 1 }}>{status.next.slice(8, 10)}</span>
                    <span className="mono" style={{ fontSize: 9 }}>{shortMonth(status.next.slice(0, 7))}</span>
                  </div>
                  <div className="body">
                    <span className="title" style={{ fontSize: 13 }}>{bill.name}</span>
                    {status.overdue && <span className="mono" style={{ color: 'var(--shu)' }}>Atrasada</span>}
                  </div>
                  <span className="num" style={{ fontSize: 13 }}>{brl(bill.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {card && invoice && (
          <Panel title="Cartão principal">
            <div className="credit-card">
              <span className="mono" style={{ color: 'var(--ink-2)' }}>{card.name}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span className="muted" style={{ fontSize: 12 }}>Fatura atual · vence {shortDate(invoice.due)}</span>
                <span className="num" style={{ fontSize: 24 }}><Money value={invoice.total} /></span>
              </div>
            </div>
            {card.credit_limit ? (
              <>
                <Progress value={(invoice.total / card.credit_limit) * 100} label="Uso do limite" />
                <span className="muted" style={{ fontSize: 12 }}>
                  {Math.round((invoice.total / card.credit_limit) * 100)}% do limite de {brl(card.credit_limit)}
                </span>
              </>
            ) : null}
          </Panel>
        )}
      </aside>
    </div>
  );
}
