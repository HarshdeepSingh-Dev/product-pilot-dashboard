'use client';

import { useActionState, useState } from 'react';
import { addExpense, completeQc, purchaseReceipt } from '@/app/actions/inventory';

type ProductOption = { id: string; name: string };
type ReturnOption = { returnId: string; productId: string; quantity: number };
type FormState = { formError?: string; ok?: boolean; fieldErrors?: Record<string, string[] | undefined> };
type Action = (state: FormState, data: FormData) => Promise<FormState>;
type OperationFormProps = { disabled: boolean } & ({ kind: 'purchase'; products: ProductOption[] } | { kind: 'expense' } | { kind: 'qc'; products: ProductOption[]; pendingReturns: ReturnOption[] });

export function OperationForm(props: OperationFormProps) {
  const action: Action = props.kind === 'purchase' ? purchaseReceipt : props.kind === 'expense' ? addExpense : completeQc;
  const [state, submit, pending] = useActionState(action, {} as FormState);
  const [returnId, setReturnId] = useState('');
  const [productId, setProductId] = useState('');
  const selected = props.kind === 'qc' ? props.pendingReturns.find((item) => item.returnId === returnId) : undefined;
  const title = props.kind === 'purchase' ? 'Record receipt' : props.kind === 'expense' ? 'Add expense' : 'Complete return QC';
  const error = (name: string) => state.fieldErrors?.[name]?.[0];
  return <form action={submit} className="card space-y-4" aria-busy={pending}>
    <h2 className="text-xl font-bold">{title}</h2>
    {state.formError && <div role="alert" className="rounded-md bg-red-50 p-3 text-red-800">{state.formError}</div>}
    {state.ok && <p role="status" className="text-green-700">Saved successfully.</p>}
    <fieldset disabled={props.disabled || pending} className="space-y-3"><legend className="sr-only">{title} details</legend>
      {props.kind === 'expense' ? <><label className="block font-medium" htmlFor="expense-amount">Amount (rupees)<input id="expense-amount" className="input mt-1" name="amount" inputMode="decimal" pattern="\d+(\.\d{1,2})?" required aria-invalid={Boolean(error('amount'))} aria-describedby="amount-help" /></label><p id="amount-help" className="text-sm text-slate-600">Examples: 1, 1.20, or .01. Stored as paise after validation.</p><label className="block font-medium" htmlFor="expense-note">Note<input id="expense-note" className="input mt-1" name="note" required aria-invalid={Boolean(error('note'))} /></label></> : <>
        {props.kind === 'qc' && <><label className="block font-medium" htmlFor="qc-return">Pending return<select id="qc-return" className="input mt-1" name="returnId" required value={returnId} onChange={(event) => { setReturnId(event.target.value); const next = props.pendingReturns.find((item) => item.returnId === event.target.value); setProductId(next?.productId ?? ''); }}><option value="" disabled>Select a pending return</option>{props.pendingReturns.map((item) => <option key={item.returnId} value={item.returnId}>{item.returnId} ({item.quantity} units)</option>)}</select></label>{selected && <p className="text-sm text-slate-600">Imported quantity: <strong>{selected.quantity}</strong>. This value is fixed by the return event.</p>}</>}
        <label className="block font-medium" htmlFor={`${props.kind}-product`}>Product<select id={`${props.kind}-product`} className="input mt-1" name="id" required value={productId} disabled={props.kind === 'qc' && Boolean(selected?.productId)} onChange={(event) => setProductId(event.target.value)}><option value="" disabled>Select a product</option>{props.products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
        {props.kind === 'qc' && selected?.productId && <input type="hidden" name="id" value={selected.productId} />}
        <label className="block font-medium" htmlFor={`${props.kind}-quantity`}>Quantity<input id={`${props.kind}-quantity`} className="input mt-1" name="quantity" type="number" min="1" required readOnly={props.kind === 'qc' && Boolean(selected)} value={props.kind === 'qc' && selected ? selected.quantity : undefined} /></label>
        {props.kind === 'qc' && <><label className="block font-medium" htmlFor="qc-good">Good units<input id="qc-good" className="input mt-1" name="good" type="number" min="0" required /></label><label className="block font-medium" htmlFor="qc-damaged">Damaged units<input id="qc-damaged" className="input mt-1" name="damaged" type="number" min="0" required /></label></>}
        {props.kind === 'purchase' && <label className="block font-medium" htmlFor="purchase-reason">Reason<input id="purchase-reason" className="input mt-1" name="reason" minLength={3} required /></label>}
      </>}
      <button className="btn" disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>
    </fieldset>
    {props.disabled && <p role="status" className="text-slate-600">Connect MongoDB to save changes.</p>}
  </form>;
}
