import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { Icon, Sheet, type IconName } from './ui';
import type { Route } from '../App';

type Step = { routes: Route[]; icon: IconName; title: string; lead: string; points: string[] };

const steps: Step[] = [
  {
    routes: [],
    icon: 'wallet',
    title: 'Bem-vindo ao Caixa',
    lead: 'Aqui você vê quanto tem, o que entrou e saiu no mês e o que ainda vem pela frente.',
    points: [
      'Tudo começa lançando o que entra e o que sai.',
      'Deslize para o lado ou use os botões abaixo para seguir.',
      'Para rever este guia, toque no ? perto do tema.',
    ],
  },
  {
    routes: [],
    icon: 'plus',
    title: 'Lançar em segundos',
    lead: 'Registre um gasto ou um dinheiro que entrou assim que acontecer.',
    points: [
      'No celular, toque no + ao lado do menu. No computador, use o campo do Início.',
      'Escreva a descrição e o valor e escolha Saída ou Entrada.',
      'Em Parcelado, diga quantas vezes: o Caixa cria uma parcela por mês no cartão.',
      'A categoria é sugerida pela descrição. Toque na linha de detalhes para trocar categoria, data ou conta.',
    ],
  },
  {
    routes: ['overview'],
    icon: 'home',
    title: 'Início',
    lead: 'O resumo do seu mês em uma tela.',
    points: [
      'Tenho hoje: a soma das contas e do dinheiro, sem contar o cartão.',
      'Entrou e Saiu: o total do mês atual.',
      'Sobra prevista: o que você tem, mais o que vai receber, menos o que falta pagar no mês.',
      'O gráfico compara entradas (azul) e saídas (vermelho) dos últimos 6 meses.',
    ],
  },
  {
    routes: ['transactions', 'import'],
    icon: 'list',
    title: 'Extrato',
    lead: 'Todos os lançamentos, mês a mês.',
    points: [
      'Escolha o mês, busque pelo nome ou mostre só entradas ou saídas.',
      'Toque num lançamento para editar ou excluir. Numa compra parcelada, dá para excluir as próximas parcelas juntas.',
      'Importar traz o extrato do banco (OFX ou CSV) sem repetir o que já foi lançado.',
    ],
  },
  {
    routes: ['bills'],
    icon: 'calendar',
    title: 'Contas',
    lead: 'O que você paga ou recebe todo mês, ou uma vez só.',
    points: [
      'Cadastre aluguel, internet, salário, um IPVA… com o dia do vencimento.',
      'Quando pagar, toque em Paguei (ou Recebi): o valor vai para o extrato e a conta sai da lista até o próximo mês.',
      'Toque numa conta para editar ou excluir.',
    ],
  },
  {
    routes: ['accounts'],
    icon: 'card',
    title: 'Carteira',
    lead: 'Onde o seu dinheiro está.',
    points: [
      'Cartões: a fatura atual, o vencimento e quanto do limite já foi usado.',
      'Compras parceladas: quantas parcelas já foram e quanto falta.',
      'Contas: o saldo de cada conta do banco e do dinheiro em mãos.',
    ],
  },
  {
    routes: ['budgets', 'goals'],
    icon: 'target',
    title: 'Planos',
    lead: 'Limites para gastar e objetivos para juntar.',
    points: [
      'Orçamento: um limite por mês para uma categoria. O Início avisa quando ela passa de 80%.',
      'Metas: um valor para juntar, com prazo se quiser. Toque na meta para guardar ou retirar dinheiro.',
    ],
  },
  {
    routes: [],
    icon: 'sun',
    title: 'Do seu jeito',
    lead: 'Pequenos atalhos que deixam o uso mais rápido.',
    points: [
      'O sol (ou a lua) troca entre tema claro e escuro. O losango troca o fundo.',
      'No menu de baixo, segure e arraste o dedo para passar de uma tela a outra.',
      'Instalado no iPhone, o Caixa abre como app e se atualiza sozinho.',
    ],
  },
];

const SEEN_KEY = 'caixa.guide';

function Guide({ start, onDone }: { start: number; onDone: () => void }) {
  const [index, setIndex] = useState(start);
  const [dir, setDir] = useState<'next' | 'back'>('next');
  const swipe = useRef<number | null>(null);
  const step = steps[index];
  const last = index === steps.length - 1;

  const goTo = (n: number) => {
    if (n < 0 || n >= steps.length || n === index) return;
    setDir(n > index ? 'next' : 'back');
    setIndex(n);
  };

  const onPointerDown = (e: PointerEvent) => {
    swipe.current = e.clientX;
  };
  const onPointerUp = (e: PointerEvent) => {
    if (swipe.current === null) return;
    const dx = e.clientX - swipe.current;
    swipe.current = null;
    if (Math.abs(dx) > 50) goTo(index + (dx < 0 ? 1 : -1));
  };

  return (
    <div className="guide" onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => (swipe.current = null)}>
      <div key={index} className={`guide-step ${dir}`} aria-live="polite">
        <div className="guide-art" aria-hidden="true">
          <Icon name={step.icon} size={30} />
          <span className="guide-dot" />
        </div>
        <span className="mono guide-count">
          {index + 1} / {steps.length}
        </span>
        <h3 className="guide-title">{step.title}</h3>
        <p className="guide-lead">{step.lead}</p>
        <ul className="guide-points">
          {step.points.map((point, i) => (
            <li key={point} style={{ '--i': i } as CSSProperties}>
              <Icon name="check" size={14} strokeWidth={2.2} />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="guide-dots" role="tablist" aria-label="Passos do guia">
        {steps.map((s, i) => (
          <button
            key={s.title}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`${i + 1}. ${s.title}`}
            className="guide-pip"
            onClick={() => goTo(i)}
          />
        ))}
      </div>

      <div className="guide-actions">
        <button type="button" className="pill" onClick={() => goTo(index - 1)} disabled={index === 0}>
          Voltar
        </button>
        <button type="button" className="btn-primary" onClick={() => (last ? onDone() : goTo(index + 1))}>
          {last ? 'Entendi' : 'Próximo'}
        </button>
      </div>
    </div>
  );
}

/** "?" button that opens a step-by-step guide, starting at the screen in use. Opens by itself on the first visit. */
export function HelpButton({ route }: { route: Route }) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(0);

  useEffect(() => {
    if (localStorage.getItem(SEEN_KEY) === 'seen') return;
    const id = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(id);
  }, []);

  const show = () => {
    const match = steps.findIndex((s) => s.routes.includes(route));
    setStart(match === -1 ? 0 : match);
    setOpen(true);
  };
  const close = () => {
    localStorage.setItem(SEEN_KEY, 'seen');
    setOpen(false);
  };

  return (
    <>
      <button type="button" className="icon-btn" aria-label="Como usar o Caixa" title="Como usar" onClick={show}>
        <Icon name="help" size={17} />
      </button>
      <Sheet open={open} onClose={close} title="Como usar">
        <Guide start={start} onDone={close} />
      </Sheet>
    </>
  );
}
