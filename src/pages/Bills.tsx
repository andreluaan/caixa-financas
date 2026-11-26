import { useRef, useState } from 'react';
import { useStore } from '../lib/store';
import { billStatus, pendingThisMonth } from '../lib/calc';
import { brl, shortDate, shortMonth, today } from '../lib/format';
import { AddButton, Icon, Panel, Sheet } from '../components/ui';
import { BillForm } from '../components/forms';
import type { Bill, Kind } from '../lib/types';

function statusText(bill: Bill) {
  const st = billStatus(bill);
  const when = bill.recurrence === 'monthly' ? `Todo dia ${bill.due_day}` : `Uma vez · ${shortDate(st.next)} ${st.next.slice(0, 4)}`;
  const done = bill.kind === 'in' ? 'recebido' : 'paga';
  if (st.paid) return { when, state: bill.recurrence === 'monthly' ? `${done} este mês` : done, tone: '' };
  if (st.overdue) return { when, state: bill.kind === 'in' ? 'atrasado' : 'atrasada', tone: 'var(--shu)' };
  if (st.daysLeft === 0) return { when, state: 'hoje', tone: 'var(--ink)' };
  return { when, state: `em ${st.daysLeft} dia${st.daysLeft === 1 ? '' : 's'}`, tone: '' };
}

function BillRow({ bill, onEdit }: { bill: Bill; onEdit: () => void }) {
  const { insert, update } = useStore();
  const st = billStatus(bill);
  const text = statusText(bill);

  async function settle() {
    const ok = await insert('transactions', {
      description: bill.name,
      amount: bill.amount,
      kind: bill.kind,
      category_id: bill.category_id,
      account_id: bill.account_id,
      occurred_on: today(),
    });
    if (ok) await update('bills', bill.id, { last_paid_month: `${today().slice(0, 7)}-01` });
  }

  return (
    <li className="list-row bill-row">
      <div className="glass-2 date-badge" style={{ opacity: st.paid ? 0.5 : 1 }}>
        <span className="num" style={{ fontSize: 14, fontWeight: 600, lineHeight: 1 }}>{st.next.slice(8, 10)}</span>
        <span className="mono" style={{ fontSize: 9 }}>{shortMonth(st.next.slice(0, 7))}</span>
      </div>
      <button type="button" className="body row-button" onClick={onEdit} aria-label={`Editar ${bill.name}`}>
        <span className="title">{bill.name}</span>
        <span className="sub">
          {text.when} · <span style={{ color: text.tone || undefined }}>{text.state}</span>
        </span>
      </button>
      <span className={`amount ${bill.kind}`}>
        {bill.kind === 'in' ? '+ ' : ''}
        {brl(bill.amount)}
      </span>
      <div className="bill-actions">
        {!st.paid && (
          <button type="button" className="pill" onClick={() => void settle()} title="Lança no extrato e marca como feito">
            <Icon name="check" size={14} />
            {bill.kind === 'in' ? 'Recebi' : 'Paguei'}
          </button>
        )}
      </div>
    </li>
  );
}

export function Bills() {
  const { bills } = useStore();
  const [tab, setTab] = useState<Kind>('out');
  const [editing, setEditing] = useState<Bill | 'new' | null>(null);
  const shown = useRef(editing);
  if (editing) shown.current = editing;
  const target = shown.current;
  const close = () => setEditing(null);
  const pending = pendingThisMonth(bills);

  const list = bills
    .filter((b) => b.active && b.kind === tab)
    .map((b) => ({ b, st: billStatus(b) }))
    .filter(({ b, st }) => !(b.recurrence === 'once' && st.paid && st.next < today().slice(0, 7)))
    .sort((x, y) => Number(x.st.paid) - Number(y.st.paid) || x.st.next.localeCompare(y.st.next));

  return (
    <>
      <Panel title="Contas" action={<AddButton label="Nova" onClick={() => setEditing('new')} />}>
        <div className="segmented wide" role="group" aria-label="Mostrar">
          <button type="button" aria-pressed={tab === 'out'} onClick={() => setTab('out')}>
            A pagar · {brl(pending.toPay)}
          </button>
          <button type="button" aria-pressed={tab === 'in'} onClick={() => setTab('in')}>
            A receber · {brl(pending.toReceive)}
          </button>
        </div>
        <span className="muted" style={{ fontSize: 12 }}>Valores que ainda faltam neste mês. Toque numa conta para editar ou excluir.</span>
        {list.length === 0 ? (
          <p className="empty">
            {tab === 'out' ? 'Nenhuma conta a pagar. Cadastre aluguel, internet, IPVA…' : 'Nada a receber. Cadastre salário, freelas, aluguéis…'}
          </p>
        ) : (
          <ul className="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {list.map(({ b }) => (
              <BillRow key={b.id} bill={b} onEdit={() => setEditing(b)} />
            ))}
          </ul>
        )}
      </Panel>

      <Sheet open={editing !== null} onClose={close} title={target && target !== 'new' ? 'Editar' : tab === 'in' ? 'Novo recebimento' : 'Nova conta'}>
        <BillForm bill={target && target !== 'new' ? target : undefined} initialKind={tab} onDone={close} />
      </Sheet>
    </>
  );
}
