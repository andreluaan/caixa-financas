import { useState } from 'react';
import { brl, currentMonth, longMonth, shortMonth } from '../lib/format';

const compact = (value: number) =>
  value >= 1000 ? `${(value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil` : Math.round(value).toLocaleString('pt-BR');

function niceMax(value: number) {
  if (value <= 0) return 100;
  const step = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / step / 2) * step * 2;
}

type Flow = { month: string; income: number; expense: number };

/** Paired monthly bars: money in (ai) vs money out (shu), one shared axis. */
export function FlowChart({ data }: { data: Flow[] }) {
  const [active, setActive] = useState<string | null>(null);
  const top = niceMax(Math.max(...data.flatMap((d) => [d.income, d.expense])));
  const ticks = [top, top / 2, 0];
  const now = currentMonth();
  const focus = data.find((d) => d.month === active);

  return (
    <figure className="flow" aria-label="Entradas e saídas por mês">
      <div className="legend" aria-hidden="true">
        <span><i style={{ background: 'var(--c-in)' }} />Entradas</span>
        <span><i style={{ background: 'var(--c-out)' }} />Saídas</span>
      </div>
      <div className="plot" onMouseLeave={() => setActive(null)}>
        <div className="grid" aria-hidden="true">
          {ticks.map((t) => (
            <span key={t}><em>{compact(t)}</em></span>
          ))}
        </div>
        <div className="cols">
          {data.map((d, i) => (
            <button
              key={d.month}
              type="button"
              className={`col ${d.month === now ? 'now' : ''} ${active === d.month ? 'on' : ''}`}
              style={{ ['--i' as string]: i }}
              onMouseEnter={() => setActive(d.month)}
              onFocus={() => setActive(d.month)}
              onBlur={() => setActive(null)}
              aria-label={`${longMonth(d.month)}: entrou ${brl(d.income)}, saiu ${brl(d.expense)}`}
            >
              <span className="pair">
                <span className="bar in" style={{ height: `${(d.income / top) * 100}%` }} />
                <span className="bar out" style={{ height: `${(d.expense / top) * 100}%` }} />
              </span>
              <span className="mono tick">{shortMonth(d.month)}</span>
            </button>
          ))}
        </div>
        {focus && (
          <div
            className="tip glass-2"
            role="status"
            style={(() => {
              const frac = (data.indexOf(focus) + 0.5) / data.length;
              return { left: `calc(44px + (100% - 44px) * ${frac})`, transform: `translateX(${frac > 0.66 ? -88 : frac < 0.34 ? -12 : -50}%)` };
            })()}
          >
            <strong>{longMonth(focus.month)}</strong>
            <span><i style={{ background: 'var(--c-in)' }} />Entrou <b className="num">{brl(focus.income)}</b></span>
            <span><i style={{ background: 'var(--c-out)' }} />Saiu <b className="num">{brl(focus.expense)}</b></span>
            <span className="muted">Saldo <b className="num">{brl(focus.income - focus.expense)}</b></span>
          </div>
        )}
      </div>
      <table className="sr-only">
        <caption>Entradas e saídas por mês</caption>
        <thead>
          <tr><th>Mês</th><th>Entradas</th><th>Saídas</th></tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.month}><td>{longMonth(d.month)}</td><td>{brl(d.income)}</td><td>{brl(d.expense)}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Ranked horizontal bars for one month of spending, values labeled directly. */
export function CategoryBars({ rows }: { rows: { id: string; name: string; total: number }[] }) {
  const sum = rows.reduce((s, r) => s + r.total, 0);
  const max = Math.max(1, ...rows.map((r) => r.total));
  if (rows.length === 0) return <p className="empty">Nenhuma saída neste mês.</p>;
  return (
    <ul className="cat-bars">
      {rows.map((r, i) => (
        <li key={r.id} style={{ ['--i' as string]: i }}>
          <div className="cat-head">
            <span>{r.name}</span>
            <span className="num">
              {brl(r.total)} <em className="muted">{Math.round((r.total / sum) * 100)}%</em>
            </span>
          </div>
          <div className="cat-track">
            <span style={{ width: `${(r.total / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
