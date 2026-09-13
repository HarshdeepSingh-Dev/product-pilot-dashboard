'use client';

import { useMemo, useRef, useState, type FormEvent } from 'react';
import type { CommitResponse, PreviewResponse } from '@/contracts/imports';

type Product = { id: string; name: string };
type ApiError = { error?: string };
const pageSize = 50;

export default function ImportWorkspace({ connected, products }: { connected: boolean; products: Product[] }) {
  const [preview, setPreview] = useState<PreviewResponse>();
  const [type, setType] = useState<'sales' | 'returns'>('sales');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [associations, setAssociations] = useState<Record<string, string>>({});
  const [acknowledgeUnmappedSales, setAcknowledgeUnmappedSales] = useState(false);
  const [page, setPage] = useState(0);
  const abort = useRef<AbortController | undefined>(undefined);

  const rows = preview?.previewRows.slice(page * pageSize, (page + 1) * pageSize) ?? [];
  const mapped = useMemo(() => Object.values(associations).filter(Boolean).length, [associations]);
  const unmappedSales = preview?.previewRows.filter((row) => row.type === 'sales' && !associations[row.identity]).length ?? 0;
  const valid = Boolean(connected && preview?.token && !preview.errors.length && !preview.duplicates.length && (!unmappedSales || acknowledgeUnmappedSales));
  function resetPreview(): void { abort.current?.abort(); setPreview(undefined); setAssociations({}); setAcknowledgeUnmappedSales(false); setPage(0); }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); resetPreview(); setLoading(true); setStatus('');
    const controller = new AbortController(); abort.current = controller;
    try {
      const data = new FormData(event.currentTarget); data.set('type', type);
      const response = await fetch('/api/imports/preview', { method: 'POST', body: data, signal: controller.signal });
      const result = await response.json() as PreviewResponse | ApiError;
      if (!response.ok) { setStatus((result as ApiError).error ?? 'Preview failed.'); return; }
      setPreview(result as PreviewResponse); setStatus('Preview ready for review.');
    } catch (error) { if ((error as Error).name !== 'AbortError') setStatus('Preview failed. Try again.'); }
    finally { if (abort.current === controller) setLoading(false); }
  }
  async function commit() {
    if (!preview) return;
    setLoading(true); setStatus('');
    try {
      const response = await fetch('/api/imports/commit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: preview.token, associations, acknowledgeUnmappedSales }) });
      const result = await response.json() as CommitResponse | ApiError;
      if (!response.ok) { setStatus((result as ApiError).error ?? 'Commit failed.'); return; }
      setStatus(`Import receipt: ${(result as CommitResponse).events} events.`); resetPreview();
    } catch { setStatus('Commit failed. Try again.'); } finally { setLoading(false); }
  }
  const pages = preview ? Math.ceil(preview.previewRows.length / pageSize) : 0;
  return <>
    <h1 className="text-3xl font-bold">Imports</h1><p className="mt-1 text-slate-600">Upload, validate, associate products, then commit the reviewed rows.</p>
    <form onSubmit={upload} className="card mt-5 space-y-4" aria-busy={loading}>
      <fieldset><legend className="font-bold">Event type</legend><label className="mr-5 inline-flex min-h-11 items-center gap-2"><input name="import-type" type="radio" checked={type === 'sales'} onChange={() => { setType('sales'); resetPreview(); }} />Sales</label><label className="inline-flex min-h-11 items-center gap-2"><input name="import-type" type="radio" checked={type === 'returns'} onChange={() => { setType('returns'); resetPreview(); }} />Returns</label></fieldset>
      <label className="block font-medium">Spreadsheet<input className="input mt-1" name="file" type="file" accept=".xlsx,.csv" required onChange={resetPreview} /></label>
      <button className="btn" disabled={loading}>{loading ? 'Working…' : 'Preview upload'}</button>
    </form>
    <p role="status" className="mt-3">{status}</p>
    {preview && <section className="card mt-5"><h2 className="text-xl font-bold">Preview</h2><dl className="mt-3 grid grid-cols-2 gap-3"><div><dt>Rows</dt><dd>{preview.rows}</dd></div><div><dt>Total quantity</dt><dd>{preview.totalQuantity}</dd></div><div><dt>Mapped</dt><dd>{mapped}</dd></div><div><dt>Unmapped</dt><dd>{preview.rows - mapped}</dd></div><div><dt>Invoice value</dt><dd>₹{(preview.grossInvoicePaise / 100).toFixed(2)}</dd></div><div><dt>File</dt><dd>{preview.filename} ({preview.format})</dd></div><div className="col-span-2"><dt>File hash</dt><dd className="break-all text-sm">{preview.hash}</dd></div></dl>
      {(preview.errors.length > 0 || preview.duplicates.length > 0) && <div role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-red-800"><h3 className="font-bold">Resolve before commit</h3>{preview.errors.map((error) => <p key={error}>{error}</p>)}{preview.duplicates.map((duplicate) => <p key={duplicate.identity}>{duplicate.identity}: {duplicate.count} duplicate rows</p>)}</div>}
      {unmappedSales > 0 && <label className="mt-4 flex min-h-11 items-center gap-2"><input type="checkbox" checked={acknowledgeUnmappedSales} onChange={(event) => setAcknowledgeUnmappedSales(event.target.checked)} />I understand {unmappedSales} unmapped sale events will be recorded without changing stock.</label>}
      <div className="table-wrap mt-4"><table className="table"><caption>Parsed rows and product associations — {preview.previewRows.length} rows</caption><thead><tr><th scope="col">Sub-order</th><th scope="col">Date</th><th scope="col">Quantity</th><th scope="col">Product</th></tr></thead><tbody>{rows.map((row) => <tr key={`${row.identity}:${row.sourceRow}`}><td>{row.subOrderNumber}</td><td>{row.date}</td><td>{row.quantity}</td><td><label className="sr-only" htmlFor={`product-${row.sourceRow}`}>Product for {row.subOrderNumber}</label><select id={`product-${row.sourceRow}`} className="input" value={associations[row.identity] ?? ''} onChange={(event) => setAssociations((current) => ({ ...current, [row.identity]: event.target.value }))}><option value="">Unmapped</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></td></tr>)}</tbody></table></div>
      {pages > 1 && <div className="mt-4 flex items-center gap-3"><button type="button" className="btn" disabled={page === 0} onClick={() => setPage((current) => current - 1)}>Previous</button><span>Page {page + 1} of {pages}</span><button type="button" className="btn" disabled={page + 1 >= pages} onClick={() => setPage((current) => current + 1)}>Next</button></div>}
      <button type="button" className="btn mt-4" disabled={!valid || loading} onClick={commit}>{loading ? 'Working…' : 'Commit import'}</button>{!connected && <p role="status" className="mt-2 text-slate-600">Connect MongoDB to save changes.</p>}
    </section>}
  </>;
}
