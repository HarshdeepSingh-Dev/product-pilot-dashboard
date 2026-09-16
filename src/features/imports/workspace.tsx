"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  LoaderCircle,
  UploadCloud,
} from "lucide-react";

import { PageHeader } from "@/components/dashboard-ui";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CommitResponse, PreviewResponse } from "@/contracts/imports";

type Product = { id: string; name: string };
type ApiError = { error?: string };
const pageSize = 50;
const unmappedValue = "__unmapped__";

export default function ImportWorkspace({ connected, products }: { connected: boolean; products: Product[] }) {
  const [preview, setPreview] = useState<PreviewResponse>();
  const [type, setType] = useState<"sales" | "returns">("sales");
  const [status, setStatus] = useState("");
  const [statusKind, setStatusKind] = useState<"success" | "error">("success");
  const [loading, setLoading] = useState(false);
  const [associations, setAssociations] = useState<Record<string, string>>({});
  const [acknowledgeUnmappedSales, setAcknowledgeUnmappedSales] = useState(false);
  const [page, setPage] = useState(0);
  const abort = useRef<AbortController | undefined>(undefined);

  const rows = preview?.previewRows.slice(page * pageSize, (page + 1) * pageSize) ?? [];
  const mapped = useMemo(() => Object.values(associations).filter(Boolean).length, [associations]);
  const unmappedSales = preview?.previewRows.filter((row) => row.type === "sales" && !associations[row.identity]).length ?? 0;
  const valid = Boolean(
    connected &&
    preview?.token &&
    !preview.errors.length &&
    !preview.duplicates.length &&
    (!unmappedSales || acknowledgeUnmappedSales),
  );

  function resetPreview(): void {
    abort.current?.abort();
    setPreview(undefined);
    setAssociations({});
    setAcknowledgeUnmappedSales(false);
    setPage(0);
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetPreview();
    setLoading(true);
    setStatus("");
    const controller = new AbortController();
    abort.current = controller;
    try {
      const data = new FormData(event.currentTarget);
      data.set("type", type);
      const response = await fetch("/api/imports/preview", { method: "POST", body: data, signal: controller.signal });
      const result = await response.json() as PreviewResponse | ApiError;
      if (!response.ok) {
        setStatusKind("error");
        setStatus((result as ApiError).error ?? "Preview failed.");
        return;
      }
      setPreview(result as PreviewResponse);
      setStatusKind("success");
      setStatus("Preview ready. Review the rows and mappings before committing.");
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setStatusKind("error");
        setStatus("Preview failed. Try again.");
      }
    } finally {
      if (abort.current === controller) setLoading(false);
    }
  }

  async function commit() {
    if (!preview) return;
    setLoading(true);
    setStatus("");
    try {
      const response = await fetch("/api/imports/commit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: preview.token, associations, acknowledgeUnmappedSales }),
      });
      const result = await response.json() as CommitResponse | ApiError;
      if (!response.ok) {
        setStatusKind("error");
        setStatus((result as ApiError).error ?? "Commit failed.");
        return;
      }
      setStatusKind("success");
      setStatus(`Import complete: ${(result as CommitResponse).events} events recorded.`);
      resetPreview();
    } catch {
      setStatusKind("error");
      setStatus("Commit failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const pages = preview ? Math.ceil(preview.previewRows.length / pageSize) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Data intake"
        title="Imports"
        description="Upload a spreadsheet, validate its rows, map products, and commit audited events."
      />

      <Card className="shadow-sm shadow-slate-200/40">
        <CardHeader className="border-b">
          <div className="mb-2 grid size-10 place-items-center rounded-xl bg-indigo-50 text-primary">
            <UploadCloud className="size-5" />
          </div>
          <CardTitle>Upload spreadsheet</CardTitle>
          <CardDescription>Accepted formats: XLSX and CSV.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={upload} className="grid gap-5 lg:grid-cols-[minmax(280px,0.65fr)_minmax(0,1fr)_auto] lg:items-end" aria-busy={loading}>
            <fieldset className="space-y-2" disabled={loading}>
              <legend className="text-sm font-medium">Event type</legend>
              <RadioGroup
                value={type}
                onValueChange={(value) => {
                  setType(value as "sales" | "returns");
                  resetPreview();
                }}
                className="grid grid-cols-2 gap-2"
              >
                <Label htmlFor="import-sales" className="flex min-h-10 items-center gap-2 rounded-lg border bg-background px-3 font-normal has-data-checked:border-primary has-data-checked:bg-indigo-50">
                  <RadioGroupItem id="import-sales" value="sales" /> Sales
                </Label>
                <Label htmlFor="import-returns" className="flex min-h-10 items-center gap-2 rounded-lg border bg-background px-3 font-normal has-data-checked:border-primary has-data-checked:bg-indigo-50">
                  <RadioGroupItem id="import-returns" value="returns" /> Returns
                </Label>
              </RadioGroup>
            </fieldset>
            <div className="space-y-2">
              <Label htmlFor="import-file">Spreadsheet</Label>
              <Input id="import-file" name="file" type="file" accept=".xlsx,.csv" required disabled={loading} onChange={resetPreview} className="file:text-primary" />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <FileSpreadsheet data-icon="inline-start" />}
              {loading ? "Working…" : "Preview upload"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {status && (
        <Alert variant={statusKind === "error" ? "destructive" : "default"} className={statusKind === "success" ? "border-emerald-200 bg-emerald-50" : undefined}>
          {statusKind === "success" ? <CheckCircle2 className="text-emerald-600" /> : <AlertCircle />}
          <AlertTitle>{statusKind === "success" ? "Ready" : "Import issue"}</AlertTitle>
          <AlertDescription className={statusKind === "success" ? "text-emerald-700" : undefined}>{status}</AlertDescription>
        </Alert>
      )}

      {preview && (
        <Card className="shadow-sm shadow-slate-200/40">
          <CardHeader className="border-b">
            <CardTitle>Import preview</CardTitle>
            <CardDescription>{preview.filename} · {preview.format.toUpperCase()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ["Rows", preview.rows],
                ["Total quantity", preview.totalQuantity],
                ["Mapped", mapped],
                ["Unmapped", preview.rows - mapped],
                ["Invoice value", `₹${(preview.grossInvoicePaise / 100).toFixed(2)}`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border bg-muted/25 p-4">
                  <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
                  <dd className="num mt-1 text-xl font-semibold">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">File hash:</span> <span className="break-all font-mono">{preview.hash}</span>
            </div>

            {(preview.errors.length > 0 || preview.duplicates.length > 0) && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertTitle>Resolve before committing</AlertTitle>
                <AlertDescription>
                  {preview.errors.map((error) => <p key={error}>{error}</p>)}
                  {preview.duplicates.map((duplicate) => <p key={duplicate.identity}>{duplicate.identity}: {duplicate.count} duplicate rows</p>)}
                </AlertDescription>
              </Alert>
            )}

            {unmappedSales > 0 && (
              <Label htmlFor="acknowledge-unmapped" className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 font-normal text-amber-900">
                <Checkbox
                  id="acknowledge-unmapped"
                  checked={acknowledgeUnmappedSales}
                  onCheckedChange={(checked) => setAcknowledgeUnmappedSales(checked === true)}
                  className="mt-0.5"
                />
                <span className="text-sm leading-5">
                  I understand {unmappedSales} unmapped sale event{unmappedSales !== 1 ? "s" : ""} will be recorded without changing stock.
                </span>
              </Label>
            )}

            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="pl-4">Sub-order</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="w-[280px] pr-4">Product association</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={`${row.identity}:${row.sourceRow}`}>
                      <TableCell className="pl-4 font-medium">{row.subOrderNumber}</TableCell>
                      <TableCell className="text-muted-foreground">{row.date}</TableCell>
                      <TableCell className="num text-right">{row.quantity}</TableCell>
                      <TableCell className="pr-4">
                        <Label className="sr-only" htmlFor={`product-${row.sourceRow}`}>Product for {row.subOrderNumber}</Label>
                        <Select
                          value={associations[row.identity] || unmappedValue}
                          onValueChange={(value) => setAssociations((current) => ({
                            ...current,
                            [row.identity]: value === unmappedValue ? "" : value,
                          }))}
                        >
                          <SelectTrigger id={`product-${row.sourceRow}`} className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={unmappedValue}>Unmapped</SelectItem>
                            {products.map((product) => <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {pages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <Button type="button" variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((current) => current - 1)}>
                      <ArrowLeft data-icon="inline-start" /> Previous
                    </Button>
                  </PaginationItem>
                  <PaginationItem>
                    <span className="px-3 text-sm text-muted-foreground">Page {page + 1} of {pages}</span>
                  </PaginationItem>
                  <PaginationItem>
                    <Button type="button" variant="outline" size="sm" disabled={page + 1 >= pages} onClick={() => setPage((current) => current + 1)}>
                      Next <ArrowRight data-icon="inline-end" />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}

            <div className="flex flex-col gap-2 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                {!connected ? "Connect MongoDB to commit this import." : "Committing creates audited inventory events."}
              </p>
              <Button type="button" disabled={!valid || loading} onClick={commit}>
                {loading && <LoaderCircle className="animate-spin" data-icon="inline-start" />}
                {loading ? "Working…" : "Commit import"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
