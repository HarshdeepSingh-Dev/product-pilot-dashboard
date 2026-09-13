import 'server-only';

import { randomBytes } from 'node:crypto';
import { parseImport, validateCommit } from '@/lib/domain/import-parser';
import type { InventoryRepository } from './repository';

type Cached = { bytes: ArrayBuffer; type: 'sales' | 'returns'; filename: string; hash: string; expires: number; committing: boolean };
const previews = new Map<string, Cached>();
const MAX_PREVIEWS = 32;
const MAX_BYTES = 40 * 1024 * 1024;
const EXPIRY_MS = 10 * 60_000;

function totalBytes(): number { return [...previews.values()].reduce((total, item) => total + item.bytes.byteLength, 0); }
function purge(): void { const now = Date.now(); for (const [token, item] of previews) if (item.expires <= now && !item.committing) previews.delete(token); }

export function previewImport(bytes: ArrayBuffer, type: 'sales' | 'returns', filename = 'upload.xlsx') {
  purge();
  if (previews.size >= MAX_PREVIEWS || totalBytes() + bytes.byteLength > MAX_BYTES) throw new Error('Too many active previews. Wait for one to expire.');
  const parsed = parseImport(bytes, type, filename);
  const token = randomBytes(24).toString('base64url');
  previews.set(token, { bytes: bytes.slice(0), type, filename, hash: parsed.sha256, expires: Date.now() + EXPIRY_MS, committing: false });
  return { token, parsed };
}

export async function commitImport(token: string, associations: Record<string, string>, repo: InventoryRepository, acknowledgeUnmappedSales = false) {
  purge();
  const cached = previews.get(token);
  if (!cached || cached.expires <= Date.now()) { previews.delete(token); throw new Error('Preview expired. Upload again.'); }
  if (cached.committing) throw new Error('This preview is already being committed.');
  cached.committing = true;
  try {
    const parsed = parseImport(cached.bytes, cached.type, cached.filename);
    if (parsed.sha256 !== cached.hash) throw new Error('Preview content mismatch.');
    validateCommit(parsed);
    const identities = new Set(parsed.events.map((event) => event.identity));
    for (const [identity, productId] of Object.entries(associations)) {
      if (!identities.has(identity) || !productId.trim()) throw new Error('Invalid product association.');
    }
    const unmappedSales = parsed.events.filter((event) => event.type === 'sales' && !associations[event.identity]);
    if (unmappedSales.length && !acknowledgeUnmappedSales) throw new Error('Acknowledge unmapped sales before commit.');
    await repo.commitImport(parsed, associations);
    previews.delete(token);
    return { events: parsed.rows, mapped: Object.keys(associations).length };
  } catch (error) {
    cached.committing = false;
    throw error;
  }
}
