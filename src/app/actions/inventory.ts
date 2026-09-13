'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { authenticated } from '@/lib/server/auth';
import { integer, optionalSku, parseRupees, text } from '@/lib/domain/validation';
import { repository } from '@/lib/server/repository';

type FormState = { formError?: string; ok?: boolean; fieldErrors?: Record<string, string[] | undefined> };
const formString = (data: FormData, key: string): string => String(data.get(key) ?? '');
const idSchema = z.string().trim().min(1).max(128).refine((value) => !/[\u0000-\u001F\u007F]/.test(value));
async function guard(): Promise<FormState | undefined> { if (!await authenticated()) return { formError: 'Unauthorized' }; }
function failed(error: unknown): FormState { return { formError: error instanceof Error ? error.message : 'Save failed.' }; }
function refreshed(...paths: string[]): void { for (const path of paths) revalidatePath(path); }

export async function manualCorrection(_: FormState, data: FormData): Promise<FormState> {
  const blocked = await guard(); if (blocked) return blocked;
  const parsed = z.object({ id: idSchema, target: z.string(), revision: z.string(), reason: z.string() }).safeParse(Object.fromEntries(data));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try { await repository().manual(parsed.data.id, integer(parsed.data.target, 'Target quantity'), integer(parsed.data.revision, 'Revision', 1), text(parsed.data.reason, 500, 'reason', 3)); refreshed('/products', '/'); return { ok: true }; } catch (error) { return failed(error); }
}
export async function purchaseReceipt(_: FormState, data: FormData): Promise<FormState> {
  const blocked = await guard(); if (blocked) return blocked;
  const parsed = z.object({ id: idSchema, quantity: z.string(), reason: z.string() }).safeParse(Object.fromEntries(data));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try { await repository().purchase(parsed.data.id, integer(parsed.data.quantity, 'Quantity', 1), text(parsed.data.reason, 500, 'reason', 3)); refreshed('/purchases', '/products', '/'); return { ok: true }; } catch (error) { return failed(error); }
}
export async function createProduct(_: FormState, data: FormData): Promise<FormState> {
  const blocked = await guard(); if (blocked) return blocked;
  const parsed = z.object({ id: idSchema, name: z.string(), sku: z.string(), unitCost: z.string(), opening: z.string() }).safeParse(Object.fromEntries(data));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try { await repository().createProduct({ _id: parsed.data.id, name: text(parsed.data.name, 160, 'name'), sku: optionalSku(parsed.data.sku), unitCost: parseRupees(parsed.data.unitCost, { allowZero: true }), available: integer(parsed.data.opening, 'Opening units'), damaged: 0, revision: 1 }); refreshed('/products', '/'); return { ok: true }; } catch (error) { return failed(error); }
}
export async function deleteProduct(_: FormState, data: FormData): Promise<FormState> {
  const blocked = await guard(); if (blocked) return blocked;
  const parsed = z.object({ id: idSchema }).safeParse(Object.fromEntries(data));
  if (!parsed.success) return { formError: 'Invalid product.' };
  try { await repository().deleteProduct(parsed.data.id); refreshed('/products', '/'); return { ok: true }; } catch (error) { return { formError: error instanceof Error ? error.message : 'Delete failed.' }; }
}
export async function addExpense(_: FormState, data: FormData): Promise<FormState> {
  const blocked = await guard(); if (blocked) return blocked;
  try { await repository().expense(parseRupees(formString(data, 'amount')), text(formString(data, 'note'), 1000, 'note')); refreshed('/expenses', '/'); return { ok: true }; } catch (error) { return failed(error); }
}
export async function completeQc(_: FormState, data: FormData): Promise<FormState> {
  const blocked = await guard(); if (blocked) return blocked;
  const parsed = z.object({ id: idSchema, returnId: idSchema, quantity: z.string(), good: z.string(), damaged: z.string() }).safeParse(Object.fromEntries(data));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try { const quantity = integer(parsed.data.quantity, 'Imported quantity', 1); const good = integer(parsed.data.good, 'Good units'); const damaged = integer(parsed.data.damaged, 'Damaged units'); if (good + damaged !== quantity) return { formError: 'Good and damaged quantities must equal the imported return quantity.' }; await repository().returnQc(parsed.data.id, parsed.data.returnId, quantity, good, damaged); refreshed('/returns', '/products', '/'); return { ok: true }; } catch (error) { return failed(error); }
}
