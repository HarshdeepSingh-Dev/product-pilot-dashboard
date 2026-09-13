'use client';

import { useActionState, useEffect, useState, type ReactNode } from 'react';
import { createProduct, deleteProduct, manualCorrection } from '@/app/actions/inventory';

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
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open]);
  return <>
    <button type="button" className="btn" disabled={disabled} onClick={() => setOpen(true)}>Add new product</button>
    {open && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="create-product-title">
        <div className="flex items-start justify-between gap-4"><div><h2 id="create-product-title" className="text-xl font-bold">Create product</h2><p className="mt-1 text-sm text-slate-600">Add a product and its opening stock.</p></div><button type="button" className="modal-close" onClick={() => setOpen(false)} aria-label="Close create product dialog">×</button></div>
        <div className="mt-4"><Form action={createProduct} disabled={disabled}><fieldset><label className="block font-medium">Name<input className="input mt-1" name="name" required /></label><label className="mt-3 block font-medium">Product ID<input className="input mt-1" name="id" required /></label><label className="mt-3 block font-medium">SKU<input className="input mt-1" name="sku" /></label><label className="mt-3 block font-medium">Unit cost (rupees)<input className="input mt-1" name="unitCost" type="number" min="0" step="0.01" required /></label><label className="mt-3 block font-medium">Opening units<input className="input mt-1" name="opening" type="number" min="0" required /></label></fieldset></Form></div>
      </div>
    </div>}
  </>;
}

export function Correction({ id, revision, disabled }: { id: string; revision: number; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className="menu-item" onClick={() => setOpen(true)}>Edit stock</button>
    {open && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={`correction-title-${id}`}>
        <div className="flex items-start justify-between gap-4"><div><h2 id={`correction-title-${id}`} className="text-xl font-bold">Correct stock</h2><p className="mt-1 text-sm text-slate-600">Update the available quantity and record the reason.</p></div><button type="button" className="modal-close" onClick={() => setOpen(false)} aria-label="Close stock correction dialog">×</button></div>
        <div className="mt-4"><Form action={manualCorrection} disabled={disabled}><fieldset><input type="hidden" name="id" value={id} /><input type="hidden" name="revision" value={revision} /><label className="block font-medium">Target quantity<input className="input mt-1" name="target" type="number" min="0" required /></label><label className="mt-3 block font-medium">Reason<input className="input mt-1" name="reason" minLength={3} required /></label></fieldset></Form></div>
      </div>
    </div>}
  </>;
}

export function ProductMenu({ id, revision, disabled }: { id: string; revision: number; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const deleteAction: Action = async (state, data) => deleteProduct(state, data);
  const [state, submit, pending] = useActionState(deleteAction, {} as FormState);
  return <div className="relative">
    <button type="button" className="icon-button" aria-label="Product actions" aria-expanded={open} onClick={() => setOpen((value) => !value)}>⋯</button>
    {open && <div className="product-menu" role="menu"><Correction id={id} revision={revision} disabled={disabled} /><form action={submit}><input type="hidden" name="id" value={id} /><button type="submit" className="menu-item menu-danger" disabled={disabled || pending} onClick={(event) => { if (!window.confirm('Delete this product? This cannot be undone.')) event.preventDefault(); }}>{pending ? 'Deleting…' : 'Delete product'}</button></form>{state.formError && <p role="alert" className="menu-error">{state.formError}</p>}</div>}
  </div>;
}
