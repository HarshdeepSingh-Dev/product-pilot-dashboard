import { NextResponse } from 'next/server';
import { authenticated } from '@/lib/server/auth';
import { previewImport } from '@/lib/server/import-service';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!await authenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  const form = await request.formData();
  const file = form.get('file');
  const type = form.get('type');
  if (!(file instanceof File) || (type !== 'sales' && type !== 'returns')) return NextResponse.json({ error: 'Choose a file and event type.' }, { status: 400 });
  try {
    const { token, parsed } = previewImport(await file.arrayBuffer(), type, file.name);
    return NextResponse.json({ token, hash: parsed.sha256, rows: parsed.rows, totalQuantity: parsed.quantity, grossInvoicePaise: parsed.invoiceTotal, dateRange: parsed.dateRange, duplicates: parsed.duplicates, errors: parsed.errors, previewRows: parsed.preview, mapped: 0, unmapped: parsed.rows });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Preview failed.' }, { status: 400 }); }
}
