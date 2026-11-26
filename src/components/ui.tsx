import type { ReactNode, SVGProps } from 'react';

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

export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <svg className="memory" viewBox="0 0 100 100">
        <g fill="none" stroke="#34322F" strokeWidth="8">
          <path d="M48.5 14 A36 36 0 0 0 48.5 86" />
          <path d="M51.5 19 A36 36 0 0 1 51.5 91" />
        </g>
        <line x1="50" y1="-2" x2="50" y2="104" stroke="#C8503E" strokeWidth="0.7" opacity="0.55" />
      </svg>
      <svg className="circuit" preserveAspectRatio="none" viewBox="0 0 1440 1000">
        <g fill="none" stroke="#2a2826" strokeWidth="1">
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
