import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode, type RefObject, type SVGProps } from 'react';
import { createPortal } from 'react-dom';
import { brl } from '../lib/format';
import type { Background } from '../lib/appearance';

const paths = {
  home: <><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /></>,
  list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  pie: <><path d="M21 12A9 9 0 1 1 12 3v9z" /><path d="M15 3.5A9 9 0 0 1 20.5 9H15z" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
  card: <><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  upload: <><path d="M12 15V3M7 8l5-5 5 5" /><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  trash: <><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
  check: <path d="M5 12l5 5L20 7" />,
  logout: <><path d="M15 4h4v16h-4" /><path d="M10 8l-4 4 4 4M6 12h11" /></>,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  bank: <><path d="M3 10l9-6 9 6" /><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" /></>,
  wallet: <><path d="M4 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h11" /><path d="M16 13.5h.01" /></>,
  piggy: <><path d="M5 11a7 6 0 0 1 12.5-3.5L20 7v4l1 1v3h-2.5L17 17v2h-3v-1.5h-4V19H7v-2.5A6 6 0 0 1 5 11z" /><path d="M14 9.5h.01" /></>,
  layers: <><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5" /></>,
};

export type IconName = keyof typeof paths;

export function Icon({ name, size = 18, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}

export function MemoryMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={(size * 40) / 34} viewBox="0 0 34 40" role="img" aria-label="Marca andreluaan.dev">
      <g fill="none" stroke="var(--ink)" strokeWidth="2.6">
        <path d="M16.2 6.4 A12.4 12.4 0 0 0 16.2 31.2" />
        <path d="M17.8 8 A12.4 12.4 0 0 1 17.8 32.8" />
      </g>
      <line x1="17" y1="1" x2="17" y2="39" stroke="var(--shu)" strokeWidth="1.3" />
    </svg>
  );
}

export function Backdrop({ variant }: { variant: Background }) {
  if (variant === 'tinta') {
    return (
      <div className="backdrop" data-bg="tinta" aria-hidden="true">
        <span className="blob b1" />
        <span className="blob b2" />
        <span className="blob b3" />
        <span className="blob b4" />
        <svg className="stroke" preserveAspectRatio="none" viewBox="0 0 1440 1000">
          <path d="M-40 760 C 260 640, 420 860, 760 720 S 1240 520, 1500 600" strokeWidth="1.2" />
          <path d="M-40 300 C 300 220, 520 380, 880 260 S 1300 120, 1500 180" strokeWidth="0.8" opacity="0.7" />
        </svg>
      </div>
    );
  }
  return (
    <div className="backdrop" data-bg="memoria" aria-hidden="true">
      <svg className="memory" viewBox="0 0 100 100">
        <g fill="none" stroke="var(--line)" strokeWidth="8">
          <path d="M48.5 14 A36 36 0 0 0 48.5 86" />
          <path d="M51.5 19 A36 36 0 0 1 51.5 91" />
        </g>
        <line x1="50" y1="-2" x2="50" y2="104" stroke="var(--shu)" strokeWidth="0.7" opacity="0.55" />
      </svg>
      <svg className="circuit" preserveAspectRatio="none" viewBox="0 0 1440 1000">
        <g fill="none" stroke="var(--line-2)" strokeWidth="1">
          <path d="M0 220 H180 L220 260 H420" />
          <path d="M60 640 H260 L300 600 H520 L548 572" />
          <path d="M900 980 V880 L940 840 H1180" />
          <path d="M1240 60 V160 L1280 200 H1460" />
        </g>
      </svg>
    </div>
  );
}

export function Panel({ title, action, children, className = '' }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`glass panel ${className}`}>
      {(title || action) && (
        <div className="panel-head">
          {title && <h2 style={{ fontSize: 17 }}>{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Progress({ value, over = false, label }: { value: number; over?: boolean; label: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
      <span className={over ? 'over' : ''} style={{ width: `${pct}%` }} />
    </div>
  );
}

const tones = ['#ECE8DF', '#C9C4BA', '#A9A49B', '#8E8A82', '#B9B4AA', '#7A766E', '#DCD7CC', '#9A958C'];

export function toneFor(key: string) {
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return tones[hash % tones.length];
}

export function Avatar({ label }: { label: string }) {
  return (
    <div className="avatar" style={{ background: toneFor(label) }} aria-hidden="true">
      {label.charAt(0).toUpperCase()}
    </div>
  );
}

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`label ${className ?? ''}`}>
      <span className="mono">{label}</span>
      {children}
    </label>
  );
}

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function Money({ value, duration = 900 }: { value: number; duration?: number }) {
  const node = useRef<HTMLSpanElement>(null);
  const shown = useRef(reducedMotion() ? value : 0);

  useLayoutEffect(() => {
    const el = node.current;
    if (!el) return;
    const origin = shown.current;
    el.textContent = brl(origin);
    if (origin === value || reducedMotion()) {
      shown.current = value;
      el.textContent = brl(value);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      shown.current = origin + (value - origin) * (1 - Math.pow(1 - t, 4));
      el.textContent = brl(shown.current);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <span ref={node} />;
}

export function useGlassLight() {
  useEffect(() => {
    if (!matchMedia('(hover: hover)').matches) return;
    let frame = 0;
    let event: PointerEvent | null = null;
    const paint = () => {
      frame = 0;
      const e = event;
      const el = (e?.target as Element | null)?.closest?.('.glass') as HTMLElement | null;
      if (!e || !el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      event = e;
      if (!frame) frame = requestAnimationFrame(paint);
    };
    document.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      document.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
    };
  }, []);
}
type Rect = { x: number; y: number; w: number; h: number };

const frame = (r: Rect, sx = 1, sy = 1) => ({
  transform: `translate(${r.x}px, ${r.y}px) scale(${sx}, ${sy})`,
  width: `${r.w}px`,
  height: `${r.h}px`,
});

function rectOf(el: HTMLElement, box: HTMLElement): Rect {
  const r = { x: 0, y: 0, w: el.offsetWidth, h: el.offsetHeight };
  for (let node: HTMLElement | null = el; node && node !== box; node = node.offsetParent as HTMLElement | null) {
    r.x += node.offsetLeft;
    r.y += node.offsetTop;
  }
  return r;
}

const same = (a: Rect, b: Rect) => a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;

/**
 * Selection pill that slides between items and, while pressed, turns into a
 * draggable glass lens that magnifies the item under it (iOS tab bar style).
 */
export function useLiquidNav(
  container: RefObject<HTMLElement | null>,
  activeKey: string,
  onSelect: (key: string) => void,
  axis: 'x' | 'y',
) {
  const last = useRef<Rect | null>(null);
  const select = useRef(onSelect);
  select.current = onSelect;

  useLayoutEffect(() => {
    const box = container.current;
    const pill = box?.querySelector<HTMLElement>(':scope > .nav-pill');
    if (!box || !pill) return;

    const place = (animate: boolean) => {
      if (box.classList.contains('pressing')) return;
      const active = box.querySelector<HTMLElement>('[aria-current="page"]');
      if (!active || !active.offsetParent) return;
      const next = rectOf(active, box);
      const from = last.current;
      last.current = next;
      Object.assign(pill.style, frame(next), { opacity: '1' });
      if (!animate || !from || same(from, next) || reducedMotion()) return;

      const x = Math.min(from.x, next.x);
      const y = Math.min(from.y, next.y);
      const stretched = { x, y, w: Math.max(from.x + from.w, next.x + next.w) - x, h: Math.max(from.y + from.h, next.y + next.h) - y };
      const horizontal = Math.abs(next.x - from.x) > Math.abs(next.y - from.y);
      pill.animate(
        [
          frame(from),
          { ...frame(stretched, horizontal ? 1 : 0.94, horizontal ? 0.94 : 1.06), offset: 0.42 },
          { ...frame(next, horizontal ? 0.96 : 1.03, horizontal ? 1.04 : 0.97), offset: 0.75 },
          frame(next),
        ],
        { duration: 560, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' },
      );
    };

    place(true);
    const observer = new ResizeObserver(() => place(false));
    observer.observe(box);
    return () => observer.disconnect();
  }, [container, activeKey]);

  useEffect(() => {
    const box = container.current;
    const pill = box?.querySelector<HTMLElement>(':scope > .nav-pill');
    if (!box || !pill) return;

    const items = () => [...box.querySelectorAll<HTMLElement>('[data-key]')].filter((el) => el.offsetParent);
    let pointer: number | null = null;
    let base: Rect | null = null;
    let lastPos = 0;
    let lastTime = 0;
    let stretch = 1;
    let under: HTMLElement | null = null;
    let current: { rect: Rect; sx: number; sy: number } | null = null;
    let handled = false;

    const lensAt = (pos: number) => {
      if (!base) return;
      const local = axis === 'x' ? pos - origin.left : pos - origin.top;
      const grow = axis === 'x' ? { w: base.w * 1.08, h: base.h * 1.34 } : { w: base.w * 1.02, h: base.h * 1.4 };
      const span = axis === 'x' ? box.clientWidth : box.clientHeight;
      const size = axis === 'x' ? grow.w : grow.h;
      const center = Math.max(size / 2 - 6, Math.min(span - size / 2 + 6, local));
      const lens: Rect =
        axis === 'x'
          ? { x: center - grow.w / 2, y: base.y - (grow.h - base.h) / 2, w: grow.w, h: grow.h }
          : { x: base.x - (grow.w - base.w) / 2, y: center - grow.h / 2, w: grow.w, h: grow.h };

      const now = performance.now();
      const velocity = Math.abs(pos - lastPos) / Math.max(1, now - lastTime);
      stretch += (1 + Math.min(velocity * 0.22, 0.32) - stretch) * 0.35;
      lastPos = pos;
      lastTime = now;
      const squash = 1 / Math.sqrt(stretch);
      current = axis === 'x' ? { rect: lens, sx: stretch, sy: squash } : { rect: lens, sx: squash, sy: stretch };
      Object.assign(pill.style, frame(current.rect, current.sx, current.sy));

      const nearest = closest(center);
      if (nearest !== under) {
        under?.classList.remove('under-lens');
        nearest?.classList.add('under-lens');
        under = nearest;
      }
    };

    let centers: { el: HTMLElement; c: number }[] = [];
    let origin = { left: 0, top: 0 };
    const closest = (center: number) => {
      let best: HTMLElement | null = null;
      let distance = Infinity;
      for (const { el, c } of centers) {
        const d = Math.abs(c - center);
        if (d < distance) {
          distance = d;
          best = el;
        }
      }
      return best;
    };

    const down = (e: PointerEvent) => {
      if (e.button !== 0 || reducedMotion()) return;
      pointer = e.pointerId;
      handled = true;
      try {
        box.setPointerCapture(e.pointerId);
      } catch {
        // pointer already gone
      }
      const target = (e.target as Element).closest<HTMLElement>('[data-key]') ?? items()[0];
      base = target ? rectOf(target, box) : last.current;
      const b = box.getBoundingClientRect();
      origin = { left: b.left + box.clientLeft, top: b.top + box.clientTop };
      centers = items().map((el) => {
        const r = rectOf(el, box);
        return { el, c: axis === 'x' ? r.x + r.w / 2 : r.y + r.h / 2 };
      });
      lastPos = axis === 'x' ? e.clientX : e.clientY;
      lastTime = performance.now();
      stretch = 1;
      box.classList.add('pressing');
      pill.classList.add('lens');
      lensAt(lastPos);
    };

    const move = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      lensAt(axis === 'x' ? e.clientX : e.clientY);
    };

    const release = (e: PointerEvent, commit: boolean) => {
      if (e.pointerId !== pointer) return;
      pointer = null;
      const chosen = commit ? under : null;
      under?.classList.remove('under-lens');
      under = null;
      box.classList.remove('pressing');
      pill.classList.remove('lens');

      const settle = chosen ?? box.querySelector<HTMLElement>('[aria-current="page"]');
      if (settle) {
        const to = rectOf(settle, box);
        last.current = to;
        Object.assign(pill.style, frame(to));
        if (current) {
          pill.animate([frame(current.rect, current.sx, current.sy), frame(to)], {
            duration: 520,
            easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)',
          });
        }
      }
      current = null;
      const key = chosen?.dataset.key;
      if (key) select.current(key);
    };

    const noDrag = (e: DragEvent) => e.preventDefault();
    const up = (e: PointerEvent) => release(e, true);
    const cancel = (e: PointerEvent) => release(e, false);
    const click = (e: MouseEvent) => {
      if (handled && e.detail !== 0) e.preventDefault();
      handled = false;
    };

    box.addEventListener('pointerdown', down);
    box.addEventListener('pointermove', move);
    box.addEventListener('pointerup', up);
    box.addEventListener('pointercancel', cancel);
    box.addEventListener('click', click);
    box.addEventListener('dragstart', noDrag);
    return () => {
      box.removeEventListener('dragstart', noDrag);
      box.removeEventListener('pointerdown', down);
      box.removeEventListener('pointermove', move);
      box.removeEventListener('pointerup', up);
      box.removeEventListener('pointercancel', cancel);
      box.removeEventListener('click', click);
    };
  }, [container, axis]);
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [round, setRound] = useState(0);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && !wasOpen.current) setRound((n) => n + 1);
    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) {
      d.classList.remove('closing');
      d.showModal();
    }
    if (!open && d.open) {
      if (reducedMotion()) return d.close();
      d.classList.add('closing');
      const done = () => d.close();
      d.addEventListener('animationend', done, { once: true });
      return () => d.removeEventListener('animationend', done);
    }
  }, [open]);

  return createPortal(
    <dialog
      ref={dialog}
      className="sheet"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClose={() => open && onClose()}
      onClick={(e) => {
        if (e.target === dialog.current) onClose();
      }}
    >
      <div className="sheet-grip" aria-hidden="true" />
      <div className="sheet-head">
        <h2 id={titleId}>{title}</h2>
        <button type="button" className="icon-btn" aria-label="Fechar" onClick={onClose}>
          <Icon name="close" size={16} />
        </button>
      </div>
      <div key={round} className="sheet-body">{children}</div>
    </dialog>,
    document.body,
  );
}

export function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="pill add" onClick={onClick}>
      <Icon name="plus" size={14} strokeWidth={2.2} />
      {label}
    </button>
  );
}

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

/** On iPhone Safari, explains how to install the app on the home screen. */
export function InstallHint() {
  const [show, setShow] = useState(() => isIOS() && !isStandalone() && localStorage.getItem('caixa.installHint') !== 'off');
  if (!show) return null;
  const close = () => {
    localStorage.setItem('caixa.installHint', 'off');
    setShow(false);
  };
  return (
    <div className="glass install-hint" role="note">
      <p>
        <strong>Instale o Caixa no iPhone.</strong> Toque em{' '}
        <svg className="share" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-label="Compartilhar">
          <path d="M12 3v12M8 7l4-4 4 4" />
          <path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8" />
        </svg>{' '}
        e depois em <strong>Adicionar à Tela de Início</strong>.
      </p>
      <button type="button" className="icon-btn" aria-label="Fechar dica" onClick={close}>
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}
