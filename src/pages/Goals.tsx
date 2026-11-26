import { useRef, useState } from 'react';
import { useStore } from '../lib/store';
import { brl, shortDate } from '../lib/format';
import { AddButton, Money, Panel, Progress, Sheet } from '../components/ui';
import { GoalForm, GoalMoveForm } from '../components/forms';

export function Goals() {
  const { goals } = useStore();
  const [open, setOpen] = useState<string | 'new' | null>(null);
  const close = () => setOpen(null);
  const found = goals.find((g) => g.id === open);
  const lastSelected = useRef(found);
  if (found) lastSelected.current = found;
  const selected = lastSelected.current;
  const total = goals.reduce((s, g) => s + g.saved, 0);

  return (
    <>
      <Panel title="Metas" action={<AddButton label="Nova meta" onClick={() => setOpen('new')} />}>
        {goals.length === 0 ? (
          <p className="empty">Crie uma meta e vá guardando aos poucos.</p>
        ) : (
          <>
            <span className="muted num" style={{ fontSize: 13 }}>{brl(total)} guardados no total</span>
            <div className="grid-cards">
              {goals.map((g) => {
                const pct = (g.saved / g.target) * 100;
                const missing = Math.max(0, g.target - g.saved);
                return (
                  <button key={g.id} type="button" className="glass-2 card tap-card" onClick={() => setOpen(g.id)} aria-label={`Guardar ou retirar em ${g.name}`}>
                    <span style={{ fontSize: 15 }}>{g.name}</span>
                    <span className="num" style={{ fontSize: 24, fontWeight: 300 }}><Money value={g.saved} /></span>
                    <Progress value={pct} label={`Meta ${g.name}`} />
                    <span className="muted" style={{ fontSize: 12 }}>
                      {missing > 0 ? `Faltam ${brl(missing)}` : 'Concluída'}
                      {g.deadline ? ` · até ${shortDate(g.deadline)} ${g.deadline.slice(0, 4)}` : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </Panel>

      <Sheet open={open === 'new'} onClose={close} title="Nova meta">
        <GoalForm onDone={close} />
      </Sheet>
      <Sheet open={!!found} onClose={close} title={selected?.name ?? ''}>
        {selected && <GoalMoveForm goal={selected} onDone={close} />}
      </Sheet>
    </>
  );
}
