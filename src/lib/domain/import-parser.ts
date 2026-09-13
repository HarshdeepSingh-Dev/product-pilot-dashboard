import { createHash } from 'node:crypto';
import * as XLSX from 'xlsx';
import { parseRupees, parseUnambiguousDate } from './validation';

export type ImportType = 'sales' | 'returns';
export type ImportEvent = { sourceRow: number; identity: string; subOrderNumber: string; date: string; quantity: number; grossInvoicePaise: number; type: ImportType; mappingNeeded: true };
export type Parsed = { sha256: string; rows: number; quantity: number; invoiceTotal: number; dateRange: string | null; events: ImportEvent[]; duplicates: { identity: string; count: number }[]; errors: string[]; preview: ImportEvent[]; filename: string; format: 'xlsx' | 'csv' };

const normalize = (value: string): string => value.trim().toLowerCase().replace(/[\s-]+/g, '_');
const valueFor = (row: Record<string, unknown>, name: string): unknown => row[Object.keys(row).find((key) => normalize(key) === name) ?? ''];
const maxFileBytes = 5 * 1024 * 1024;

export function parseImport(bytes: ArrayBuffer, type: ImportType, filename: string): Parsed {
  if (bytes.byteLength > maxFileBytes) throw new Error('Maximum upload is 5 MiB.');
  const format = /\.xlsx$/i.test(filename) ? 'xlsx' : /\.csv$/i.test(filename) ? 'csv' : null;
  if (!format) throw new Error('Only .xlsx and .csv are supported.');
  const raw = new Uint8Array(bytes);
  if (format === 'xlsx' && !(raw[0] === 0x50 && raw[1] === 0x4b)) throw new Error('Invalid XLSX ZIP signature.');
  const workbook = XLSX.read(bytes, { type: 'array', cellFormula: true });
  if (!workbook.SheetNames.length) throw new Error('Workbook is empty.');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  if (range.e.c + 1 > 50 || range.e.r > 5000) throw new Error('Worksheet exceeds limits.');
  for (const [address, cell] of Object.entries(sheet)) {
    if (address.startsWith('!') || !cell || typeof cell !== 'object') continue;
    const candidate = cell as { f?: unknown; w?: unknown; v?: unknown };
    if (candidate.f !== undefined) throw new Error('Formula cells are not accepted.');
    if (String(candidate.w ?? candidate.v ?? '').length > 4096) throw new Error('A cell exceeds 4096 characters.');
  }
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  if (!rows.length) throw new Error('Spreadsheet has no data rows.');
  const headers = Object.keys(rows[0] ?? {}).map(normalize);
  const duplicateHeader = headers.find((header, index) => headers.indexOf(header) !== index);
  if (duplicateHeader) throw new Error(`Duplicate header: ${duplicateHeader}.`);
  for (const header of ['sub_order_num', 'quantity', 'total_invoice_value', type === 'returns' ? 'cancel_return_date' : 'order_date']) {
    if (!headers.includes(header)) throw new Error(`Missing required header: ${header}.`);
  }

  const errors: string[] = [];
  const events = rows.map((row, index): ImportEvent => {
    const sourceRow = index + 2;
    const subOrderNumber = String(valueFor(row, 'sub_order_num')).trim();
    const date = String(valueFor(row, type === 'returns' ? 'cancel_return_date' : 'order_date')).trim();
    const quantity = Number(valueFor(row, 'quantity'));
    let grossInvoicePaise = 0;
    if (!subOrderNumber || subOrderNumber.length > 128 || /[\u0000-\u001F\u007F]/.test(subOrderNumber)) errors.push(`Row ${sourceRow}: sub_order_num is required.`);
    try { parseUnambiguousDate(date); } catch { errors.push(`Row ${sourceRow}: invalid date.`); }
    if (!Number.isSafeInteger(quantity) || quantity < 1) errors.push(`Row ${sourceRow}: invalid quantity.`);
    try { grossInvoicePaise = parseRupees(String(valueFor(row, 'total_invoice_value')), { allowZero: true }); } catch { errors.push(`Row ${sourceRow}: invalid invoice value.`); }
    return { sourceRow, identity: `tcs:${type}:${subOrderNumber}`, subOrderNumber, date, quantity: Number.isSafeInteger(quantity) && quantity > 0 ? quantity : 0, grossInvoicePaise, type, mappingNeeded: true };
  });
  const counts = new Map<string, number>();
  for (const event of events) counts.set(event.identity, (counts.get(event.identity) ?? 0) + 1);
  const duplicates = [...counts].filter(([, count]) => count > 1).map(([identity, count]) => ({ identity, count }));
  const dates = events.map((event) => event.date).filter(Boolean).sort();
  const quantity = events.reduce((total, event) => total + event.quantity, 0);
  const invoiceTotal = events.reduce((total, event) => total + event.grossInvoicePaise, 0);
  if (!Number.isSafeInteger(quantity) || !Number.isSafeInteger(invoiceTotal)) throw new Error('Import totals exceed supported limits.');
  return { sha256: createHash('sha256').update(Buffer.from(bytes)).digest('hex'), rows: events.length, quantity, invoiceTotal, dateRange: dates.length ? `${dates[0]} – ${dates.at(-1)}` : null, events, duplicates, errors, preview: events, filename: filename.trim().slice(0, 128) || 'upload', format };
}

export const parseWorkbook = (bytes: ArrayBuffer, type: ImportType): Parsed => parseImport(bytes, type, 'upload.xlsx');
export function validateCommit(parsed: Parsed): void {
  if (parsed.duplicates.length) throw new Error('Ambiguous duplicate rows in file.');
  if (parsed.errors.length) throw new Error('Import has validation errors.');
}
