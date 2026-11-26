import { useState, type ChangeEvent } from 'react';
import { useStore } from '../lib/store';
import { brl, shortDate } from '../lib/format';
import { looksLikeCardCSV, parseStatement, suggestCategory, type ParsedRow } from '../lib/import';
import { Field, Icon, Panel } from '../components/ui';

interface Draft extends ParsedRow {
  include: boolean;
  categoryId: string;
}

async function readText(file: File) {
  const buffer = await file.arrayBuffer();
  const utf8 = new TextDecoder('utf-8').decode(buffer);
  // Many Brazilian bank exports are Latin-1; fall back when UTF-8 decoding produced replacement chars.
  return utf8.includes('�') ? new TextDecoder('windows-1252').decode(buffer) : utf8;
}

export function Import() {
  const { accounts, categories, addTransactions } = useStore();
  const [fileName, setFileName] = useState('');
  const [raw, setRaw] = useState('');
  const [invert, setInvert] = useState(false);
  const [accountId, setAccountId] = useState('');
  const [rows, setRows] = useState<Draft[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function build(name: string, text: string, invertSigns: boolean) {
    const parsed = parseStatement(name, text, invertSigns);
    setWarnings(parsed.warnings);
    setRows(
      parsed.rows.map((r) => ({
        ...r,
        include: true,
        categoryId: suggestCategory(r.description, r.kind, categories) ?? categories.find((c) => c.kind === r.kind && c.name === 'Outros')?.id ?? '',
      })),
    );
  }

  async function pick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await readText(file);
    const card = looksLikeCardCSV(text);
    setFileName(file.name);
    setRaw(text);
    setInvert(card);
    setResult(null);
    if (card) {
      const firstCard = accounts.find((a) => a.kind === 'credit');
      if (firstCard) setAccountId(firstCard.id);
    }
    build(file.name, text, card);
  }

  function patch(index: number, change: Partial<Draft>) {
    setRows((current) => current.map((r, i) => (i === index ? { ...r, ...change } : r)));
  }

  async function save() {
    const selected = rows.filter((r) => r.include);
    if (selected.length === 0) return;
    setBusy(true);
    const account = accountId || accounts[0]?.id || null;
    const outcome = await addTransactions(
      selected.map((r) => ({
        description: r.description,
        amount: Math.round(r.amount * 100) / 100,
        kind: r.kind,
        occurred_on: r.date,
        category_id: r.categoryId || null,
        account_id: account,
        import_key: `${account ?? 'none'}:${r.key}`,
      })),
    );
    setBusy(false);
    if (outcome) {
      setResult(
        `${outcome.inserted} transaç${outcome.inserted === 1 ? 'ão importada' : 'ões importadas'}` +
          (outcome.skipped ? ` · ${outcome.skipped} já existiam e foram ignoradas` : ''),
      );
      setRows([]);
      setRaw('');
      setFileName('');
    }
  }

  const selected = rows.filter((r) => r.include);
  const total = selected.reduce((s, r) => s + (r.kind === 'in' ? r.amount : -r.amount), 0);

  return (
    <div className="content" style={{ flex: 'initial' }}>
      <Panel title="Importar extrato">
        <p className="muted" style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
          Envie o arquivo OFX ou CSV exportado do app do seu banco. O arquivo é lido aqui no navegador; só as transações que você
          confirmar vão para o banco de dados. Reimportar o mesmo extrato não duplica nada.
        </p>
        <div className="row">
          <Field label="Arquivo (.ofx, .csv)" className="grow">
            <input className="field" type="file" accept=".ofx,.qfx,.csv,text/csv" onChange={(e) => void pick(e)} style={{ paddingTop: 10 }} />
          </Field>
          <Field label="Conta de destino">
            <select className="field" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </Field>
        </div>
        {raw && !/\.(ofx|qfx)$/i.test(fileName) && (
          <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
            <input
              type="checkbox"
              checked={invert}
              onChange={(e) => {
                setInvert(e.target.checked);
                build(fileName, raw, e.target.checked);
              }}
            />
            É fatura de cartão (compras vêm como valores positivos)
          </label>
        )}
        {result && <p role="status" style={{ margin: 0, fontSize: 14 }}><Icon name="check" size={14} /> {result}</p>}
        {warnings.length > 0 && (
          <details className="muted" style={{ fontSize: 12 }}>
            <summary>{warnings.length} linha{warnings.length === 1 ? '' : 's'} ignorada{warnings.length === 1 ? '' : 's'}</summary>
            <ul>{warnings.slice(0, 30).map((w, i) => <li key={i}>{w}</li>)}</ul>
          </details>
        )}
      </Panel>

      {rows.length > 0 && (
        <Panel
          title={`Conferir ${rows.length} transações`}
          action={
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="mono num">{selected.length} selecionadas · {brl(total)}</span>
              <button className="btn-primary" type="button" disabled={busy || selected.length === 0} onClick={() => void save()}>
                <Icon name="upload" size={14} />
                {busy ? 'Importando…' : 'Importar'}
              </button>
            </div>
          }
        >
          <div className="table-wrap">
            <table className="preview">
              <thead>
                <tr>
                  <th><span className="sr-only">Incluir</span></th>
                  <th className="mono">Data</th>
                  <th className="mono">Descrição</th>
                  <th className="mono">Categoria</th>
                  <th className="mono" style={{ textAlign: 'right' }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.key} style={{ opacity: r.include ? 1 : 0.45 }}>
                    <td>
                      <input type="checkbox" aria-label={`Incluir ${r.description}`} checked={r.include} onChange={(e) => patch(i, { include: e.target.checked })} />
                    </td>
                    <td className="num" style={{ whiteSpace: 'nowrap' }}>{shortDate(r.date)} {r.date.slice(2, 4)}</td>
                    <td>{r.description}</td>
                    <td>
                      <select className="field" aria-label={`Categoria de ${r.description}`} value={r.categoryId} onChange={(e) => patch(i, { categoryId: e.target.value })}>
                        <option value="">Sem categoria</option>
                        {categories.filter((c) => c.kind === r.kind).map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className={`amount ${r.kind}`} style={{ textAlign: 'right' }}>
                      {r.kind === 'in' ? '+ ' : '− '}
                      {brl(r.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}
