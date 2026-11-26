const brlFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const brl = (value: number) => brlFormatter.format(value);

export function parseMoney(input: string): number {
  const clean = input.trim().replace(/[R$\s]/g, '');
  if (!clean) return NaN;
  const lastComma = clean.lastIndexOf(',');
  const lastDot = clean.lastIndexOf('.');
  const normalized =
    lastComma > lastDot ? clean.replace(/\./g, '').replace(',', '.') : clean.replace(/,/g, '');
  return Number(normalized);
}

export const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const today = () => toISODate(new Date());

export const monthKey = (iso: string) => iso.slice(0, 7);

export const currentMonth = () => today().slice(0, 7);

const monthNames = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const monthNamesLong = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

export const shortMonth = (key: string) => monthNames[Number(key.slice(5, 7)) - 1];
export const longMonth = (key: string) => monthNamesLong[Number(key.slice(5, 7)) - 1];

export function shortDate(iso: string) {
  return `${iso.slice(8, 10)} ${shortMonth(iso)}`;
}

export function lastMonths(count: number, from = currentMonth()): string[] {
  const [y, m] = from.split('-').map(Number);
  const out: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

export function normalize(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}
