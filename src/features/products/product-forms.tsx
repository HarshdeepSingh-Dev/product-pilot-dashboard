"use client";

import { useActionState, useState, type ReactNode } from "react";
import { CheckCircle2, LoaderCircle, MoreHorizontal, PackagePlus, PencilLine, Trash2 } from "lucide-react";

import { createProduct, deleteProduct, manualCorrection } from "@/app/actions/inventory";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormState = {
  formError?: string;
  ok?: boolean;
  fieldErrors?: Record<string, string[] | undefined>;
};
type Action = (state: FormState, formData: FormData) => Promise<FormState>;

function ActionForm({
  action,
  children,
  disabled,
  submitLabel = "Save changes",
}: {
  action: Action;
  children: ReactNode;
  disabled: boolean;
  submitLabel?: string;
}) {
  const [state, submit, pending] = useActionState(action, {} as FormState);

  return (
    <form action={submit} className="space-y-5" aria-busy={pending}>
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
      <fieldset disabled={disabled || pending} className="space-y-4">
        {children}
        <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
          {pending && <LoaderCircle className="animate-spin" data-icon="inline-start" />}
          {pending ? "Saving…" : submitLabel}
        </Button>
      </fieldset>
      {disabled && (
        <p role="status" className="text-sm text-muted-foreground">
          Connect MongoDB to save changes.
        </p>
      )}
    </form>
  );
}

function FormField({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

export function CreateProduct({ disabled }: { disabled: boolean }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button disabled={disabled}>
          <PackagePlus data-icon="inline-start" />
          Add product
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create product</DialogTitle>
          <DialogDescription>Add a catalog item and set its opening stock balance.</DialogDescription>
        </DialogHeader>
        <ActionForm action={createProduct} disabled={disabled} submitLabel="Create product">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Product name" htmlFor="product-name">
              <Input id="product-name" name="name" placeholder="e.g. Matte Lipstick" required />
            </FormField>
            <FormField label="Product ID" htmlFor="product-id">
              <Input id="product-id" name="id" placeholder="e.g. LIP-ROSE" required />
            </FormField>
          </div>
          <FormField label="SKU (optional)" htmlFor="product-sku">
            <Input id="product-sku" name="sku" placeholder="e.g. LIP-ROSE-01" />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Unit cost (₹)" htmlFor="product-cost">
              <Input id="product-cost" name="unitCost" type="number" min="0" step="0.01" placeholder="0.00" required />
            </FormField>
            <FormField label="Opening units" htmlFor="product-opening">
              <Input id="product-opening" name="opening" type="number" min="0" placeholder="0" required />
            </FormField>
          </div>
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}

function StockCorrectionDialog({
  id,
  revision,
  disabled,
  open,
  onOpenChange,
}: {
  id: string;
  revision: number;
  disabled: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Correct stock</DialogTitle>
          <DialogDescription>Set the available quantity and leave an audit reason.</DialogDescription>
        </DialogHeader>
        <ActionForm action={manualCorrection} disabled={disabled}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="revision" value={revision} />
          <FormField label="Target quantity" htmlFor={`target-${id}`}>
            <Input id={`target-${id}`} name="target" type="number" min="0" required />
          </FormField>
          <FormField label="Reason" htmlFor={`reason-${id}`}>
            <Input id={`reason-${id}`} name="reason" minLength={3} placeholder="Why is this correction needed?" required />
          </FormField>
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}

export function ProductMenu({ id, revision, disabled }: { id: string; revision: number; disabled: boolean }) {
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteAction: Action = async (state, data) => deleteProduct(state, data);
  const [state, submit, pending] = useActionState(deleteAction, {} as FormState);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Product actions">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Product actions</DropdownMenuLabel>
          <DropdownMenuItem disabled={disabled} onSelect={() => setCorrectionOpen(true)}>
            <PencilLine />
            Edit stock
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" disabled={disabled} onSelect={() => setDeleteOpen(true)}>
            <Trash2 />
            Delete product
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <StockCorrectionDialog
        id={id}
        revision={revision}
        disabled={disabled}
        open={correctionOpen}
        onOpenChange={setCorrectionOpen}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-red-50 text-destructive">
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the product. Products referenced by inventory events cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {state.formError && (
            <Alert variant="destructive">
              <AlertDescription>{state.formError}</AlertDescription>
            </Alert>
          )}
          <form action={submit}>
            <input type="hidden" name="id" value={id} />
            <AlertDialogFooter>
              <AlertDialogCancel type="button" disabled={pending}>Cancel</AlertDialogCancel>
              <Button type="submit" variant="destructive" disabled={pending}>
                {pending && <LoaderCircle className="animate-spin" data-icon="inline-start" />}
                {pending ? "Deleting…" : "Delete product"}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
