import { PageHeader, TableEmpty } from "@/components/dashboard-ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OperationForm } from "@/features/operations/forms";
import { products, stockMovements } from "@/lib/server/reads";

const fmt = (iso: string | null) => iso ? new Date(iso).toLocaleDateString("en-IN") : "—";

export default async function Purchases() {
  const [allProducts, rows] = await Promise.all([products(), stockMovements()]);
  const productMap = Object.fromEntries(allProducts.map((product) => [product.id, product.name]));
  const purchases = rows.filter((row) => row.source === "purchase");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inbound inventory"
        title="Purchases & receipts"
        description="Record incoming stock and review the audited receipt history."
      />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(340px,0.8fr)_minmax(0,1.2fr)]">
        <OperationForm kind="purchase" products={allProducts.map((product) => ({ id: product.id, name: product.name }))} disabled={!process.env.MONGODB_URI} />
        <Card className="shadow-sm shadow-slate-200/40">
          <CardHeader className="border-b">
            <CardTitle>Purchase history</CardTitle>
            <CardDescription>{purchases.length} receipt{purchases.length !== 1 ? "s" : ""} recorded</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4">Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="pr-4">Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.length ? purchases.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="pl-4 text-muted-foreground">{fmt(row.createdAt)}</TableCell>
                    <TableCell className="font-medium">{productMap[row.productId] ?? row.productId}</TableCell>
                    <TableCell className="num text-right">{row.delta ?? "—"}</TableCell>
                    <TableCell className="max-w-64 truncate pr-4 text-muted-foreground">{row.reason ?? "—"}</TableCell>
                  </TableRow>
                )) : <TableEmpty colSpan={4}>No purchase movements yet.</TableEmpty>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
