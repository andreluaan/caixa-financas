import { useState, type FormEvent } from 'react';
import { useStore } from '../lib/store';
import { brl, parseMoney, shortDate } from '../lib/format';
import { Field, Icon, Panel, Progress } from '../components/ui';
import type { Goal } from '../lib/types';

function GoalCard({ goal }: { goal: Goal }) {
  const { update, remove } = useStore();
  const [amount, setAmount] = useState('');
  const pct = (goal.saved / goal.target) * 100;
  const missing = Math.max(0, goal.target - goal.saved);

  async function move(sign: 1 | -1) {
    const value = parseMoney(amount);
    if (!(value > 0)) return;
    const saved = Math.max(0, Math.round((goal.saved + sign * value) * 100) / 100);
    if (await update('goals', goal.id, { saved })) setAmount('');
  }

  return (
    <div className="glass-2 card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 15 }}>{goal.name}</span>
        <button
          type="button"
          className="icon-btn danger"
          aria-label={`Excluir meta ${goal.name}`}
          onClick={() => {
            if (confirm(`Excluir a meta "${goal.name}"?`)) void remove('goals', goal.id);
          }}
        >
          <Icon name="trash" size={15} />
        </button>
      </div>
      <span className="num" style={{ fontSize: 24, fontWeight: 300 }}>{brl(goal.saved)}</span>
      <Progress value={pct} label={`Meta ${goal.name}`} />
      <span className="muted" style={{ fontSize: 12 }}>
        {Math.round(pct)}% de {brl(goal.target)}
        {missing > 0 ? ` · faltam ${brl(missing)}` : ' · concluída'}
        {goal.deadline ? ` · até ${shortDate(goal.deadline)} ${goal.deadline.slice(0, 4)}` : ''}
      </span>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input className="field num" inputMode="decimal" aria-label={`Valor para ${goal.name}`} placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <button type="button" className="pill" onClick={() => void move(1)}>Guardar</button>
        <button type="button" className="pill" onClick={() => void move(-1)}>Retirar</button>
      </div>
    </div>
  );
}

export function Goals() {
  const { goals, insert } = useStore();
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const total = goals.reduce((s, g) => s + g.saved, 0);

  async function add(e: FormEvent) {
    e.preventDefault();
    const value = parseMoney(target);
    if (!name.trim() || !(value > 0)) return;
    if (await insert('goals', { name: name.trim(), target: value, deadline: deadline || null })) {
      setName('');
      setTarget('');
      setDeadline('');
    }
  }

  return (
    <div className="columns">
      <div className="main">
        <Panel title="Metas" action={<span className="mono num">{brl(total)} guardados</span>}>
          {goals.length === 0 && <p className="empty">Crie sua primeira meta ao lado.</p>}
          <div className="grid-cards">
            {goals.map((g) => (
              <GoalCard key={g.id} goal={g} />
            ))}
          </div>
        </Panel>
      </div>
      <aside className="rail">
        <Panel title="Nova meta">
          <form onSubmit={add} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="Nome">
              <input className="field" maxLength={60} placeholder="Reserva de emergência" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Valor alvo · R$">
              <input className="field num" inputMode="decimal" placeholder="0,00" value={target} onChange={(e) => setTarget(e.target.value)} />
            </Field>
            <Field label="Prazo (opcional)">
              <input className="field" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </Field>
            <button className="btn-primary" type="submit"><Icon name="plus" size={14} />Criar meta</button>
          </form>
        </Panel>
      </aside>
    </div>
  );
}
