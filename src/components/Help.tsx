import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../lib/store';
import { Icon, Sheet, type IconName } from './ui';
import type { Route } from '../App';

type Counts = { transactions: number; bills: number; accounts: number; budgets: number };

type Step = {
  /** CSS selectors; the first visible match is lit. No target = a centered message. */
  target?: string;
  route?: Route;
  title: string;
  text: string;
  /** next: a button moves on. tap: tapping the lit element moves on. saved: moves on once the count grows. */
  advance: 'next' | 'tap' | 'saved';
  saved?: keyof Counts;
  phoneOnly?: boolean;
  desktopOnly?: boolean;
};

type Mission = { id: string; icon: IconName; title: string; blurb: string; steps: Step[] };

const tab = (key: Route) => `.tabbar .tab[data-key="${key}"], .nav .nav-item[data-key="${key}"]`;

const missions: Mission[] = [
  {
    id: 'first-entry',
    icon: 'plus',
    title: 'Lance seu primeiro gasto',
    blurb: 'O básico do dia a dia, em poucos toques.',
    steps: [
      { route: 'overview', target: '.fab', phoneOnly: true, advance: 'tap', title: 'Comece pelo +', text: 'Toque no + sempre que gastar ou receber. Ele fica aqui, ao alcance do polegar.' },
      { route: 'overview', target: '[data-tour="qa-desc"]', desktopOnly: true, advance: 'next', title: 'Lançar fica no Início', text: 'Este campo serve para registrar qualquer gasto ou entrada.' },
      { target: '[data-tour="qa-desc"]', advance: 'next', title: 'O que foi?', text: 'Escreva algo como “Mercado” ou “Uber”. A categoria é escolhida sozinha pela descrição.' },
      { target: '[data-tour="qa-amount"]', advance: 'next', title: 'Quanto custou', text: 'Digite o valor. Pode usar vírgula: 52,90.' },
      { target: '[data-tour="qa-kind"]', advance: 'next', title: 'Saída ou entrada', text: 'Saída é gasto, Entrada é dinheiro que chegou. Comprou parcelado? Toque em Parcelado e diga quantas vezes.' },
      { target: '[data-tour="qa-submit"]', advance: 'saved', saved: 'transactions', title: 'Salve', text: 'Toque em Lançar. Se faltar algo, o Caixa avisa.' },
      { advance: 'next', title: 'Pronto!', text: 'Seu lançamento já entrou no Extrato e no saldo do Início.' },
    ],
  },
  {
    id: 'first-bill',
    icon: 'calendar',
    title: 'Cadastre sua primeira conta',
    blurb: 'Aluguel, internet, luz: o que vence todo mês.',
    steps: [
      { route: 'overview', target: tab('bills'), advance: 'tap', title: 'Abra Contas', text: 'Aqui ficam as contas a pagar e o que você tem a receber. Toque em Contas.' },
      { route: 'bills', target: '[data-tour="bill-new"]', advance: 'tap', title: 'Nova conta', text: 'Toque em Nova para cadastrar.' },
      { target: '[data-tour="bill-name"]', advance: 'next', title: 'O que é', text: 'Dê um nome fácil de reconhecer: “Aluguel”, “Internet”, “Luz”.' },
      { target: '[data-tour="bill-amount"]', advance: 'next', title: 'Valor', text: 'Quanto costuma vir. Dá para mudar depois se variar.' },
      { target: '[data-tour="bill-freq"]', advance: 'next', title: 'Todo mês ou uma vez', text: 'Todo mês para contas fixas. Uma vez para algo pontual, como IPVA ou uma consulta.' },
      { target: '[data-tour="bill-day"]', advance: 'next', title: 'Vencimento', text: 'O dia em que vence. O Início mostra as próximas contas para você não esquecer.' },
      { target: '[data-tour="bill-submit"]', advance: 'saved', saved: 'bills', title: 'Salve', text: 'Toque em Salvar.' },
      { advance: 'next', title: 'Conta cadastrada!', text: 'Quando pagar, toque em Paguei ao lado dela: o valor vai para o Extrato e ela some até o próximo mês.' },
    ],
  },
  {
    id: 'first-card',
    icon: 'card',
    title: 'Adicione seu cartão',
    blurb: 'Fatura, vencimento e limite sempre à vista.',
    steps: [
      { route: 'overview', target: tab('accounts'), advance: 'tap', title: 'Abra a Carteira', text: 'Cartões e contas do banco ficam aqui. Toque em Carteira.' },
      { route: 'accounts', target: '[data-tour="card-new"]', advance: 'tap', title: 'Novo cartão', text: 'Toque em Novo, ao lado de Cartões.' },
      { target: '[data-tour="acc-name"]', advance: 'next', title: 'Nome do cartão', text: 'Como você chama ele: “Nubank”, “Inter”…' },
      { target: '[data-tour="acc-days"]', advance: 'next', title: 'Fechamento e vencimento', text: 'Os dias que estão na fatura. Assim o Caixa sabe em qual fatura cai cada compra.' },
      { target: '[data-tour="acc-limit"]', advance: 'next', title: 'Limite', text: 'Opcional. Com ele, o Caixa mostra quanto do limite você já usou.' },
      { target: '[data-tour="acc-submit"]', advance: 'saved', saved: 'accounts', title: 'Salve', text: 'Toque em Adicionar cartão.' },
      { advance: 'next', title: 'Cartão pronto!', text: 'Ao lançar uma compra, escolha esse cartão nos detalhes. Compras parceladas caem nele sozinhas.' },
    ],
  },
  {
    id: 'first-budget',
    icon: 'pie',
    title: 'Defina um limite de gastos',
    blurb: 'Um teto por mês para uma categoria.',
    steps: [
      { route: 'overview', target: tab('budgets'), advance: 'tap', title: 'Abra Planos', text: 'Orçamentos e metas ficam aqui. Toque em Planos.' },
      { route: 'budgets', target: '[data-tour="budget-new"]', advance: 'tap', title: 'Novo limite', text: 'Toque em Novo limite.' },
      { target: '[data-tour="budget-cat"]', advance: 'next', title: 'Categoria', text: 'Escolha onde quer gastar menos, como Alimentação ou Lazer.' },
      { target: '[data-tour="budget-limit"]', advance: 'next', title: 'Quanto por mês', text: 'O máximo que você quer gastar nela no mês.' },
      { target: '[data-tour="budget-submit"]', advance: 'saved', saved: 'budgets', title: 'Salve', text: 'Toque em Criar limite.' },
      { advance: 'next', title: 'Limite criado!', text: 'Quando passar de 80%, o Início avisa em “Perto do limite”.' },
    ],
  },
  {
    id: 'home',
    icon: 'home',
    title: 'Entenda o Início',
    blurb: 'O que cada número quer dizer.',
    steps: [
      { route: 'overview', target: '[data-tour="kpi-have"]', advance: 'next', title: 'Tenho hoje', text: 'A soma das suas contas e do dinheiro em mãos. O cartão fica de fora, porque é dívida.' },
      { route: 'overview', target: '[data-tour="kpi-in"]', advance: 'next', title: 'Entrou e saiu', text: 'O total do mês atual. Entradas em azul, saídas em vermelho.' },
      { route: 'overview', target: '[data-tour="kpi-forecast"]', advance: 'next', title: 'Sobra prevista', text: 'O que você tem, mais o que vai receber, menos as contas que faltam pagar no mês.' },
      { route: 'overview', target: '.tour-chart', advance: 'next', title: 'Seis meses', text: 'Compare entradas e saídas mês a mês. Toque numa barra para ver o valor.' },
      { route: 'overview', target: '.tabbar, .nav', advance: 'next', title: 'As telas', text: 'Troque de tela por aqui. No celular, dá para segurar e arrastar o dedo.' },
      { route: 'overview', target: '[data-tour="help"]', advance: 'next', title: 'Sempre por perto', text: 'Para rever qualquer guia, toque no ? quando quiser.' },
    ],
  },
];

const DONE_KEY = 'caixa.missions';
const SEEN_KEY = 'caixa.guide';
const readDone = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(DONE_KEY) ?? '[]');
  } catch {
    return [];
  }
};

const isPhone = () => matchMedia('(max-width: 720px)').matches;
const visible = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
};
const findTarget = (selector?: string) => (selector ? ([...document.querySelectorAll(selector)].find(visible) ?? null) : null);
const topDialog = () => [...document.querySelectorAll<HTMLDialogElement>('dialog[open]')].at(-1) ?? null;
const supportsPopover = typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype;

type Box = { x: number; y: number; w: number; h: number };
const sameBox = (a: Box | null, b: Box | null) =>
  a === b || (!!a && !!b && Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5 && Math.abs(a.w - b.w) < 0.5 && Math.abs(a.h - b.h) < 0.5);

/** Lights one real element at a time and waits for the person to use it. */
function Tour({ mission, route, go, onExit }: { mission: Mission; route: Route; go: (r: Route) => void; onExit: (finished: boolean) => void }) {
  const store = useStore();
  const counts: Counts = {
    transactions: store.transactions.length,
    bills: store.bills.length,
    accounts: store.accounts.length,
    budgets: store.budgets.length,
  };
  const steps = useRef(mission.steps.filter((s) => !(s.phoneOnly && !isPhone()) && !(s.desktopOnly && isPhone()))).current;
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const [box, setBox] = useState<Box | null>(null);
  const [host, setHost] = useState<HTMLElement>(document.body);
  const baseline = useRef(counts);
  const layer = useRef<HTMLDivElement>(null);

  const next = useCallback(() => {
    if (index + 1 >= steps.length) onExit(true);
    else setIndex(index + 1);
  }, [index, steps.length, onExit]);

  useEffect(() => {
    baseline.current = counts;
    if (step.route && step.route !== route) go(step.route);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Follow the lit element (it moves with scroll, sheets and the keyboard) and the top-most open sheet.
  useEffect(() => {
    let frame = 0;
    let scrolled = false;
    let missingSince: number | null = null;
    const tick = () => {
      const el = findTarget(step.target);
      if (el) {
        missingSince = null;
        const r = el.getBoundingClientRect();
        if (!scrolled && (r.top < 70 || r.bottom > innerHeight - 120)) {
          el.scrollIntoView({ block: 'center', behavior: 'smooth' });
          scrolled = true;
        }
        const nextBox = { x: r.left, y: r.top, w: r.width, h: r.height };
        setBox((prev) => (sameBox(prev, nextBox) ? prev : nextBox));
      } else {
        setBox(null);
        if (step.target) {
          missingSince ??= performance.now();
          // The sheet was closed mid-way: go back to the step that opens it.
          if (performance.now() - missingSince > 1600) {
            missingSince = null;
            const back = steps.slice(0, index).findLastIndex((s) => s.advance === 'tap');
            if (back >= 0) setIndex(back);
          }
        }
      }
      const nextHost = topDialog() ?? document.body;
      setHost((prev) => (prev === nextHost ? prev : nextHost));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [step, steps, index]);

  // Steps that wait for a tap on the real element.
  useEffect(() => {
    if (step.advance !== 'tap') return;
    const onClick = (e: MouseEvent) => {
      const el = findTarget(step.target);
      if (el && e.target instanceof Node && el.contains(e.target)) setTimeout(next, 250);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [step, next]);

  // Tapping a tab may be taken over by the menu's drag lens, so the screen changing also counts as the tap.
  useEffect(() => {
    const upcoming = steps[index + 1];
    if (step.advance === 'tap' && upcoming?.route && upcoming.route === route && step.route !== route) next();
  }, [route, step, steps, index, next]);

  // Steps that wait for something to be saved.
  useEffect(() => {
    if (step.advance === 'saved' && step.saved && counts[step.saved] > baseline.current[step.saved]) next();
  });

  // The layer lives in the top layer, so it stays above any open sheet; re-shown whenever its host changes.
  useLayoutEffect(() => {
    const el = layer.current;
    if (!el || !supportsPopover) return;
    try {
      el.showPopover();
    } catch {
      /* already shown */
    }
  }, [host]);

  const pad = 8;
  const hole = box && { left: box.x - pad, top: box.y - pad, width: box.w + pad * 2, height: box.h + pad * 2 };
  const width = Math.min(340, innerWidth - 24);
  let bubble: CSSProperties = { width, left: (innerWidth - width) / 2, top: '50%', transform: 'translateY(-50%)' };
  let arrow: CSSProperties | null = null;
  let side: 'above' | 'below' | 'center' = 'center';
  if (hole) {
    const centerX = hole.left + hole.width / 2;
    const left = Math.min(Math.max(centerX - width / 2, 12), innerWidth - width - 12);
    const inSheet = host !== document.body;
    const roomBelow = innerHeight - (hole.top + hole.height);
    side = (inSheet && hole.top > 190) || roomBelow < 210 ? 'above' : 'below';
    bubble = side === 'below' ? { width, left, top: hole.top + hole.height + 14 } : { width, left, bottom: innerHeight - hole.top + 14 };
    arrow = { left: Math.min(Math.max(centerX - left, 22), width - 22) };
  }

  const lit = steps.filter((s) => s.target);
  const position = lit.indexOf(step);
  const last = index === steps.length - 1;

  return createPortal(
    <div ref={layer} className="tour" {...(supportsPopover ? { popover: 'manual' } : {})}>
      {hole ? <div className="tour-hole" style={hole} /> : <div className="tour-dim" />}
      <div key={index} className={`tour-bubble glass ${side}`} style={bubble} role="dialog" aria-live="polite" aria-label={step.title}>
        {arrow && <span className="tour-arrow" style={arrow} />}
        {step.target ? (
          <span className="mono tour-count">
            {position + 1} / {lit.length}
          </span>
        ) : (
          <div className="tour-done" aria-hidden="true">
            <Icon name={last ? 'check' : mission.icon} size={26} strokeWidth={2} />
          </div>
        )}
        <strong className="tour-title">{step.title}</strong>
        <p className="tour-text">{step.text}</p>
        <div className="tour-actions">
          {!last && (
            <button type="button" className="tour-skip" onClick={() => onExit(false)}>
              Sair do guia
            </button>
          )}
          {step.advance === 'next' && (
            <button type="button" className="btn-primary" onClick={next}>
              {last ? 'Concluir' : 'Próximo'}
            </button>
          )}
          {step.advance === 'tap' && <span className="tour-wait">Toque no destaque</span>}
          {step.advance === 'saved' && <span className="tour-wait">Esperando você salvar</span>}
        </div>
      </div>
    </div>,
    host,
  );
}

/** The "?" button: short guided walkthroughs that teach by doing. */
export function HelpButton({ route, go }: { route: Route; go: (r: Route) => void }) {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState<Mission | null>(null);
  const [done, setDone] = useState(readDone);
  const firstVisit = useRef(localStorage.getItem(SEEN_KEY) !== 'seen');

  useEffect(() => {
    if (!firstVisit.current) return;
    const id = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(id);
  }, []);

  const close = () => {
    localStorage.setItem(SEEN_KEY, 'seen');
    setOpen(false);
  };
  const start = (mission: Mission) => {
    close();
    setTimeout(() => setRunning(mission), 320);
  };
  const exit = useCallback(
    (finished: boolean) => {
      setRunning((current) => {
        if (finished && current) {
          const next = [...new Set([...readDone(), current.id])];
          localStorage.setItem(DONE_KEY, JSON.stringify(next));
          setDone(next);
        }
        return null;
      });
    },
    [],
  );
  const suggested = missions.find((m) => !done.includes(m.id));

  return (
    <>
      <button type="button" className="icon-btn" aria-label="Modo de usar" title="Modo de usar" data-tour="help" onClick={() => setOpen(true)}>
        <Icon name="help" size={17} />
      </button>
      <Sheet open={open} onClose={close} title={firstVisit.current && done.length === 0 ? 'Bem-vindo ao Caixa' : 'Modo de usar'}>
        <p className="muted" style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
          Aprenda fazendo: cada guia acende o botão certo na tela e espera você tocar nele.
        </p>
        <div className="missions">
          {missions.map((m, i) => (
            <button
              key={m.id}
              type="button"
              className={`mission${m === suggested ? ' suggested' : ''}`}
              style={{ '--i': i } as CSSProperties}
              onClick={() => start(m)}
            >
              <span className="mission-art" aria-hidden="true">
                <Icon name={m.icon} size={22} />
              </span>
              <span className="mission-body">
                <span className="mission-title">{m.title}</span>
                <span className="mission-blurb">{m === suggested ? `Comece por aqui · ${m.blurb}` : m.blurb}</span>
              </span>
              {done.includes(m.id) ? (
                <span className="mission-state done" aria-label="Feito">
                  <Icon name="check" size={14} strokeWidth={2.4} />
                </span>
              ) : (
                <span className="mission-state mono">{m.steps.filter((s) => s.target).length} passos</span>
              )}
            </button>
          ))}
        </div>
      </Sheet>
      {running && <Tour key={running.id} mission={running} route={route} go={go} onExit={exit} />}
    </>
  );
}
