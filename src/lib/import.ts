import { normalize, parseMoney } from './format';
import type { Category, Kind } from './types';

export interface ParsedRow {
  date: string;
  description: string;
  amount: number;
  kind: Kind;
  key: string;
}

export interface ParseResult {
  format: 'ofx' | 'csv';
  rows: ParsedRow[];
  warnings: string[];
}

function hash(text: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

function toISO(raw: string): string | null {
  const s = raw.trim();
  let m = s.match(/^(\d{4})-?(\d{2})-?(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (m) {
    const year = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${year}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }
  return null;
}

function withKeys(rows: Omit<ParsedRow, 'key'>[], explicit?: (string | null)[]): ParsedRow[] {
  const seen = new Map<string, number>();
  return rows.map((row, i) => {
    if (explicit?.[i]) return { ...row, key: `id:${explicit[i]}` };
    const base = `${row.date}|${row.kind}|${row.amount.toFixed(2)}|${normalize(row.description)}`;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return { ...row, key: `h:${hash(`${base}|${n}`)}` };
  });
}

export function parseOFX(text: string): ParseResult {
  const warnings: string[] = [];
  const blocks = text.split(/<STMTTRN>/i).slice(1);
  const tag = (block: string, name: string) => block.match(new RegExp(`<${name}>([^<\\r\\n]*)`, 'i'))?.[1]?.trim() ?? '';
  const rows: Omit<ParsedRow, 'key'>[] = [];
  const ids: (string | null)[] = [];
  for (const block of blocks) {
    const date = toISO(tag(block, 'DTPOSTED'));
    const amount = parseMoney(tag(block, 'TRNAMT'));
    const description = tag(block, 'MEMO') || tag(block, 'NAME') || 'Sem descrição';
    if (!date || !Number.isFinite(amount) || amount === 0) {
      warnings.push(`Transação ignorada (dados incompletos): ${description}`);
      continue;
    }
    rows.push({ date, description: description.slice(0, 140), amount: Math.abs(amount), kind: amount > 0 ? 'in' : 'out' });
    const fitid = tag(block, 'FITID');
    ids.push(fitid ? `${fitid}|${date}|${amount}` : null);
  }
  return { format: 'ofx', rows: withKeys(rows, ids), warnings };
}

function splitCSVLine(line: string, delimiter: string) {
  const cells: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) {
      cells.push(cell);
      cell = '';
    } else cell += ch;
  }
  cells.push(cell);
  return cells.map((c) => c.trim());
}

const headerMatchers = {
  date: ['data', 'date', 'dt'],
  description: ['descricao', 'description', 'title', 'titulo', 'historico', 'memo', 'estabelecimento', 'lancamento'],
  amount: ['valor', 'amount', 'value', 'quantia'],
};

function findColumn(headers: string[], names: string[]) {
  return headers.findIndex((h) => names.some((n) => normalize(h).startsWith(n)));
}

// Credit card exports (e.g. Nubank "date,title,amount") list purchases as positive numbers.
export function parseCSV(text: string, invertSigns: boolean): ParseResult {
  const warnings: string[] = [];
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { format: 'csv', rows: [], warnings: ['O arquivo não tem linhas de dados.'] };
  const delimiter = (lines[0].match(/;/g)?.length ?? 0) > (lines[0].match(/,/g)?.length ?? 0) ? ';' : ',';
  const headers = splitCSVLine(lines[0], delimiter);
  const col = {
    date: findColumn(headers, headerMatchers.date),
    description: findColumn(headers, headerMatchers.description),
    amount: findColumn(headers, headerMatchers.amount),
  };
  if (col.date < 0 || col.amount < 0) {
    return { format: 'csv', rows: [], warnings: ['Não encontrei as colunas de data e valor no cabeçalho do CSV.'] };
  }
  const idCol = findColumn(headers, ['identificador', 'id']);
  const rows: Omit<ParsedRow, 'key'>[] = [];
  const ids: (string | null)[] = [];
  lines.slice(1).forEach((line, i) => {
    const cells = splitCSVLine(line, delimiter);
    const date = toISO(cells[col.date] ?? '');
    let amount = parseMoney(cells[col.amount] ?? '');
    const description = (col.description >= 0 ? cells[col.description] : '') || 'Sem descrição';
    if (!date || !Number.isFinite(amount) || amount === 0) {
      warnings.push(`Linha ${i + 2} ignorada: ${line.slice(0, 60)}`);
      return;
    }
    if (invertSigns) amount = -amount;
    rows.push({ date, description: description.slice(0, 140), amount: Math.abs(amount), kind: amount > 0 ? 'in' : 'out' });
    ids.push(idCol >= 0 && cells[idCol] ? cells[idCol] : null);
  });
  return { format: 'csv', rows: withKeys(rows, ids), warnings };
}

export function looksLikeCardCSV(text: string) {
  const header = normalize(text.replace(/^﻿/, '').split(/\r?\n/)[0] ?? '');
  return /^date,title,amount/.test(header);
}

export function parseStatement(fileName: string, text: string, invertSigns: boolean): ParseResult {
  const isOFX = /\.(ofx|qfx)$/i.test(fileName) || /<OFX>/i.test(text);
  return isOFX ? parseOFX(text) : parseCSV(text, invertSigns);
}

export function suggestCategory(description: string, kind: Kind, categories: Category[]): string | null {
  const text = normalize(description);
  if (!text) return null;
  let best: { id: string; length: number } | null = null;
  for (const c of categories) {
    if (c.kind !== kind) continue;
    for (const word of c.keywords) {
      const w = normalize(word);
      if (w && text.includes(w) && (!best || w.length > best.length)) best = { id: c.id, length: w.length };
    }
  }
  return best?.id ?? null;
}
