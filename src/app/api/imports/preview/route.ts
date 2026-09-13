import { NextResponse } from 'next/server';
import { authenticated, validMutationOrigin } from '@/lib/server/auth';
import { previewImport } from '@/lib/server/import-service';

export const runtime = 'nodejs';
const maxUploadBytes = 6 * 1024 * 1024;

export async function POST(request: Request) {
  if (!await authenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!validMutationOrigin(request)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (Number.isFinite(contentLength) && contentLength > maxUploadBytes) return NextResponse.json({ error: 'Upload is too large.' }, { status: 413 });
  try {
    const form = await request.formData();
    const file = form.get('file');
    const type = form.get('type');
    if (!(file instanceof File) || (type !== 'sales' && type !== 'returns')) return NextResponse.json({ error: 'Choose a file and event type.' }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Maximum upload is 5 MiB.' }, { status: 413 });
    const { token, parsed } = previewImport(await file.arrayBuffer(), type, file.name);
    return NextResponse.json({ token, hash: parsed.sha256, filename: parsed.filename, format: parsed.format, rows: parsed.rows, totalQuantity: parsed.quantity, grossInvoicePaise: parsed.invoiceTotal, dateRange: parsed.dateRange, duplicates: parsed.duplicates, errors: parsed.errors, previewRows: parsed.preview, mapped: 0, unmapped: parsed.rows });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Preview failed.' }, { status: 400 }); }
}
