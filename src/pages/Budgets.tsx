import { useRef, useState } from 'react';
import { useStore } from '../lib/store';
import { budgetUsage } from '../lib/calc';
import { brl, currentMonth, longMonth } from '../lib/format';
import { AddButton, Panel, Progress, Sheet } from '../components/ui';
import { BudgetForm } from '../components/forms';
import type { Budget } from '../lib/types';

export function Budgets() {
  const { budgets, categories, transactions } = useStore();
  const month = currentMonth();
  const usage = budgetUsage(budgets, categories, transactions, month);
  const [editing, setEditing] = useState<Budget | 'new' | null>(null);
  const close = () => setEditing(null);
  const shown = useRef(editing);
  if (editing) shown.current = editing;
  const target = shown.current;
  const totalLimit = budgets.reduce((s, b) => s + b.monthly_limit, 0);
  const totalUsed = usage.reduce((s, u) => s + u.used, 0);

  return (
    <>
      <Panel
        title={`Orçamentos de ${longMonth(month)}`}
        action={<AddButton label="Novo limite" onClick={() => setEditing('new')} />}
      >
        {usage.length === 0 ? (
          <p className="empty">Defina quanto quer gastar por categoria no mês.</p>
        ) : (
          <>
            <span className="muted num" style={{ fontSize: 13 }}>
              {brl(totalUsed)} de {brl(totalLimit)} no total
            </span>
            <div className="grid-cards">
              {usage.map((u) => (
                <button key={u.budget.id} type="button" className="glass-2 card tap-card" onClick={() => setEditing(u.budget)} aria-label={`Editar limite de ${u.name}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 14 }}>{u.name}</span>
                    <span className="mono" style={{ color: u.over ? 'var(--shu)' : undefined }}>
                      {Math.round(u.pct)}%{u.over ? ' · passou' : ''}
                    </span>
                  </div>
                  <Progress value={u.pct} over={u.over} label={`Orçamento de ${u.name}`} />
                  <span className="muted num" style={{ fontSize: 12 }}>
                    {brl(u.used)} de {brl(u.budget.monthly_limit)}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </Panel>

      <Sheet
        open={editing !== null}
        onClose={close}
        title={target && target !== 'new' ? `Limite de ${categories.find((c) => c.id === target.category_id)?.name ?? ''}` : 'Novo limite'}
      >
        <BudgetForm budget={target && target !== 'new' ? target : undefined} onDone={close} />
      </Sheet>
    </>
  );
}
