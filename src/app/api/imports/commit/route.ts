import { NextResponse } from 'next/server';
import { commitRequestSchema } from '@/contracts/imports';
import { authenticated, validMutationOrigin } from '@/lib/server/auth';
import { commitImport } from '@/lib/server/import-service';
import { MongoRepository } from '@/lib/server/repository';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!await authenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!validMutationOrigin(request)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  if (!process.env.MONGODB_URI) return NextResponse.json({ error: 'Connect MongoDB to save changes.' }, { status: 503 });
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (Number.isFinite(contentLength) && contentLength > 2 * 1024 * 1024) return NextResponse.json({ error: 'Request is too large.' }, { status: 413 });
  try {
    const body = commitRequestSchema.safeParse(await request.json());
    if (!body.success) return NextResponse.json({ error: 'Invalid commit request.' }, { status: 422 });
    return NextResponse.json(await commitImport(body.data.token, body.data.associations, new MongoRepository(), body.data.acknowledgeUnmappedSales));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Commit failed.';
    const status = /expired/.test(message) ? 410 : /already|duplicate|stale|Insufficient/.test(message) ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
