import { z } from 'zod';

export const quantity = z.number().int().nonnegative().safe();
export const positiveQuantity = z.number().int().positive().safe();
export const paise = z.number().int().nonnegative().safe();

const controls = /[\u0000-\u001F\u007F]/;
export function text(value: string, max: number, label: string, min = 1): string {
  const normalized = value.trim();
  if (normalized.length < min || normalized.length > max || controls.test(normalized)) throw new Error(`Invalid ${label}.`);
  return normalized;
}
export function optionalSku(value: string): string | undefined {
  const normalized = value.trim();
  return normalized ? text(normalized, 128, 'SKU') : undefined;
}
export function integer(value: string, label: string, minimum = 0): number {
  if (!/^\d+$/.test(value)) throw new Error(`${label} must be a whole number.`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum) throw new Error(`Invalid ${label}.`);
  return parsed;
}
/** Converts a human-entered rupee amount to paise without floating-point rounding. */
export function parseRupees(value: string, { allowZero = false }: { allowZero?: boolean } = {}): number {
  const normalized = value.trim();
  const match = /^(?:(\d+)(?:\.(\d{1,2}))?|\.(\d{1,2}))$/.exec(normalized);
  if (!match) throw new Error('Enter an amount with at most two decimal places.');
  const rupees = Number(match[1]);
  const fraction = Number((match[2] ?? match[3] ?? '').padEnd(2, '0') || '0');
  if (!Number.isSafeInteger(rupees) || rupees > Math.floor((Number.MAX_SAFE_INTEGER - fraction) / 100)) throw new Error('Amount is too large.');
  const result = rupees * 100 + fraction;
  if (!allowZero && result < 1) throw new Error('Amount must be greater than zero.');
  return result;
}
export function formatRupees(value: number): string {
  if (!Number.isSafeInteger(value) || value < 0) return 'Unavailable';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(value / 100);
}
export function parseUnambiguousDate(value: string | Date): Date {
  if (value instanceof Date) {
    if (!Number.isNaN(value.valueOf())) return value;
    throw new Error('Invalid date.');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Use ISO YYYY-MM-DD dates.');
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) throw new Error('Invalid date.');
  return date;
}
