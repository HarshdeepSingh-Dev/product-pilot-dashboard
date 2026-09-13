'use client';

import { useActionState } from 'react';
import { addExpense, completeQc, purchaseReceipt } from '@/app/actions/inventory';

type ProductOption = { id: string; name: string };
type ReturnOption = { returnId: string; productId: string; quantity: number };
type FormState = { formError?: string; ok?: boolean; fieldErrors?: Record<string, string[] | undefined> };
type OperationFormProps = { disabled: boolean } & (
  | { kind: 'purchase'; products: ProductOption[] }
  | { kind: 'expense' }
  | { kind: 'qc'; products: ProductOption[]; pendingReturns: ReturnOption[] }
);

export function OperationForm(props: OperationFormProps) {
  const action = props.kind === 'purchase' ? purchaseReceipt : props.kind === 'expense' ? addExpense : completeQc;
  const [state, submit, pending] = useActionState(action as (state: FormState, data: FormData) => Promise<FormState>, {} as FormState);
  const title = props.kind === 'purchase' ? 'Record receipt' : props.kind === 'expense' ? 'Add expense' : 'Complete return QC';
  return <form action={submit} className="card space-y-4" aria-busy={pending}>
    <h2 className="text-xl font-bold">{title}</h2>
    {state.formError && <div role="alert" className="rounded-md bg-red-50 p-3 text-red-800">{state.formError}</div>}
    {state.ok && <p role="status" className="text-green-700">Saved successfully.</p>}
    <fieldset disabled={props.disabled || pending} className="space-y-3">
      <legend className="sr-only">{title} details</legend>
      {props.kind === 'expense' ? <>
        <label className="block font-medium">Amount (rupees)<input className="input mt-1" name="amount" type="number" min="0.01" step="0.01" required aria-describedby="amount-help" /></label>
        <p id="amount-help" className="text-sm text-slate-600">Stored as paise after validation.</p>
        <label className="block font-medium">Note<input className="input mt-1" name="note" required /></label>
      </> : <>
        {props.kind === 'qc' && <label className="block font-medium">Pending return<select className="input mt-1" name="returnId" required defaultValue=""><option value="" disabled>Select a pending return</option>{props.pendingReturns.map((item) => <option key={item.returnId} value={item.returnId}>{item.returnId} ({item.quantity} units)</option>)}</select></label>}
        <label className="block font-medium">Product<select className="input mt-1" name="id" required defaultValue=""><option value="" disabled>Select a product</option>{props.products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
        <label className="block font-medium">Quantity<input className="input mt-1" name="quantity" type="number" min="1" required /></label>
        {props.kind === 'qc' && <><label className="block font-medium">Good units<input className="input mt-1" name="good" type="number" min="0" required /></label><label className="block font-medium">Damaged units<input className="input mt-1" name="damaged" type="number" min="0" required /></label></>}
        {props.kind === 'purchase' && <label className="block font-medium">Reason<input className="input mt-1" name="reason" minLength={3} required /></label>}
      </>}
      <button className="btn" disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>
    </fieldset>
    {props.disabled && <p role="status" className="text-slate-600">Connect MongoDB to save changes.</p>}
  </form>;
}
