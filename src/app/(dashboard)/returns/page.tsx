import { PageHeader, StatusBadge, TableEmpty } from "@/components/dashboard-ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OperationForm } from "@/features/operations/forms";
import { products, returnQcRecords } from "@/lib/server/reads";

export default async function Returns() {
  const [rows, productRows] = await Promise.all([returnQcRecords(), products()]);
  const pendingReturns = rows
    .filter((row) => row.status !== "completed")
    .map((row) => ({ returnId: row.returnId, productId: row.productId ?? "", quantity: row.quantity }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Quality control"
        title="Returns & QC"
        description="Review returned items before moving them back into available or damaged stock."
      />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <Card className="shadow-sm shadow-slate-200/40">
          <CardHeader className="border-b">
            <CardTitle>Return quality checks</CardTitle>
            <CardDescription>{pendingReturns.length} return{pendingReturns.length !== 1 ? "s" : ""} awaiting review</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4">Return</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="pr-4 text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length ? rows.map((row) => (
                  <TableRow key={row.returnId}>
                    <TableCell className="pl-4 font-medium">{row.returnId}</TableCell>
                    <TableCell className="num text-right">{row.quantity}</TableCell>
                    <TableCell className="pr-4 text-right"><StatusBadge status={row.status} /></TableCell>
                  </TableRow>
                )) : <TableEmpty colSpan={3}>No return QC records yet.</TableEmpty>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <OperationForm
          kind="qc"
          products={productRows.map((product) => ({ id: product.id, name: product.name }))}
          pendingReturns={pendingReturns}
          disabled={!process.env.MONGODB_URI}
        />
      </div>
    </div>
  );
}
