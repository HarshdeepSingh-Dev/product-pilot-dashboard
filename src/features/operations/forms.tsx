"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, ClipboardCheck, LoaderCircle, ReceiptText, Truck } from "lucide-react";

import { addExpense, completeQc, purchaseReceipt } from "@/app/actions/inventory";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ProductOption = { id: string; name: string };
type ReturnOption = { returnId: string; productId: string; quantity: number };
type FormState = { formError?: string; ok?: boolean; fieldErrors?: Record<string, string[] | undefined> };
type Action = (state: FormState, data: FormData) => Promise<FormState>;
type OperationFormProps = { disabled: boolean } & (
  | { kind: "purchase"; products: ProductOption[] }
  | { kind: "expense" }
  | { kind: "qc"; products: ProductOption[]; pendingReturns: ReturnOption[] }
);

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs text-destructive">{message}</p> : null;
}

export function OperationForm(props: OperationFormProps) {
  const action: Action = props.kind === "purchase" ? purchaseReceipt : props.kind === "expense" ? addExpense : completeQc;
  const [state, submit, pending] = useActionState(action, {} as FormState);
  const [returnId, setReturnId] = useState("");
  const [productId, setProductId] = useState("");
  const selected = props.kind === "qc" ? props.pendingReturns.find((item) => item.returnId === returnId) : undefined;
  const disabled = props.disabled || pending;
  const config = props.kind === "purchase"
    ? { title: "Record receipt", description: "Add incoming units to available stock.", icon: Truck }
    : props.kind === "expense"
      ? { title: "Add expense", description: "Record an operational cost in rupees.", icon: ReceiptText }
      : { title: "Complete return QC", description: "Split returned units into good and damaged stock.", icon: ClipboardCheck };
  const Icon = config.icon;
  const error = (name: string) => state.fieldErrors?.[name]?.[0];

  return (
    <form action={submit} aria-busy={pending}>
      <Card className="shadow-sm shadow-slate-200/40">
        <CardHeader className="border-b">
          <div className="mb-2 grid size-10 place-items-center rounded-xl bg-indigo-50 text-primary">
            <Icon className="size-5" />
          </div>
          <CardTitle>{config.title}</CardTitle>
          <CardDescription>{config.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state.formError && (
            <Alert variant="destructive">
              <AlertDescription>{state.formError}</AlertDescription>
            </Alert>
          )}
          {state.ok && (
            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
              <CheckCircle2 />
              <AlertDescription className="text-emerald-700">Saved successfully.</AlertDescription>
            </Alert>
          )}

          <fieldset disabled={disabled} className="space-y-4">
            <legend className="sr-only">{config.title} details</legend>
            {props.kind === "expense" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="expense-amount">Amount (₹)</Label>
                  <Input
                    id="expense-amount"
                    name="amount"
                    inputMode="decimal"
                    pattern="\d+(\.\d{1,2})?"
                    placeholder="0.00"
                    required
                    aria-invalid={Boolean(error("amount"))}
                    aria-describedby="amount-help"
                  />
                  <p id="amount-help" className="text-xs text-muted-foreground">
                    Use up to two decimal places. The value is stored securely as paise.
                  </p>
                  <FieldError message={error("amount")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-note">Note</Label>
                  <Input id="expense-note" name="note" placeholder="What was this expense for?" required aria-invalid={Boolean(error("note"))} />
                  <FieldError message={error("note")} />
                </div>
              </>
            ) : (
              <>
                {props.kind === "qc" && (
                  <div className="space-y-2">
                    <Label htmlFor="qc-return">Pending return</Label>
                    <Select
                      name="returnId"
                      value={returnId}
                      onValueChange={(value) => {
                        setReturnId(value);
                        const next = props.pendingReturns.find((item) => item.returnId === value);
                        setProductId(next?.productId ?? "");
                      }}
                      disabled={disabled}
                      required
                    >
                      <SelectTrigger id="qc-return" className="w-full">
                        <SelectValue placeholder="Select a pending return" />
                      </SelectTrigger>
                      <SelectContent>
                        {props.pendingReturns.map((item) => (
                          <SelectItem key={item.returnId} value={item.returnId}>
                            {item.returnId} · {item.quantity} units
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selected && (
                      <p className="text-xs text-muted-foreground">
                        Imported quantity: <strong className="text-foreground">{selected.quantity}</strong>. This value is fixed by the return event.
                      </p>
                    )}
                    <FieldError message={error("returnId")} />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor={`${props.kind}-product`}>Product</Label>
                  <Select
                    name="id"
                    value={productId}
                    onValueChange={setProductId}
                    disabled={disabled || (props.kind === "qc" && Boolean(selected?.productId))}
                    required
                  >
                    <SelectTrigger id={`${props.kind}-product`} className="w-full">
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {props.products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError message={error("id")} />
                </div>
                {props.kind === "qc" && selected?.productId && <input type="hidden" name="id" value={selected.productId} />}

                <div className="space-y-2">
                  <Label htmlFor={`${props.kind}-quantity`}>Quantity</Label>
                  <Input
                    id={`${props.kind}-quantity`}
                    name="quantity"
                    type="number"
                    min="1"
                    required
                    readOnly={props.kind === "qc" && Boolean(selected)}
                    value={props.kind === "qc" && selected ? selected.quantity : undefined}
                    placeholder="0"
                    aria-invalid={Boolean(error("quantity"))}
                  />
                  <FieldError message={error("quantity")} />
                </div>

                {props.kind === "qc" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="qc-good">Good units</Label>
                      <Input id="qc-good" name="good" type="number" min="0" placeholder="0" required aria-invalid={Boolean(error("good"))} />
                      <FieldError message={error("good")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="qc-damaged">Damaged units</Label>
                      <Input id="qc-damaged" name="damaged" type="number" min="0" placeholder="0" required aria-invalid={Boolean(error("damaged"))} />
                      <FieldError message={error("damaged")} />
                    </div>
                  </div>
                )}

                {props.kind === "purchase" && (
                  <div className="space-y-2">
                    <Label htmlFor="purchase-reason">Reason</Label>
                    <Input id="purchase-reason" name="reason" minLength={3} placeholder="e.g. Supplier delivery" required aria-invalid={Boolean(error("reason"))} />
                    <FieldError message={error("reason")} />
                  </div>
                )}
              </>
            )}
          </fieldset>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button type="submit" disabled={disabled}>
            {pending && <LoaderCircle className="animate-spin" data-icon="inline-start" />}
            {pending ? "Saving…" : "Save record"}
          </Button>
          {props.disabled && <p role="status" className="text-xs text-muted-foreground">Connect MongoDB to save changes.</p>}
        </CardFooter>
      </Card>
    </form>
  );
}
