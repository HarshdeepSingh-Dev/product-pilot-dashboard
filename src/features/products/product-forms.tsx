'use client';

import { useActionState, type ReactNode } from 'react';
import { createProduct, manualCorrection } from '@/app/actions/inventory';

type FormState = { formError?: string; ok?: boolean; fieldErrors?: Record<string, string[] | undefined> };
type Action = (state: FormState, formData: FormData) => Promise<FormState>;

function Form({ action, children, disabled }: { action: Action; children: ReactNode; disabled: boolean }) {
  const [state, submit, pending] = useActionState(action, {} as FormState);
  return <form action={submit} className="card space-y-3" aria-busy={pending}>
    {state.formError && <div role="alert" className="rounded-md bg-red-50 p-3 text-red-800">{state.formError}</div>}
    {state.ok && <p role="status" className="text-green-700">Saved successfully.</p>}
    <fieldset disabled={disabled || pending} className="space-y-3">{children}<button className="btn" disabled={pending}>{pending ? 'Saving…' : 'Save'}</button></fieldset>
    {disabled && <p role="status" className="text-slate-600">Connect MongoDB to save changes.</p>}
  </form>;
}

export function CreateProduct({ disabled }: { disabled: boolean }) {
  return <Form action={createProduct} disabled={disabled}><fieldset><legend className="text-xl font-bold">Create product</legend><label className="mt-3 block font-medium">Name<input className="input mt-1" name="name" required /></label><label className="mt-3 block font-medium">Product ID<input className="input mt-1" name="id" required /></label><label className="mt-3 block font-medium">SKU<input className="input mt-1" name="sku" /></label><label className="mt-3 block font-medium">Unit cost (paise)<input className="input mt-1" name="unitCost" type="number" min="0" required /></label><label className="mt-3 block font-medium">Opening units<input className="input mt-1" name="opening" type="number" min="0" required /></label></fieldset></Form>;
}

export function Correction({ id, revision, disabled }: { id: string; revision: number; disabled: boolean }) {
  return <Form action={manualCorrection} disabled={disabled}><fieldset><legend className="sr-only">Correct stock for {id}</legend><input type="hidden" name="id" value={id} /><input type="hidden" name="revision" value={revision} /><label className="block font-medium">Target quantity<input className="input mt-1" name="target" type="number" min="0" required /></label><label className="mt-3 block font-medium">Reason<input className="input mt-1" name="reason" minLength={3} required /></label></fieldset></Form>;
}
