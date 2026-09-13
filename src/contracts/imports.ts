import { z } from 'zod';

export const importTypeSchema = z.enum(['sales', 'returns']);
export const importRowSchema = z.object({
  sourceRow: z.number().int().positive(), identity: z.string().min(1).max(128), subOrderNumber: z.string().min(1).max(128),
  date: z.string().nullable().optional(), quantity: z.number().int().nonnegative(), grossInvoicePaise: z.number().int().nonnegative(),
  type: importTypeSchema, mappingNeeded: z.literal(true),
});
export const duplicateSchema = z.object({ identity: z.string().min(1), count: z.number().int().min(2) });
export const previewResponseSchema = z.object({
  token: z.string().min(32), hash: z.string().regex(/^[a-f0-9]{64}$/), filename: z.string().min(1).max(128), format: z.enum(['xlsx', 'csv']),
  rows: z.number().int().nonnegative(), totalQuantity: z.number().int().nonnegative(), grossInvoicePaise: z.number().int().nonnegative(),
  dateRange: z.string().nullable(), duplicates: z.array(duplicateSchema), errors: z.array(z.string()), previewRows: z.array(importRowSchema), mapped: z.number().int().nonnegative(), unmapped: z.number().int().nonnegative(),
});
export const commitRequestSchema = z.object({ token: z.string().min(32), associations: z.record(z.string().min(1).max(128), z.string().min(1).max(128)), acknowledgeUnmappedSales: z.boolean().optional() });
export const commitResponseSchema = z.object({ events: z.number().int().nonnegative(), mapped: z.number().int().nonnegative() });
export const errorResponseSchema = z.object({ error: z.string().min(1), correlationId: z.string().optional() });
export type PreviewResponse = z.infer<typeof previewResponseSchema>;
export type CommitRequest = z.infer<typeof commitRequestSchema>;
export type CommitResponse = z.infer<typeof commitResponseSchema>;
