import { useState, type FormEvent } from 'react';
import { useStore } from '../lib/store';
import { budgetUsage } from '../lib/calc';
import { brl, currentMonth, longMonth, parseMoney } from '../lib/format';
import { Field, Icon, Panel, Progress } from '../components/ui';

export function Budgets() {
  const { budgets, categories, transactions, insert, update, remove } = useStore();
  const month = currentMonth();
  const usage = budgetUsage(budgets, categories, transactions, month);
  const free = categories.filter((c) => c.kind === 'out' && !budgets.some((b) => b.category_id === c.id));
  const [categoryId, setCategoryId] = useState('');
  const [limit, setLimit] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [keywords, setKeywords] = useState('');

  const totalLimit = budgets.reduce((s, b) => s + b.monthly_limit, 0);
  const totalUsed = usage.reduce((s, u) => s + u.used, 0);

  async function addBudget(e: FormEvent) {
    e.preventDefault();
    const value = parseMoney(limit);
    const cat = categoryId || free[0]?.id;
    if (!cat || !(value > 0)) return;
    if (await insert('budgets', { category_id: cat, monthly_limit: value })) {
      setLimit('');
      setCategoryId('');
    }
  }

  async function addCategory(e: FormEvent) {
    e.preventDefault();
    if (!newCategory.trim()) return;
    const words = keywords.split(',').map((w) => w.trim()).filter(Boolean);
    if (await insert('categories', { name: newCategory.trim(), kind: 'out', keywords: words })) {
      setNewCategory('');
      setKeywords('');
    }
  }

  return (
    <div className="columns">
      <div className="main">
        <Panel title={`Orçamentos de ${longMonth(month)}`} action={<span className="mono num">{brl(totalUsed)} de {brl(totalLimit)}</span>}>
          {usage.length === 0 && <p className="empty">Nenhum limite definido ainda.</p>}
          <div className="grid-cards">
            {usage.map((u) => (
              <div key={u.budget.id} className="glass-2 card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14 }}>{u.name}</span>
                  <button
                    type="button"
                    className="icon-btn danger"
                    aria-label={`Remover orçamento de ${u.name}`}
                    onClick={() => void remove('budgets', u.budget.id)}
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>
                <Progress value={u.pct} over={u.over} label={`Orçamento de ${u.name}`} />
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                  <span className="muted num" style={{ fontSize: 12 }}>{brl(u.used)} usados</span>
                  <span className="mono" style={{ color: u.over ? 'var(--shu)' : undefined }}>{Math.round(u.pct)}%</span>
                </div>
                <Field label="Limite mensal · R$">
                  <input
                    className="field num"
                    inputMode="decimal"
                    defaultValue={u.budget.monthly_limit.toFixed(2).replace('.', ',')}
                    onBlur={(e) => {
                      const value = parseMoney(e.target.value);
                      if (value > 0 && value !== u.budget.monthly_limit) void update('budgets', u.budget.id, { monthly_limit: value });
                    }}
                  />
                </Field>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <aside className="rail">
        <Panel title="Novo limite">
          {free.length === 0 ? (
            <p className="empty">Todas as categorias de saída já têm limite.</p>
          ) : (
            <form onSubmit={addBudget} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Field label="Categoria">
                <select className="field" value={categoryId || free[0]?.id} onChange={(e) => setCategoryId(e.target.value)}>
                  {free.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Limite mensal · R$">
                <input className="field num" inputMode="decimal" placeholder="0,00" value={limit} onChange={(e) => setLimit(e.target.value)} />
              </Field>
              <button className="btn-primary" type="submit"><Icon name="plus" size={14} />Adicionar</button>
            </form>
          )}
        </Panel>
        <Panel title="Nova categoria">
          <form onSubmit={addCategory} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="Nome">
              <input className="field" maxLength={40} value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
            </Field>
            <Field label="Palavras-chave (separadas por vírgula)">
              <input className="field" placeholder="pet shop, ração" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
            </Field>
            <span className="muted" style={{ fontSize: 12 }}>As palavras-chave servem para categorizar sozinho o que você lança ou importa.</span>
            <button className="pill" type="submit">Criar categoria</button>
          </form>
        </Panel>
      </aside>
    </div>
  );
}
